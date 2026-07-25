import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { slugFromHost, DEFAULT_TENANT_SLUG } from "./tenant";
import { rateLimit, clientIp } from "./rateLimit";
import { verifyOtp } from "./otp";

// Host → tenant used by both credential providers (café subdomain, else default).
async function tenantForHost(host) {
  const slug = slugFromHost(host || "");
  if (slug) return prisma.tenant.findUnique({ where: { slug } });
  return (
    (await prisma.tenant.findUnique({ where: { slug: DEFAULT_TENANT_SLUG } })) ||
    (await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } }))
  );
}

const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// Opt-in: when COOKIE_DOMAIN is set (e.g. ".shoku.maplestudios.co.in"), the
// auth cookies are shared across all café subdomains so logins work everywhere.
// When unset (local dev / single host), NextAuth's host-only defaults are used.
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || "";
const crossSub = !!COOKIE_DOMAIN;
const crossSubCookies = {
  sessionToken: { name: "__Secure-next-auth.session-token", options: { httpOnly: true, sameSite: "lax", path: "/", secure: true, domain: COOKIE_DOMAIN } },
  callbackUrl: { name: "__Secure-next-auth.callback-url", options: { sameSite: "lax", path: "/", secure: true, domain: COOKIE_DOMAIN } },
  csrfToken: { name: "__Secure-next-auth.csrf-token", options: { httpOnly: true, sameSite: "lax", path: "/", secure: true, domain: COOKIE_DOMAIN } },
};

export const authOptions = {
  session: { strategy: "jwt" },
  ...(crossSub ? { useSecureCookies: true, cookies: crossSubCookies } : {}),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds, req) {
        if (!creds?.email || !creds?.password) return null;
        const email = creds.email.toLowerCase();
        const host = req?.headers?.host || (typeof req?.headers?.get === "function" ? req.headers.get("host") : "") || "";
        const slug = slugFromHost(host);

        // Throttle credential stuffing / brute force: per IP+email, per host.
        const ip = clientIp(req);
        if (!rateLimit(`login:${ip}:${email}`, { limit: 8, windowMs: 60_000 }).ok) return null;

        let user = null;
        if (slug) {
          // Café subdomain: ONLY that café's own users may sign in here.
          // The platform superadmin is intentionally NOT allowed on café hosts.
          const tenant = await prisma.tenant.findUnique({ where: { slug } });
          if (tenant) {
            user = await prisma.user.findFirst({
              where: { email, tenantId: tenant.id, role: { not: "superadmin" } },
            });
          }
        } else {
          // Platform / apex host: the superadmin, else the default café's users.
          user = await prisma.user.findFirst({ where: { email, role: "superadmin" } });
          if (!user) {
            const tenant =
              (await prisma.tenant.findUnique({ where: { slug: DEFAULT_TENANT_SLUG } })) ||
              (await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } }));
            if (tenant) {
              user = await prisma.user.findFirst({
                where: { email, tenantId: tenant.id, role: { not: "superadmin" } },
              });
            }
          }
        }

        if (!user) return null;
        const ok = await bcrypt.compare(creds.password, user.password);
        if (!ok) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId };
      },
    }),
    // Phone OTP — diners only. Request a code via /api/auth/otp/request first.
    CredentialsProvider({
      id: "otp",
      name: "Phone OTP",
      credentials: { phone: { label: "Phone", type: "tel" }, code: { label: "Code", type: "text" } },
      async authorize(creds, req) {
        const host = req?.headers?.host || (typeof req?.headers?.get === "function" ? req.headers.get("host") : "") || "";
        const tenant = await tenantForHost(host);
        if (!tenant) return null;
        const user = await verifyOtp(tenant.id, creds?.phone, creds?.code);
        if (!user) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId };
      },
    }),
    // Google one-tap — enabled only when env keys exist. v1 limitation: signs
    // diners into the DEFAULT café (apex host); café subdomains use OTP/password.
    ...(googleEnabled
      ? [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
      : []),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    // Google diners: land in the default tenant as CUSTOMERS only. Google must
    // never authenticate a staff/owner/superadmin account — that would bypass the
    // password gate and grant admin access to anyone controlling a matching
    // Google email. If the email already belongs to a non-customer, refuse.
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      if (!user?.email) return false;
      const tenant = await tenantForHost("");
      if (!tenant) return false;
      const email = user.email.toLowerCase();
      // Never let a Google login shadow a platform superadmin (tenantId null).
      if (await prisma.user.findFirst({ where: { role: "superadmin", email }, select: { id: true } })) return false;
      const existing = await prisma.user.findFirst({ where: { tenantId: tenant.id, email } });
      if (existing && existing.role !== "customer") return false; // staff/owner must use password
      let dbUser = existing;
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: { tenantId: tenant.id, email, name: user.name || null, password: "", role: "customer", guest: false, points: 0 },
        });
      }
      user.id = dbUser.id; user.role = "customer"; user.tenantId = dbUser.tenantId;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token?.uid) session.user.id = token.uid;
        session.user.role = token.role || "customer";
        session.user.tenantId = token.tenantId ?? null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
