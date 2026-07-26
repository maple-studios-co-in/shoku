"use client";

import { useEffect } from "react";
import EnquiryForm from "@/components/EnquiryForm";
import { CONTACT } from "@/lib/contact";

const FEATURES = [
  ["食", "Your own branded app", "Your logo, colours and menu on your own subdomain — a fast mobile web app, no download. Customers see your café, not ours."],
  ["味", "AI ordering assistant", "Recommends by mood, diet, time of day and caffeine, then builds the cart — the upsell a printed menu never could."],
  ["菜", "Food intelligence", "Every item carries origin, ingredients, allergens and nutrition. Trust and upsell a QR menu can’t match."],
  ["話", "AI WhatsApp marketing", "AI-written, personalised campaigns to your regulars — with win-back and reward nudges that run themselves."],
  ["数", "AI analytics", "Revenue & MRR trends, a next-month forecast, at-risk alerts — with a plain-English “what changed” summary."],
  ["円", "0% commission", "A flat monthly fee, never a cut of your orders. You keep 100% of the value — and all of your customer data."],
];

const STEPS = [
  ["Onboard", "Set your brand, colours, menu and subdomain in the console."],
  ["Go live", "Your café launches on its own link with a starter menu and loyalty — in days."],
  ["Sell direct", "Guests order by QR or link. AI assists, loyalty brings them back, and the data stays yours."],
  ["Grow", "WhatsApp campaigns, sale banners and analytics drive repeat orders."],
];

const TESTI = [
  ["We dropped the delivery apps for our regulars. Shoku paid for itself in a month — and we finally own our customer list.", "Priya Nair", "Owner · Brew & Bloom", "1438761681033-6461ffad8d80"],
  ["The AI suggestions genuinely lift our average order. Customers add a pastry it recommends more often than not.", "Rohan Mehta", "Founder · Kaapi House", "1500648767791-00dcc994a43e"],
  ["Live in a week, on our own domain, in our own brand. It feels like an app we built, not a marketplace we rent.", "Ananya Rao", "Co-owner · Cardamom & Co.", "1544005313-94ddf0286df2"],
];

const PRICES = [
  ["Starter", "₹4,999", "/mo", "Single café, full storefront + core AI.", ["Branded ordering app", "AI ordering assistant", "Loyalty & QR tables", "Food intelligence"], false],
  ["Growth", "₹12,999", "/mo", "Multi-outlet, advanced AI & marketing.", ["Everything in Starter", "AI WhatsApp marketing", "AI analytics & forecast", "Sale banners & segments"], true],
  ["Enterprise", "Custom", "", "Chains, SLAs, custom domains.", ["Everything in Growth", "Custom domain & SSO", "Onboarding & success", "Priority support"], false],
];

// Illustrative café names (not real brands) — placeholders until we have signed,
// permission-granted customer logos to display.
const BRANDS = ["Brew & Bloom", "Kaapi House", "The Daily Grind", "Cardamom & Co.", "Filter Room", "Peaberry"];

const STATS = [
  { n: "0%", l: "commission, ever" },
  { n: "<7 days", pre: "<", suf: " days", to: 7, l: "to launch your app" },
  { n: "100%", suf: "%", to: 100, l: "your customer data" },
  { n: "24/7", l: "AI ordering" },
];

// Shoku's signature mark is a ramen swirl — a single continuous ink spiral.
// It draws itself on reveal; the hero version slowly turns, like steam off a bowl.
const SPIRAL = "M33.7 148.2 L35.8 150.8 L38.1 153.3 L40.4 155.7 L42.9 158.0 L45.4 160.2 L48.0 162.2 L50.7 164.2 L53.5 166.1 L56.3 167.8 L59.2 169.4 L62.1 170.9 L65.1 172.3 L68.2 173.5 L71.3 174.6 L74.4 175.6 L77.6 176.4 L80.8 177.1 L84.0 177.7 L87.2 178.2 L90.5 178.5 L93.7 178.6 L97.0 178.7 L100.2 178.6 L103.4 178.4 L106.6 178.0 L109.8 177.5 L112.9 176.9 L116.1 176.2 L119.1 175.3 L122.2 174.3 L125.2 173.2 L128.1 172.0 L131.0 170.6 L133.8 169.2 L136.5 167.6 L139.2 165.9 L141.8 164.1 L144.3 162.2 L146.7 160.2 L149.1 158.1 L151.3 156.0 L153.5 153.7 L155.5 151.4 L157.5 149.0 L159.3 146.5 L161.0 143.9 L162.7 141.3 L164.2 138.6 L165.6 135.8 L166.9 133.1 L168.0 130.2 L169.1 127.4 L170.0 124.4 L170.8 121.5 L171.5 118.5 L172.0 115.6 L172.5 112.6 L172.8 109.6 L173.0 106.5 L173.0 103.5 L173.0 100.5 L172.8 97.5 L172.5 94.6 L172.0 91.6 L171.5 88.7 L170.8 85.8 L170.0 82.9 L169.1 80.1 L168.1 77.3 L167.0 74.6 L165.7 71.9 L164.4 69.3 L163.0 66.8 L161.4 64.3 L159.8 61.9 L158.0 59.5 L156.2 57.3 L154.3 55.1 L152.3 53.0 L150.2 51.0 L148.0 49.1 L145.8 47.3 L143.5 45.5 L141.2 43.9 L138.7 42.4 L136.3 41.0 L133.7 39.7 L131.2 38.5 L128.5 37.4 L125.9 36.4 L123.2 35.5 L120.5 34.8 L117.8 34.1 L115.0 33.6 L112.2 33.2 L109.5 32.9 L106.7 32.7 L103.9 32.6 L101.1 32.7 L98.4 32.8 L95.6 33.1 L92.9 33.5 L90.2 34.0 L87.5 34.6 L84.9 35.3 L82.3 36.1 L79.7 37.0 L77.2 38.1 L74.7 39.2 L72.3 40.4 L70.0 41.7 L67.7 43.1 L65.4 44.6 L63.3 46.2 L61.2 47.9 L59.2 49.7 L57.2 51.5 L55.4 53.4 L53.6 55.4 L51.9 57.4 L50.3 59.5 L48.8 61.7 L47.4 63.9 L46.1 66.2 L44.9 68.5 L43.8 70.8 L42.8 73.2 L41.8 75.7 L41.0 78.1 L40.3 80.6 L39.7 83.1 L39.2 85.6 L38.8 88.2 L38.5 90.7 L38.4 93.3 L38.3 95.8 L38.3 98.4 L38.4 100.9 L38.7 103.4 L39.0 105.9 L39.5 108.4 L40.0 110.8 L40.6 113.3 L41.4 115.7 L42.2 118.0 L43.1 120.3 L44.2 122.6 L45.3 124.8 L46.5 127.0 L47.7 129.1 L49.1 131.1 L50.6 133.1 L52.1 135.0 L53.7 136.8 L55.3 138.6 L57.1 140.3 L58.9 141.9 L60.7 143.5 L62.6 145.0 L64.6 146.3 L66.6 147.6 L68.7 148.8 L70.8 149.9 L72.9 151.0 L75.1 151.9 L77.3 152.8 L79.6 153.5 L81.8 154.2 L84.1 154.7 L86.4 155.2 L88.7 155.5 L91.0 155.8 L93.3 156.0 L95.7 156.1 L98.0 156.0 L100.3 155.9 L102.6 155.7 L104.8 155.4 L107.1 155.0 L109.3 154.6 L111.5 154.0 L113.7 153.3 L115.8 152.6 L117.9 151.7 L120.0 150.8 L122.0 149.8 L124.0 148.7 L125.9 147.6 L127.7 146.4 L129.5 145.1 L131.3 143.7 L132.9 142.2 L134.5 140.7 L136.1 139.2 L137.6 137.6 L139.0 135.9 L140.3 134.2 L141.5 132.4 L142.7 130.6 L143.8 128.7 L144.8 126.8 L145.8 124.9 L146.6 122.9 L147.4 120.9 L148.1 118.9 L148.7 116.9 L149.2 114.8 L149.6 112.7 L149.9 110.7 L150.2 108.6 L150.3 106.5 L150.4 104.4 L150.4 102.3 L150.3 100.2 L150.1 98.2 L149.9 96.1 L149.5 94.1 L149.1 92.1 L148.6 90.1 L148.0 88.2 L147.3 86.3 L146.6 84.4 L145.8 82.5 L144.9 80.7 L143.9 79.0 L142.9 77.2 L141.8 75.6 L140.6 74.0 L139.4 72.4 L138.1 70.9 L136.8 69.4 L135.4 68.1 L133.9 66.7 L132.4 65.5 L130.9 64.3 L129.3 63.2 L127.7 62.1 L126.0 61.1 L124.3 60.2 L122.6 59.4 L120.8 58.6 L119.0 57.9 L117.2 57.3 L115.4 56.8 L113.6 56.3 L111.8 56.0 L109.9 55.7 L108.1 55.4 L106.2 55.3 L104.3 55.2 L102.5 55.2 L100.6 55.3 L98.8 55.5 L97.0 55.7 L95.2 56.0 L93.4 56.4 L91.7 56.9 L89.9 57.4 L88.2 58.0 L86.6 58.6 L84.9 59.4 L83.3 60.1 L81.8 61.0 L80.2 61.9 L78.8 62.9 L77.3 63.9 L76.0 65.0 L74.6 66.1 L73.4 67.3 L72.1 68.5 L71.0 69.8 L69.9 71.1 L68.8 72.5 L67.8 73.9 L66.9 75.3 L66.0 76.8 L65.2 78.3 L64.5 79.8 L63.8 81.4 L63.2 82.9 L62.7 84.5 L62.2 86.1 L61.8 87.7 L61.5 89.3 L61.2 90.9 L61.1 92.6 L60.9 94.2 L60.9 95.8 L60.9 97.4 L61.0 99.1 L61.1 100.7 L61.3 102.2 L61.6 103.8 L61.9 105.4 L62.3 106.9 L62.8 108.4 L63.3 109.9 L63.9 111.4 L64.5 112.8 L65.2 114.2 L65.9 115.5 L66.7 116.8 L67.6 118.1 L68.5 119.4 L69.4 120.6 L70.4 121.7 L71.5 122.8 L72.5 123.9 L73.6 124.9 L74.8 125.8 L76.0 126.7 L77.2 127.6 L78.4 128.4 L79.7 129.1 L81.0 129.8 L82.3 130.4 L83.6 131.0 L85.0 131.5 L86.3 132.0 L87.7 132.4 L89.1 132.7 L90.5 133.0 L91.9 133.2 L93.3 133.4 L94.7 133.5 L96.1 133.5 L97.5 133.5 L98.9 133.4 L100.2 133.3 L101.6 133.1 L102.9 132.9 L104.3 132.6 L105.6 132.2 L106.9 131.8 L108.1 131.4 L109.4 130.9 L110.6 130.3 L111.8 129.7 L112.9 129.1 L114.0 128.4 L115.1 127.6 L116.2 126.9 L117.2 126.1 L118.1 125.2 L119.1 124.3 L120.0 123.4 L120.8 122.5 L121.6 121.5 L122.4 120.5 L123.1 119.5 L123.7 118.4 L124.3 117.3 L124.9 116.2 L125.4 115.1 L125.9 114.0 L126.3 112.9 L126.7 111.7 L127.0 110.5 L127.3 109.4 L127.5 108.2 L127.7 107.0 L127.8 105.9 L127.9 104.7 L127.9 103.5 L127.9 102.4 L127.8 101.2 L127.7 100.1 L127.5 98.9 L127.3 97.8 L127.0 96.7 L126.7 95.6 L126.4 94.6 L126.0 93.5 L125.5 92.5 L125.1 91.5 L124.6 90.5 L124.0 89.6 L123.4 88.7 L122.8 87.8 L122.2 87.0 L121.5 86.1 L120.8 85.3 L120.1 84.6 L119.3 83.9 L118.5 83.2 L117.7 82.6 L116.9 82.0 L116.0 81.4 L115.1 80.9 L114.3 80.4 L113.4 79.9 L112.4 79.5 L111.5 79.2 L110.6 78.8 L109.6 78.6 L108.7 78.3 L107.8 78.1 L106.8 78.0 L105.9 77.8 L104.9 77.8 L104.0 77.7 L103.0 77.7 L102.1 77.8 L101.2 77.9 L100.3 78.0 L99.4 78.1 L98.5 78.3 L97.6 78.5 L96.7 78.8 L95.9 79.1 L95.1 79.4 L94.3 79.8 L93.5 80.2 L92.8 80.6 L92.0 81.1 L91.3 81.5 L90.6 82.0 L90.0 82.6 L89.3 83.1 L88.7 83.7 L88.2 84.3 L87.6 84.9 L87.1 85.5 L86.6 86.2 L86.2 86.8 L85.8 87.5 L85.4 88.2 L85.0 88.9 L84.7 89.6 L84.4 90.3 L84.2 91.1 L84.0 91.8 L83.8 92.5 L83.6 93.2 L83.5 94.0 L83.4 94.7 L83.3 95.4 L83.3 96.1 L83.3 96.9 L83.3 97.6 L83.4 98.3 L83.5 99.0 L83.6 99.6 L83.7 100.3 L83.9 101.0 L84.1 101.6 L84.4 102.2 L84.6 102.9 L84.9 103.5 L85.2 104.0 L85.5 104.6 L85.8 105.1 L86.2 105.7 L86.6 106.2 L87.0 106.6 L87.4 107.1 L87.8 107.5 L88.3 107.9 L88.7 108.3 L89.2 108.7 L89.7 109.0 L90.1 109.3 L90.6 109.6 L91.1 109.9 L91.6 110.1 L92.2 110.4 L92.7 110.6 L93.2 110.7 L93.7 110.9 L94.2 111.0 L94.8 111.1 L95.3 111.1 L95.8 111.2 L96.3 111.2 L96.8 111.2 L97.3 111.2 L97.8 111.2 L98.3 111.1 L98.7 111.0 L99.2 110.9 L99.7 110.8 L100.1 110.6 L100.5 110.5 L100.9 110.3 L101.3 110.1 L101.7 109.9 L102.1 109.7 L102.5 109.4 L102.8 109.2 L103.1 108.9 L103.4 108.6 L103.7 108.3 L104.0 108.1 L104.3 107.8 L104.5 107.4 L104.7 107.1 L104.9 106.8 L105.1 106.5 L105.3 106.2 L105.4 105.8 L105.6 105.5 L105.7 105.2 L105.8 104.8 L105.8 104.5 L105.9 104.2 L105.9 103.8 L106.0 103.5 L106.0 103.2 L106.0 102.9 L105.9 102.6 L105.9 102.3 L105.9 102.0 L105.8 101.7 L105.7 101.4 L105.6 101.2 L105.5 100.9 L105.4 100.7 L105.3 100.4 L105.1 100.2 L105.0 100.0";
function Enso({ className = "" }) {
  return (
    <svg className={`enso ${className}`} viewBox="0 0 200 200" aria-hidden="true">
      <path d={SPIRAL} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength="1" />
    </svg>
  );
}

// Airy hero mark: the ramen spiral floating on a soft matcha glow — it draws in
// once, then turns very slowly, with faint steam rising. No heavy block.
function HeroMark() {
  return (
    <div className="heromark">
      <span className="hm-glow" />
      <svg className="hm-svg" viewBox="0 0 200 200" aria-hidden="true">
        <g className="hm-spin">
          <path className="hm-ink" d={SPIRAL} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength="1" />
          <circle className="hm-seed" cx="33.7" cy="148.2" r="4.6" />
        </g>
      </svg>
      <span className="hm-steam"><i /><i /><i /></span>
    </div>
  );
}

// Authentic Shoku app mockups — mirror the real menu UI (signature badge,
// veg mark, kcal·caffeine, ADD, cart bar) so the homepage shows the product,
// meandu-style, rather than invented screens.
function PhoneFrame({ children, className = "" }) {
  return (
    <div className={`ph ${className}`}>
      <span className="ph-notch" />
      <div className="ph-screen">{children}</div>
    </div>
  );
}

const MENU_ITEMS = [
  ["Hojicha Latte", true, "180 kcal · 60mg", "₹320", "linear-gradient(135deg,#d8c4a0,#b98f57)", true],
  ["Matcha Cloud", true, "150 kcal · 70mg", "₹340", "linear-gradient(135deg,#9ec88f,#4e8f5a)", false],
  ["Miso Sesame Cookie", true, "210 kcal · 0mg", "₹140", "linear-gradient(135deg,#e3b475,#c2643c)", false],
];

function MenuPhone() {
  return (
    <PhoneFrame className="ph-menu">
      <div className="mapp-top">
        <span className="mapp-brand">shoku<i>食</i></span>
        <span className="mapp-table">🍽 Table 4</span>
      </div>
      <div className="mchips">
        {["All", "Coffee", "Matcha", "Bakery"].map((c, i) => (
          <span key={c} className={`mchip ${i === 0 ? "on" : ""}`}>{c}</span>
        ))}
      </div>
      <div className="mrail-lab">Signature picks</div>
      <div className="mlist">
        {MENU_ITEMS.map(([name, veg, meta, price, sw, sig]) => (
          <div className="mitem" key={name}>
            <span className="mthumb" style={{ background: sw }} />
            <div className="mmid">
              <div className="mname">{name}{sig && <span className="msig">★ SIGNATURE</span>}</div>
              <div className="mveg"><span className="vdot" data-veg={veg ? "1" : "0"} />{veg ? "Veg" : "Non-veg"}</div>
              <div className="mmeta">{meta}</div>
            </div>
            <div className="mright">
              <span className="mprice">{price}</span>
              <span className="madd">ADD +</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mcart"><b>2 items</b> · ₹460<span className="mcart-go">View cart →</span></div>
    </PhoneFrame>
  );
}

function AIPhone() {
  return (
    <PhoneFrame className="ph-ai">
      <div className="ai-top"><span className="ai-mk">✦</span> Shoku AI</div>
      <div className="ai-chat">
        <div className="bub user">Something light and low-caffeine for the afternoon?</div>
        <div className="bub bot">Try the <b>Hojicha Latte</b> — roasty, only 60mg caffeine — with a Miso Sesame Cookie. Want me to add them?</div>
        <div className="ai-card">
          <span className="ai-cthumb" style={{ background: "linear-gradient(135deg,#d8c4a0,#b98f57)" }} />
          <div className="ai-cmid"><div className="ai-cname">Hojicha Latte</div><div className="ai-cmeta">180 kcal · 60mg</div></div>
          <span className="ai-cadd">Add</span>
        </div>
        <div className="bub user thin">Perfect — add both ✨</div>
      </div>
      <div className="ai-input"><span>Ask Shoku anything…</span><span className="ai-send">↑</span></div>
    </PhoneFrame>
  );
}

export default function Landing() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scroll reveal
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((e) => io.observe(e));

    // CountUp — animate stat numbers into view (reactbits-style)
    const nums = document.querySelectorAll(".num[data-to]");
    const cio = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target, to = +el.dataset.to, pre = el.dataset.pre || "", suf = el.dataset.suf || "";
      if (reduce) { el.textContent = pre + to + suf; return; }
      const dur = 1200, t0 = performance.now();
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / dur), e2 = 1 - Math.pow(1 - k, 3);
        el.textContent = pre + Math.round(to * e2) + suf;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), { threshold: 0.6 });
    nums.forEach((n) => cio.observe(n));

    // Spotlight — pointer-follow highlight on feature cards (reactbits-style)
    const cards = document.querySelectorAll(".fcard");
    const onMove = (ev) => {
      const c = ev.currentTarget, r = c.getBoundingClientRect();
      c.style.setProperty("--mx", `${ev.clientX - r.left}px`);
      c.style.setProperty("--my", `${ev.clientY - r.top}px`);
    };
    if (!reduce) cards.forEach((c) => c.addEventListener("pointermove", onMove));

    // Scroll progress bar
    const onScroll = () => {
      const p = document.querySelector(".prog");
      if (p) p.style.width = (window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100) + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cards.forEach((c) => c.removeEventListener("pointermove", onMove));
    };
  }, []);

  return (
    <div className="lp">
      <div className="prog" />

      <nav className="nav">
        <a className="brand" href="#top"><img src="/shoku-mark.svg" alt="" /> <span>shoku<i className="shiny">食</i></span></a>
        <div className="links">
          <a href="#features">Product</a><a href="#how">How it works</a><a href="#pricing">Pricing</a>
        </div>
        <a className="btn cta" href="/demo">Book a demo</a>
      </nav>

      {/* HERO */}
      <header className="hero" id="top">
        <div className="hcopy reveal">
          <div className="eyebrow">食 · AI ordering for cafés</div>
          <h1>Your café.<br />Your brand.<br /><em>Zero commission.</em></h1>
          <p className="lede">Shoku gives every café a branded ordering app — menu, loyalty, AI recommendations and WhatsApp marketing — for a flat fee, not a 20–30% aggregator cut. Own your customers, your data, your margin.</p>
          <div className="c-row">
            <a className="btn cta lg" href="/demo">Book a demo</a>
            <a className="btn ghost lg" href="#how">See how it works →</a>
          </div>
          <div className="trust">No commission · Live in days · 100% your customer data</div>
        </div>
        <div className="hvisual reveal">
          <div className="hero-stage">
            <img className="hero-bg" src="/img/shoku-hero-cafe.webp" alt="A guest at a sunlit café ordering on their phone, matcha latte and croissant on the table" />
            <img className="hero-phone" src="/img/snap-menu.webp" alt="The Shoku ordering app — Brew & Bloom menu screen" />
            <span className="hero-logo"><img src="/shoku-mark.svg" alt="" /> shoku<i>食</i></span>
          </div>
        </div>
      </header>

      {/* LOGOS */}
      <section className="logos reveal">
        <div className="lab">Built for independent cafés &amp; growing chains</div>
        <div className="logo-marquee">
          <div className="logo-track">
            {[...BRANDS, ...BRANDS].map((b, i) => <span className="brandname" key={i}>{b}</span>)}
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="manifesto reveal">
        <div className="mk">一</div>
        <h2>Aggregators rent you your own customers.<br /><em>Shoku hands them back.</em></h2>
        <p>One platform: a branded app your regulars love, an AI layer no marketplace gives you, and the marketing engine to bring them back — without surrendering a cut of every order.</p>
      </section>

      {/* PRODUCT SHOWCASE — meandu-style */}
      <section className="product" id="product">
        <div className="prod-copy reveal">
          <div className="eyebrow">The app</div>
          <h2>A storefront your regulars<br /><em>actually want to open.</em></h2>
          <p className="prod-lede">A real branded ordering app on your own subdomain, in your colours — signature picks, food intelligence on every item, and an AI that helps guests choose.</p>
          <ul className="prod-list">
            <li><span className="pck">食</span><div><b>Menu that sells</b><span>Signature tags, allergens, calories and caffeine on every item.</span></div></li>
            <li><span className="pck">味</span><div><b>AI that recommends</b><span>Mood, diet and time-of-day picks that lift average order value.</span></div></li>
            <li><span className="pck">卓</span><div><b>QR table ordering</b><span>Scan, order, pay — orders land tagged to the table, no app install.</span></div></li>
          </ul>
        </div>
        <div className="prod-stage reveal">
          <Enso className="prod-enso" />
          <img className="snap snap-a" src="/img/snap-menu.webp" alt="Shoku menu screen — Brew & Bloom, signature picks with prices" />
          <img className="snap snap-b" src="/img/snap-ai.webp" alt="Ask Shoku — the AI table host recommending a Hojicha Latte" />
        </div>
      </section>

      {/* LIFESTYLE */}
      <section className="life reveal">
        <div className="life-media">
          <img src="/img/shoku-flatlay-branded.webp" alt="The Shoku menu app open on a phone beside a matcha latte and croissant on a marble café table" />
          <span className="life-chip"><img src="/shoku-mark.svg" alt="" /> shoku · no app to download</span>
        </div>
        <div className="life-copy">
          <div className="eyebrow">For your guests</div>
          <h2>Your café, in their hands — <em>in seconds.</em></h2>
          <p>Scan the QR on the table, browse your menu, order and pay. No app to download, no aggregator in the middle — just your café and your regular.</p>
          <a className="btn cta lg" href="/demo">Book a demo</a>
        </div>
      </section>

      {/* FEATURES */}
      <section className="sec" id="features">
        <div className="center-head reveal">
          <div className="eyebrow">Why Shoku</div>
          <h2>Everything to sell direct — <em>minus the dev team.</em></h2>
        </div>
        <div className="fgrid">
          {FEATURES.map(([ic, h, p], i) => (
            <div className="fcard reveal" key={h} style={{ transitionDelay: `${(i % 3) * 70}ms` }}>
              <div className="fic">{ic}</div>
              <h3>{h}</h3><p>{p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section className="how" id="how">
        <Enso className="how-enso" />
        <div className="center-head light reveal">
          <div className="eyebrow light">How it works</div>
          <h2>From signup to a live branded app — <em>in days.</em></h2>
        </div>
        <div className="steps">
          {STEPS.map(([h, p], i) => (
            <div className="step reveal" key={h} style={{ transitionDelay: `${i * 70}ms` }}>
              <span className="num">{i + 1}</span><h3>{h}</h3><p>{p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="statband reveal">
        {STATS.map((s) => (
          <div className="sbi" key={s.l}>
            <div className="num" data-to={s.to} data-pre={s.pre} data-suf={s.suf}>{s.n}</div>
            <div className="lbl">{s.l}</div>
          </div>
        ))}
      </section>

      {/* CONTINUOUS INNOVATION — rounded panel; corner-badged floating cards (matches brand banner) */}
      <section className="innov-wrap">
        <div className="innov reveal">
          <div className="innov-copy">
            <h2>Continuous Innovation</h2>
            <p>We continuously improve your branded café app with smarter recommendations, menu updates, loyalty flows, and WhatsApp marketing — so your ordering experience keeps getting better.</p>
          </div>
          <div className="innov-stage">
            <img className="innov-illo" src="/img/shoku-barista-illo.webp" alt="A barista checking the Shoku app on her phone" />

            <div className="fcloud fc-a">
              <span className="fbadge b-tl">✦</span>
              <b>AI Recommendation</b>
              <div className="fc-media">
                <img src="https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=200&h=200&fit=crop&q=80" alt="" />
                <span className="fc-lines"><i className="fc-line" /><i className="fc-line short" /></span>
              </div>
            </div>

            <div className="fcloud fc-c">
              <b>New on the Menu</b>
              <div className="fc-media">
                <img src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&h=200&fit=crop&crop=entropy&q=80" alt="" />
                <span className="fc-lines"><i className="fc-line" /><i className="fc-line short" /></span>
              </div>
              <small className="clay">Rs 240</small>
              <span className="fbadge b-br">☕</span>
            </div>

            <div className="fcloud fc-b">
              <span className="fbadge b-tl">🎁</span>
              <b>Loyalty Rewards</b>
              <small>You earned <em>150</em> points</small>
              <span className="fc-dots"><i className="on" /><i className="on" /><i className="on" /><i className="on" /><i /></span>
            </div>

            <div className="fcloud fc-d">
              <div className="fc-head"><span className="wa-ic">✆</span><b>WhatsApp Campaign</b></div>
              <div className="fc-media">
                <span className="fc-lines"><i className="fc-line" /><i className="fc-line short" /></span>
                <span className="fc-bars"><i style={{ height: 7 }} /><i style={{ height: 12 }} /><i style={{ height: 17 }} /></span>
              </div>
            </div>

            <span className="spark s1">✦</span>
            <span className="spark s2">✦</span>
            <span className="spark s3">✦</span>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="sec">
        <div className="center-head reveal">
          <div className="eyebrow">What operators say</div>
          <h2>Loved by café owners.</h2>
        </div>
        <div className="tgrid">
          {TESTI.map(([q, n, r, img], i) => (
            <div className="tcard reveal" key={n} style={{ transitionDelay: `${(i % 3) * 70}ms` }}>
              <div className="stars">★★★★★</div>
              <p className="q">“{q}”</p>
              <div className="who"><img src={`https://images.unsplash.com/photo-${img}?w=120&h=120&fit=crop&crop=faces`} alt="" /><div><b>{n}</b><span>{r}</span></div></div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="sec" id="pricing">
        <div className="center-head reveal">
          <div className="eyebrow">Pricing</div>
          <h2>Flat SaaS. <em>Zero per-order commission.</em></h2>
          <p>Pick a plan, launch your app, keep 100% of every order. Cancel anytime.</p>
        </div>
        <div className="pgrid">
          {PRICES.map(([name, price, per, desc, feats, pop]) => (
            <div className={`price reveal ${pop ? "pop" : ""}`} key={name}>
              {pop && <div className="badge">Most popular</div>}
              <h3>{name}</h3>
              <div className="amt">{price}<span>{per}</span></div>
              <p className="pdesc">{desc}</p>
              <ul>{feats.map((f) => <li key={f}><span className="ck">✓</span>{f}</li>)}</ul>
              <a className={`btn ${pop ? "cta" : "ghost"} full`} href="/demo">Book a demo</a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA / LIVE DEMO & SALES ENQUIRIES */}
      <section className="cta-band reveal" id="contact">
        <Enso className="cta-enso" />
        <div className="mk light">食</div>
        <h2>Own your table.</h2>
        <p>Flip through the product brochure, or tell us about your café — we’ll spin up a branded preview and walk you through it in a 20-minute live demo.</p>
        <a className="btn white lg" href="/demo">View the brochure →</a>
        <div className="contact-wrap">
          <EnquiryForm />
          <div className="direct">
            <span className="direct-lab">Prefer to talk?</span>
            <a href={`mailto:${CONTACT.email}`}>✉ {CONTACT.email}</a>
            <span className="direct-sep">·</span>
            <a href={`tel:${CONTACT.phoneHref}`}>✆ {CONTACT.phone}</a>
          </div>
        </div>
      </section>

      <footer className="foot">
        <div className="fbrand"><img src="/shoku-mark.svg" alt="" /> <span>shoku<i>食</i></span></div>
        <div className="fcols">
          <div><h4>Product</h4><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#how">How it works</a></div>
          <div><h4>Company</h4><a href="#top">About</a><a href="#contact">Contact</a><a href="#top">Privacy</a></div>
          <div><h4>Get started</h4><a href="/demo">View the brochure</a><a href="#contact">Get a live demo</a><a href="/login">Sign in</a></div>
        </div>
        <div className="fbot">© 2026 Shoku · getshoku.com · 食 Own your table</div>
      </footer>

      <style jsx global>{`
        .lp {
          --paper:#f6f2ea; --cream:#efe9dd; --ink:#1b1813; --mut:#6f6557; --line:#e4ddd0;
          --matcha:#3a6b4d; --matcha-d:#244635; --matcha-dd:#15281e; --clay:#c2643c; --gold:#c69a4c; --mist:#a9c8b4; --tint:#eaf1ea;
          --serif:var(--font-serif,"Fraunces",Georgia,serif); --sans:var(--font-sans,"Inter",system-ui,sans-serif);
          color:var(--ink); background:var(--paper); font-family:var(--sans); line-height:1.6; overflow-x:hidden;
        }
        .lp *{ box-sizing:border-box; }
        .lp a{ text-decoration:none; color:inherit; }
        .lp em{ font-style:italic; color:var(--clay); }
        .lp .prog{ position:fixed; top:0; left:0; height:3px; width:0; background:linear-gradient(90deg,var(--matcha),var(--clay)); z-index:300; }
        .lp .reveal{ opacity:0; transform:translateY(18px); transition:opacity .7s ease, transform .7s cubic-bezier(.2,.7,.3,1); }
        .lp .reveal.in{ opacity:1; transform:none; }

        /* ENSO — signature ink circle */
        .lp .enso{ position:absolute; width:100%; height:100%; pointer-events:none; }
        .lp .enso path{ stroke:var(--matcha); stroke-width:2.3; opacity:.4; fill:none; }
        .lp .reveal .enso path, .lp .hero-enso path{ stroke-dasharray:1; stroke-dashoffset:1; transition:stroke-dashoffset 1.6s cubic-bezier(.6,.1,.2,1); }
        .lp .in .enso path, .lp .hero .in.hvisual .hero-enso path{ stroke-dashoffset:0; }
        .lp .hero-enso path{ stroke-dashoffset:0; animation:draw 1.8s cubic-bezier(.6,.1,.2,1) both; }
        @keyframes draw{ from{ stroke-dashoffset:1; } to{ stroke-dashoffset:0; } }

        /* BUTTONS */
        .lp .btn{ display:inline-flex; align-items:center; gap:8px; font-weight:600; font-size:14px; padding:12px 20px; border-radius:999px; cursor:pointer; transition:transform .15s, background .2s, border-color .2s, color .2s; }
        .lp .btn.cta{ background:var(--matcha); color:#fff; box-shadow:0 10px 26px rgba(36,70,53,.26); }
        .lp .btn.cta:hover{ background:var(--matcha-d); transform:translateY(-1px); }
        .lp .btn.ghost{ border:1px solid var(--line); background:rgba(255,255,255,.6); color:var(--ink); }
        .lp .btn.ghost:hover{ border-color:var(--matcha); color:var(--matcha-d); }
        .lp .btn.white{ background:var(--paper); color:var(--matcha-d); }
        .lp .btn.white:hover{ transform:translateY(-1px); }
        .lp .btn.lg{ padding:15px 26px; font-size:15px; }
        .lp .btn.full{ width:100%; justify-content:center; margin-top:20px; }

        .lp .eyebrow{ display:inline-block; font-size:12px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:var(--matcha); margin-bottom:18px; }
        .lp .eyebrow.light{ color:var(--mist); }
        .lp .mk{ font-family:var(--serif); font-size:38px; color:var(--clay); opacity:.55; margin-bottom:8px; }
        .lp .mk.light{ color:var(--mist); opacity:.7; }

        /* NAV */
        .lp .nav{ position:sticky; top:0; z-index:100; display:flex; align-items:center; gap:24px; padding:16px 34px; background:rgba(246,242,234,.82); backdrop-filter:blur(14px); border-bottom:1px solid var(--line); }
        .lp .brand{ display:flex; align-items:center; gap:10px; font-family:var(--serif); font-weight:600; font-size:23px; letter-spacing:-.01em; }
        .lp .brand img{ width:30px; height:30px; }
        .lp .brand i{ font-style:normal; color:var(--clay); font-size:18px; margin-left:1px; }
        .lp .nav .links{ display:flex; gap:28px; margin-left:20px; font-size:14px; font-weight:500; color:var(--mut); }
        .lp .nav .links a:hover{ color:var(--ink); }
        .lp .nav .cta{ margin-left:auto; }

        /* HERO */
        .lp .hero{ max-width:1180px; margin:0 auto; padding:84px 34px 56px; display:grid; grid-template-columns:1.08fr .92fr; gap:56px; align-items:center; }
        .lp .hero h1{ font-family:var(--serif); font-size:62px; line-height:1.02; letter-spacing:-.02em; font-weight:500; margin:0 0 24px; }
        .lp .lede{ font-size:17.5px; color:var(--mut); max-width:50ch; margin:0 0 30px; }
        .lp .c-row{ display:flex; gap:14px; flex-wrap:wrap; }
        .lp .trust{ margin-top:22px; font-size:13px; font-weight:600; color:var(--mut); letter-spacing:.01em; }
        .lp .hvisual{ position:relative; display:grid; place-items:center; min-height:460px; }
        /* Hero = real café photo + real Shoku app mockup + logo lockup (brand integration) */
        .lp .hero-stage{ position:relative; width:min(430px,90%); }
        .lp .hero-bg{ display:block; width:100%; aspect-ratio:4/5; object-fit:cover; border-radius:30px; box-shadow:0 44px 100px rgba(30,45,30,.30); }
        .lp .hero-phone{ position:absolute; right:-7%; bottom:-6%; width:47%; z-index:2; filter:drop-shadow(0 26px 48px rgba(20,30,20,.45)); }
        .lp .hero-logo{ position:absolute; left:14px; top:14px; z-index:3; display:inline-flex; align-items:center; gap:7px; background:rgba(246,242,234,.92); backdrop-filter:blur(6px); padding:7px 14px 7px 9px; border-radius:999px; font-family:var(--serif); font-weight:600; font-size:15px; color:var(--ink); box-shadow:0 8px 22px rgba(20,30,20,.18); }
        .lp .hero-logo img{ width:22px; height:22px; }
        .lp .hero-logo i{ font-style:normal; color:var(--clay); font-size:12px; margin-left:1px; }
        .lp .heromark{ position:relative; width:min(440px,90%); aspect-ratio:1; display:grid; place-items:center; }
        .lp .hm-glow{ position:absolute; inset:3%; border-radius:50%;
          background:radial-gradient(circle at 50% 47%, rgba(47,107,79,.22), rgba(47,107,79,.07) 50%, transparent 70%);
          filter:blur(12px); animation:breathe 7.5s ease-in-out infinite; }
        .lp .hm-svg{ position:relative; width:100%; height:100%; overflow:visible; z-index:1; }
        .lp .hm-spin{ transform-origin:100px 100px; animation:turn 64s linear infinite; }
        .lp .hm-ink{ stroke:var(--matcha); stroke-width:2.3; opacity:.92;
          stroke-dasharray:1; stroke-dashoffset:1; animation:draw 3s cubic-bezier(.45,.05,.2,1) .35s forwards; }
        .lp .hm-seed{ fill:var(--clay); opacity:0; animation:seedin .8s 2.8s ease forwards; }
        @keyframes turn{ to{ transform:rotate(360deg); } }
        @keyframes breathe{ 0%,100%{ opacity:.68; transform:scale(1); } 50%{ opacity:1; transform:scale(1.05); } }
        @keyframes seedin{ to{ opacity:.85; } }
        .lp .hm-steam{ position:absolute; top:-4%; left:50%; transform:translateX(-50%); width:34%; height:40%; z-index:2; pointer-events:none; }
        .lp .hm-steam i{ position:absolute; bottom:0; width:3px; height:100%; border-radius:3px;
          background:linear-gradient(to top, rgba(159,199,176,0), rgba(159,199,176,.5), rgba(159,199,176,0)); opacity:0;
          animation:steam 4.4s ease-in-out infinite; }
        .lp .hm-steam i:nth-child(1){ left:28%; animation-delay:.5s; height:92%; }
        .lp .hm-steam i:nth-child(2){ left:50%; animation-delay:1.8s; }
        .lp .hm-steam i:nth-child(3){ left:72%; animation-delay:2.9s; height:84%; }
        @keyframes steam{ 0%{ opacity:0; transform:translateY(10px) scaleY(.8); } 35%{ opacity:.6; } 100%{ opacity:0; transform:translateY(-18px) scaleY(1.1); } }
        .lp .tagchip{ position:absolute; bottom:22px; z-index:3; background:var(--paper); color:var(--matcha-d); font-size:12.5px; font-weight:700; padding:9px 18px; border-radius:999px; box-shadow:0 12px 28px rgba(0,0,0,.14); letter-spacing:.04em; }

        /* LOGOS */
        .lp .logos{ max-width:1100px; margin:10px auto; padding:24px 34px; text-align:center; }
        .lp .logos .lab{ font-size:11.5px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--mut); margin-bottom:18px; }
        .lp .logo-marquee{ position:relative; overflow:hidden; -webkit-mask:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent); mask:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent); }
        .lp .logo-track{ display:flex; gap:56px; width:max-content; animation:marquee 34s linear infinite; }
        .lp .logos:hover .logo-track{ animation-play-state:paused; }
        @keyframes marquee{ to{ transform:translateX(-50%); } }
        .lp .brandname{ font-family:var(--serif); font-size:19px; font-weight:500; color:var(--matcha-d); opacity:.58; white-space:nowrap; }

        /* MANIFESTO */
        .lp .manifesto{ max-width:880px; margin:0 auto; padding:84px 34px; text-align:center; }
        .lp .manifesto h2{ font-family:var(--serif); font-size:42px; line-height:1.14; letter-spacing:-.015em; font-weight:500; margin:0 0 22px; }
        .lp .manifesto p{ font-size:18px; color:var(--mut); max-width:60ch; margin:0 auto; }

        /* SECTIONS */
        .lp .sec{ max-width:1120px; margin:0 auto; padding:88px 34px; }
        .lp .center-head{ text-align:center; max-width:64ch; margin:0 auto 52px; }
        .lp .center-head h2{ font-family:var(--serif); font-size:40px; line-height:1.12; letter-spacing:-.015em; font-weight:500; margin:0 0 14px; }
        .lp .center-head p{ font-size:16.5px; color:var(--mut); }
        .lp .center-head.light h2{ color:#fff; } .lp .center-head.light h2 em{ color:var(--mist); }
        .lp .center-head.light p{ color:#cfe0d2; }

        .lp .fgrid{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        .lp .fcard{ background:#fff; border:1px solid var(--line); border-radius:22px; padding:30px; transition:transform .25s, box-shadow .25s, border-color .25s; }
        .lp .fcard:hover{ transform:translateY(-5px); border-color:var(--mist); box-shadow:0 26px 54px rgba(36,70,53,.09); }
        .lp .fic{ width:54px; height:54px; border-radius:16px; background:var(--tint); display:grid; place-items:center; font-family:var(--serif); font-size:26px; color:var(--matcha-d); margin-bottom:20px; }
        .lp .fcard h3{ font-size:18px; font-weight:600; margin:0 0 9px; }
        .lp .fcard p{ font-size:14.5px; color:var(--mut); margin:0; }

        /* HOW */
        .lp .how{ position:relative; overflow:hidden; background:radial-gradient(120% 140% at 80% 0%,var(--matcha) 0%,var(--matcha-d) 48%,var(--matcha-dd) 100%); color:#fff; padding:96px 34px; }
        .lp .how-enso{ width:520px; height:520px; left:auto; right:-120px; top:-120px; }
        .lp .how-enso path{ stroke:var(--mist); opacity:.18; }
        .lp .how .center-head{ position:relative; z-index:1; margin-bottom:46px; }
        .lp .steps{ position:relative; z-index:1; max-width:1120px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr); gap:22px; }
        .lp .step{ background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.13); border-radius:20px; padding:28px; backdrop-filter:blur(2px); }
        .lp .step .num{ display:grid; place-items:center; width:44px; height:44px; border-radius:13px; background:var(--clay); color:#fff; font-family:var(--serif); font-weight:600; font-size:18px; margin-bottom:16px; }
        .lp .step h3{ margin:0 0 7px; font-size:17px; font-weight:600; } .lp .step p{ margin:0; font-size:13.5px; color:#cfe0d2; }

        /* STATS */
        .lp .statband{ max-width:1100px; margin:0 auto; padding:64px 34px; display:grid; grid-template-columns:repeat(4,1fr); gap:26px; }
        .lp .sbi{ text-align:center; }
        .lp .sbi .num{ font-family:var(--serif); font-size:46px; font-weight:500; color:var(--matcha); letter-spacing:-.02em; }
        .lp .sbi .lbl{ font-size:13px; color:var(--mut); margin-top:6px; }

        /* TESTI */
        .lp .tgrid{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
        .lp .tcard{ background:#fff; border:1px solid var(--line); border-radius:22px; padding:28px; display:flex; flex-direction:column; }
        .lp .stars{ color:var(--gold); letter-spacing:2px; font-size:14px; }
        .lp .tcard .q{ font-family:var(--serif); font-size:17px; line-height:1.5; margin:14px 0 20px; }
        .lp .who{ display:flex; align-items:center; gap:12px; margin-top:auto; }
        .lp .who img{ width:48px; height:48px; border-radius:50%; object-fit:cover; }
        .lp .who b{ display:block; font-size:14px; } .lp .who span{ font-size:12.5px; color:var(--mut); }

        /* PRICING */
        .lp .pgrid{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; align-items:start; }
        .lp .price{ background:#fff; border:1px solid var(--line); border-radius:24px; padding:32px; position:relative; }
        .lp .price.pop{ border:1.5px solid var(--matcha); box-shadow:0 28px 60px rgba(36,70,53,.12); }
        .lp .price .badge{ position:absolute; top:-13px; left:50%; transform:translateX(-50%); background:var(--matcha); color:#fff; font-size:11px; font-weight:700; letter-spacing:.04em; padding:6px 14px; border-radius:999px; }
        .lp .price h3{ font-size:19px; font-weight:600; margin:0 0 8px; }
        .lp .amt{ font-family:var(--serif); font-size:42px; font-weight:500; letter-spacing:-.02em; } .lp .amt span{ font-family:var(--sans); font-size:15px; font-weight:500; color:var(--mut); }
        .lp .pdesc{ font-size:13.5px; color:var(--mut); margin:10px 0 18px; }
        .lp .price ul{ list-style:none; padding:0; margin:0; }
        .lp .price li{ display:flex; align-items:center; gap:10px; font-size:14px; padding:7px 0; }
        .lp .price .ck{ color:var(--matcha); font-weight:900; }

        /* CTA */
        .lp .cta-band{ position:relative; overflow:hidden; max-width:1040px; margin:64px auto; padding:96px 40px; text-align:center; color:#fff; border-radius:34px;
          background:linear-gradient(180deg,rgba(20,38,28,.74),rgba(20,38,28,.90)), url('/img/shoku-cafe-real.webp') center/cover no-repeat; }
        .lp .cta-enso{ width:360px; height:360px; left:50%; top:50%; transform:translate(-50%,-50%); }
        .lp .cta-enso path{ stroke:var(--mist); opacity:.2; }
        .lp .cta-band > *{ position:relative; z-index:1; }
        .lp .cta-band h2{ font-family:var(--serif); font-size:48px; font-weight:500; letter-spacing:-.02em; margin:0 0 12px; }
        .lp .cta-band p{ font-size:16.5px; color:#cfe0d2; max-width:52ch; margin:0 auto 28px; }
        .lp .contact-wrap{ max-width:640px; margin:46px auto 0; text-align:left; }
        .lp .direct{ margin-top:22px; display:flex; justify-content:center; align-items:center; gap:12px; flex-wrap:wrap; font-size:14.5px; color:#cfe0d2; }
        .lp .direct-lab{ font-weight:700; color:var(--mist); }
        .lp .direct a{ font-weight:700; color:#fff; border-bottom:1px solid rgba(255,255,255,.35); padding-bottom:1px; }
        .lp .direct a:hover{ color:var(--mist); }
        .lp .direct-sep{ opacity:.5; }

        /* FOOTER */
        .lp .foot{ border-top:1px solid var(--line); padding:60px 34px 44px; max-width:1120px; margin:0 auto; }
        .lp .fbrand{ display:flex; align-items:center; gap:10px; font-family:var(--serif); font-weight:600; font-size:21px; } .lp .fbrand img{ width:28px; height:28px; } .lp .fbrand i{ font-style:normal; color:var(--clay); font-size:16px; }
        .lp .fcols{ display:flex; flex-wrap:wrap; gap:44px; margin:28px 0; }
        .lp .fcols h4{ font-size:11.5px; text-transform:uppercase; letter-spacing:.1em; color:var(--mut); margin:0 0 12px; }
        .lp .fcols a{ display:block; font-size:14px; color:var(--ink); padding:4px 0; } .lp .fcols a:hover{ color:var(--matcha); }
        .lp .fbot{ font-size:12.5px; color:var(--mut); border-top:1px solid var(--line); padding-top:20px; }

        /* PRODUCT SHOWCASE */
        .lp .product{ max-width:1180px; margin:0 auto; padding:96px 34px; display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; }
        .lp .prod-copy h2{ font-family:var(--serif); font-size:40px; line-height:1.12; letter-spacing:-.015em; font-weight:500; margin:0 0 18px; }
        .lp .prod-lede{ font-size:16.5px; color:var(--mut); margin:0 0 30px; max-width:46ch; }
        .lp .prod-list{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:20px; }
        .lp .prod-list li{ display:flex; gap:14px; align-items:flex-start; }
        .lp .pck{ width:44px; height:44px; border-radius:13px; background:var(--tint); color:var(--matcha-d); font-family:var(--serif); font-size:21px; display:grid; place-items:center; flex-shrink:0; }
        .lp .prod-list b{ display:block; font-size:15px; font-weight:600; } .lp .prod-list span{ font-size:14px; color:var(--mut); }

        /* PHONE MOCKUPS */
        .lp .prod-stage{ position:relative; display:flex; justify-content:center; align-items:center; min-height:580px; }
        .lp .prod-enso{ position:absolute; width:118%; height:118%; } .lp .prod-enso path{ opacity:.13; }
        /* Real app screenshots (transparent device-framed PNGs) */
        .lp .snap{ width:min(248px,72%); position:relative; flex-shrink:0; filter:drop-shadow(0 32px 62px rgba(20,30,20,.32)); transition:transform .4s cubic-bezier(.2,.7,.3,1); }
        .lp .snap-a{ transform:rotate(-4deg); z-index:2; }
        .lp .snap-b{ transform:rotate(4deg) translateY(34px) scale(.92); margin-left:-46px; z-index:1; }
        .lp .prod-stage:hover .snap-a{ transform:rotate(-4deg) translateY(-6px); }
        .lp .prod-stage:hover .snap-b{ transform:rotate(4deg) translateY(28px) scale(.92); }

        /* LIFESTYLE BAND */
        .lp .life{ max-width:1180px; margin:0 auto; padding:48px 34px; display:grid; grid-template-columns:.9fr 1.1fr; gap:60px; align-items:center; }
        .lp .life-media{ position:relative; justify-self:center; }
        .lp .life-media img{ width:min(380px,86%); aspect-ratio:928/1152; object-fit:cover; border-radius:32px; box-shadow:0 40px 90px rgba(30,45,30,.28); display:block; }
        .lp .life-chip{ position:absolute; bottom:18px; left:50%; transform:translateX(-50%); display:inline-flex; align-items:center; gap:7px; background:var(--paper); color:var(--matcha-d); font-size:12.5px; font-weight:700; padding:8px 16px 8px 10px; border-radius:999px; box-shadow:0 12px 28px rgba(0,0,0,.16); white-space:nowrap; }
        .lp .life-chip img{ width:18px; height:18px; }
        .lp .life-copy h2{ font-family:var(--serif); font-size:40px; line-height:1.12; letter-spacing:-.015em; font-weight:500; margin:0 0 18px; }
        .lp .life-copy p{ font-size:16.5px; color:var(--mut); margin:0 0 26px; max-width:48ch; }
        .lp .ph{ width:246px; border-radius:40px; background:#15120d; padding:10px; position:relative; box-shadow:0 34px 80px rgba(20,30,20,.30); flex-shrink:0; transition:transform .4s cubic-bezier(.2,.7,.3,1); }
        .lp .ph-notch{ position:absolute; top:16px; left:50%; transform:translateX(-50%); width:62px; height:6px; border-radius:999px; background:rgba(255,255,255,.22); z-index:3; }
        .lp .ph-screen{ background:var(--paper); border-radius:31px; overflow:hidden; height:500px; display:flex; flex-direction:column; padding:20px 14px 0; }
        .lp .ph-menu{ transform:rotate(-4deg); z-index:2; }
        .lp .ph-ai{ transform:rotate(4deg) translateY(36px) scale(.93); margin-left:-54px; z-index:1; }
        .lp .prod-stage:hover .ph-menu{ transform:rotate(-4deg) translateY(-6px); }
        .lp .prod-stage:hover .ph-ai{ transform:rotate(4deg) translateY(30px) scale(.93); }

        /* menu screen */
        .lp .mapp-top{ display:flex; align-items:center; justify-content:space-between; padding-top:4px; }
        .lp .mapp-brand{ font-family:var(--serif); font-size:16px; font-weight:600; } .lp .mapp-brand i{ font-style:normal; color:var(--clay); font-size:11px; }
        .lp .mapp-table{ font-size:9.5px; font-weight:700; color:var(--matcha-d); background:var(--tint); padding:4px 8px; border-radius:999px; }
        .lp .mchips{ display:flex; gap:6px; margin:13px 0 12px; }
        .lp .mchip{ font-size:9.5px; font-weight:600; padding:5px 10px; border-radius:999px; background:#fff; border:1px solid var(--line); color:var(--mut); }
        .lp .mchip.on{ background:var(--matcha); color:#fff; border-color:var(--matcha); }
        .lp .mrail-lab{ font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.09em; color:var(--mut); margin-bottom:6px; }
        .lp .mitem{ display:flex; gap:10px; align-items:center; padding:9px 0; border-bottom:1px solid var(--line); }
        .lp .mthumb{ width:44px; height:44px; border-radius:12px; flex-shrink:0; }
        .lp .mmid{ flex:1; min-width:0; }
        .lp .mname{ font-size:12px; font-weight:600; display:flex; align-items:center; gap:5px; }
        .lp .msig{ font-size:7px; font-weight:800; background:var(--tint); color:var(--matcha-d); padding:2px 5px; border-radius:999px; white-space:nowrap; letter-spacing:.03em; }
        .lp .mveg{ display:flex; align-items:center; gap:4px; font-size:9px; color:var(--mut); margin-top:3px; }
        .lp .vdot{ width:9px; height:9px; border-radius:3px; border:1.5px solid #2e9e54; position:relative; }
        .lp .vdot::after{ content:""; position:absolute; inset:0; margin:auto; width:4px; height:4px; border-radius:50%; background:#2e9e54; }
        .lp .mmeta{ font-size:9px; color:var(--mut); margin-top:2px; }
        .lp .mright{ display:flex; flex-direction:column; align-items:flex-end; gap:5px; }
        .lp .mprice{ font-size:12px; font-weight:700; }
        .lp .madd{ font-size:8.5px; font-weight:800; color:var(--matcha-d); border:1px solid var(--matcha); background:var(--tint); padding:3px 9px; border-radius:8px; }
        .lp .mcart{ margin:auto -14px 0; background:var(--matcha); color:#fff; padding:13px 16px; font-size:12px; display:flex; align-items:center; gap:6px; }
        .lp .mcart-go{ margin-left:auto; font-weight:700; }

        /* AI screen */
        .lp .ai-top{ font-family:var(--serif); font-size:15px; font-weight:600; display:flex; align-items:center; gap:6px; padding:4px 2px 12px; border-bottom:1px solid var(--line); }
        .lp .ai-mk{ color:var(--clay); }
        .lp .ai-chat{ display:flex; flex-direction:column; gap:8px; padding:12px 2px; flex:1; overflow:hidden; }
        .lp .bub{ font-size:11px; line-height:1.45; padding:8px 11px; border-radius:14px; max-width:88%; }
        .lp .bub.user{ align-self:flex-end; background:var(--matcha); color:#fff; border-bottom-right-radius:4px; }
        .lp .bub.bot{ align-self:flex-start; background:#fff; border:1px solid var(--line); border-bottom-left-radius:4px; }
        .lp .bub b{ color:inherit; }
        .lp .ai-card{ display:flex; align-items:center; gap:9px; background:#fff; border:1px solid var(--line); border-radius:14px; padding:8px; align-self:flex-start; width:88%; }
        .lp .ai-cthumb{ width:34px; height:34px; border-radius:9px; flex-shrink:0; }
        .lp .ai-cmid{ flex:1; } .lp .ai-cname{ font-size:11px; font-weight:600; } .lp .ai-cmeta{ font-size:9px; color:var(--mut); }
        .lp .ai-cadd{ font-size:9px; font-weight:800; color:var(--matcha-d); background:var(--tint); border:1px solid var(--matcha); padding:4px 10px; border-radius:8px; }
        .lp .ai-input{ margin:auto 0 14px; display:flex; align-items:center; gap:8px; border:1px solid var(--line); background:#fff; border-radius:999px; padding:7px 7px 7px 14px; font-size:11px; color:var(--mut); }
        .lp .ai-input span:first-child{ flex:1; }
        .lp .ai-send{ width:26px; height:26px; border-radius:50%; background:var(--matcha); color:#fff; display:grid; place-items:center; font-size:13px; flex-shrink:0; }

        /* REACTBITS-STYLE: spotlight cards, shiny wordmark, dot-grid */
        .lp .fcard{ position:relative; overflow:hidden; }
        .lp .fcard > *{ position:relative; z-index:1; }
        .lp .fcard::before{ content:""; position:absolute; inset:0; z-index:0; border-radius:inherit; opacity:0; transition:opacity .3s; pointer-events:none;
          background:radial-gradient(240px circle at var(--mx,50%) var(--my,50%), rgba(58,107,77,.12), transparent 62%); }
        .lp .fcard:hover::before{ opacity:1; }

        .lp .brand i.shiny{ color:transparent; -webkit-background-clip:text; background-clip:text; background-image:linear-gradient(110deg,var(--clay) 25%,#efd9c4 50%,var(--clay) 75%); background-size:220% 100%; animation:shine 4.5s linear infinite; }
        @keyframes shine{ to{ background-position:-220% 0; } }

        .lp .manifesto{ position:relative; }
        .lp .manifesto > *{ position:relative; z-index:1; }
        .lp .manifesto::before{ content:""; position:absolute; inset:-10% 0; z-index:0; pointer-events:none; opacity:.55;
          background-image:radial-gradient(var(--line) 1.2px, transparent 1.2px); background-size:26px 26px;
          -webkit-mask:radial-gradient(closest-side,#000,transparent 76%); mask:radial-gradient(closest-side,#000,transparent 76%); }

        /* CONTINUOUS INNOVATION — rounded panel + corner-badged floating cards */
        .lp .innov-wrap{ max-width:1280px; margin:26px auto; padding:0 34px; }
        .lp .innov{ background:#FBF7EF; border:1px solid var(--line); border-radius:44px; padding:84px 72px;
          display:grid; grid-template-columns:.82fr 1.18fr; gap:44px; align-items:center; box-shadow:0 2px 6px rgba(36,28,18,.03); }
        .lp .innov-copy h2{ font-family:var(--serif); font-size:52px; line-height:1.06; letter-spacing:-.015em; font-weight:600; margin:0 0 20px; }
        .lp .innov-copy p{ font-size:17px; line-height:1.7; color:var(--mut); max-width:44ch; margin:0; }
        .lp .innov-stage{ position:relative; min-height:500px; display:grid; place-items:center; }
        .lp .innov-illo{ width:min(460px,84%); display:block; }

        .lp .fcloud{ position:absolute; background:#fff; border-radius:14px; padding:13px 15px 12px;
          box-shadow:0 16px 40px rgba(36,28,18,.10), 0 2px 8px rgba(36,28,18,.05); width:196px;
          display:flex; flex-direction:column; gap:8px; animation:floaty 6s ease-in-out infinite; }
        .lp .fcloud > b, .lp .fc-head b{ font-size:12.5px; font-weight:700; color:var(--ink); }
        /* titles clear the overlapping corner badge */
        .lp .fc-a > b, .lp .fc-b > b{ padding-left:24px; }
        .lp .fc-a{ left:1%; top:5%; animation-delay:0s; }
        .lp .fc-c{ right:1%; top:3%; width:200px; animation-delay:-3.2s; animation-duration:6.6s; }
        .lp .fc-b{ left:-1%; top:48%; animation-delay:-1.7s; animation-duration:7.2s; }
        .lp .fc-d{ right:0; top:54%; width:212px; animation-delay:-4.6s; animation-duration:7.6s; }
        @keyframes floaty{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-10px); } }

        /* dark-green circular badge overlapping the card corner */
        .lp .fbadge{ position:absolute; width:42px; height:42px; border-radius:50%; background:var(--matcha-dd);
          color:#f4f1ea; display:grid; place-items:center; font-size:16px; box-shadow:0 8px 20px rgba(21,40,30,.28); }
        .lp .b-tl{ left:-15px; top:-15px; }
        .lp .b-br{ right:-13px; bottom:-13px; font-size:15px; }

        .lp .fc-media{ display:flex; gap:9px; align-items:center; }
        .lp .fc-media img{ width:46px; height:46px; border-radius:9px; object-fit:cover; flex-shrink:0; }
        .lp .fc-lines{ display:flex; flex-direction:column; gap:7px; flex:1; }
        .lp .fc-line{ display:block; height:7px; width:100%; border-radius:999px; background:#ECE6DB; }
        .lp .fc-line.short{ width:64%; }
        .lp .fcloud small{ font-size:11.5px; color:var(--mut); } .lp .fcloud small em{ font-style:normal; color:var(--clay); font-weight:800; }
        .lp .fcloud small.clay{ color:var(--clay); font-weight:800; font-size:13px; }
        .lp .fc-dots{ display:flex; gap:6px; align-items:center; }
        .lp .fc-dots i{ width:11px; height:11px; border-radius:50%; background:var(--clay); position:relative; }
        .lp .fc-dots i:not(.on){ background:transparent; border:2px solid #E4D5C8; }
        .lp .fc-dots i.on + i.on::before{ content:""; position:absolute; right:100%; top:50%; width:6px; height:2px; background:#E9D9CC; }
        .lp .fc-head{ display:flex; align-items:center; gap:8px; }
        .lp .wa-ic{ display:grid; place-items:center; width:28px; height:28px; border-radius:50%; background:#25A05C; color:#fff; font-size:13px; flex-shrink:0; }
        .lp .fc-bars{ display:flex; gap:3px; align-items:flex-end; padding-bottom:2px; }
        .lp .fc-bars i{ width:6px; border-radius:2px 2px 0 0; background:var(--clay); }
        .lp .fc-bars i:nth-child(2){ background:#E0A184; }

        .lp .spark{ position:absolute; color:var(--clay); font-size:17px; animation:twinkle 3.4s ease-in-out infinite; }
        .lp .s1{ top:0; left:44%; } .lp .s2{ top:20%; right:26%; animation-delay:-1.1s; font-size:11px; color:var(--ink); }
        .lp .s3{ bottom:4%; left:33%; animation-delay:-2.3s; font-size:11px; }
        @keyframes twinkle{ 0%,100%{ opacity:.3; transform:scale(.85) rotate(0deg); } 50%{ opacity:1; transform:scale(1.15) rotate(18deg); } }

        @media(max-width:880px){
          .lp .innov-wrap{ padding:0 16px; }
          .lp .innov{ grid-template-columns:1fr; gap:14px; text-align:center; padding:52px 20px; border-radius:30px; }
          .lp .innov-copy h2{ font-size:34px; } .lp .innov-copy p{ margin-inline:auto; }
          .lp .innov-stage{ min-height:430px; transform:scale(.84); }
          .lp .fc-a{ left:-4%; } .lp .fc-b{ left:-6%; } .lp .fc-c{ right:-4%; } .lp .fc-d{ right:-6%; }
          .lp .product{ grid-template-columns:1fr; gap:36px; }
          .lp .life{ grid-template-columns:1fr; gap:30px; text-align:center; }
          .lp .life-media{ order:-1; }
          .lp .life-copy p{ margin-inline:auto; }
          .lp .life-copy h2{ font-size:30px; }
          .lp .prod-copy{ text-align:center; } .lp .prod-lede{ margin-inline:auto; } .lp .prod-list{ text-align:left; max-width:380px; margin-inline:auto; }
          .lp .prod-stage{ min-height:520px; transform:scale(.92); }
          .lp .prod-copy h2{ font-size:30px; }
          .lp .hero{ grid-template-columns:1fr; text-align:center; padding-top:48px; gap:40px; }
          .lp .hero h1{ font-size:44px; } .lp .lede{ margin-inline:auto; } .lp .c-row{ justify-content:center; }
          .lp .hvisual{ order:-1; min-height:340px; }
          .lp .manifesto h2{ font-size:32px; }
          .lp .center-head h2, .lp .cta-band h2{ font-size:32px; }
          .lp .fgrid,.lp .steps,.lp .tgrid,.lp .pgrid,.lp .statband{ grid-template-columns:1fr; }
          .lp .statband{ grid-template-columns:repeat(2,1fr); }
          .lp .nav .links{ display:none; }
        }
        @media(prefers-reduced-motion:reduce){
          .lp .reveal{ opacity:1; transform:none; transition:none; }
          .lp .enso path, .lp .hero-enso path, .lp .hm-ink{ stroke-dashoffset:0 !important; animation:none !important; transition:none !important; }
          .lp .hm-spin, .lp .hm-glow, .lp .hm-steam i{ animation:none !important; }
          .lp .hm-seed{ opacity:.85 !important; animation:none !important; }
          .lp .logo-track, .lp .brand i.shiny, .lp .fcloud, .lp .spark{ animation:none !important; }
        }
      `}</style>
    </div>
  );
}
