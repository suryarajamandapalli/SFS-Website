# Shine Fin Services (SFS) — Financial Excellence

> **All Loans Under One Roof** | Premier Financial Consultancy in Coimbatore, Tamil Nadu.

Official repository for the Shine Fin Services website, featuring loan advisory services, an instant Gold Loan Calculator, an automatic day/night theme engine, and a cinematic GSAP scroll experience.

---

## 🌟 Key Features

### 1. Gold Loan Calculator
- **Dual Calculation Modes:**
  - **Weight of Ornament:** Calculate eligible loan amounts under the 75% RBI LTV ceiling with customizable ornament types, net gold weights, and purity benchmarks (18K, 20K, 22K, 24K).
  - **Expected Loan Amount:** Instantly determine the required gold weight and purity standard for a target loan amount.
- **Interactive Chart.js Doughnut Breakdown:** Real-time visual comparison of the eligible loan amount vs. the 25% uncovered gold equity margin.
- **Dynamic Ledger Breakdown:** Detailed valuation per item, total grams pledged, net value, and demonstration rate basis.
- **Regulatory Disclaimers & Appraisal Flow:** Transparent guidance on non-destructive karat-meter analysis and RBI guidelines.

### 2. Automatic Time-Based Theme Engine
- **Three Modes:**
  - `Auto`: Seamlessly syncs with local browser time (6:00 AM – 5:59 PM Light mode; 6:00 PM – 5:59 AM Dark mode).
  - `Light`: Warm off-white luxury financial aesthetic.
  - `Dark`: Deep executive navy/charcoal palette (`#07131A`, `#10262D`, `#1C3A44`) with high-contrast text and accessible emerald accents (`#10B981`).
- **Zero FOUC:** Instant inline script theme restoration from `localStorage`.

### 3. Cinematic Motion & Scroll Architecture
- Built with **GSAP 3**, **ScrollTrigger**, and **Lenis** smooth scrolling.
- Refined, restrained section reveals, subtle image scaling, and staggered card entrances.
- Responsive handling of `prefers-reduced-motion` and viewport resizing.

### 4. Comprehensive OpenGraph & Social Metadata
- Custom high-resolution OpenGraph banner (`1200x630`) with official SFS emblem and tagline: **“One Roof. More Possibilities.”**
- Apple touch icons, theme colors for light/dark mobile browsers, Twitter Large Cards, and WhatsApp/LinkedIn rich unfurls.

---

## 🚀 Tech Stack

- **Markup & Styling:** Semantic HTML5, CSS3 Custom Properties (Design Tokens), Flexbox & CSS Grid
- **Typography:** Plus Jakarta Sans
- **Animations:** GSAP 3.12, ScrollTrigger, Lenis Smooth Scroll
- **Data Visualization:** Chart.js 4.6 (UMD)
- **Deployment:** Vercel

---

## 💻 Local Development

Clone the repository and run locally:

```bash
# Clone repository
git clone https://github.com/suryarajamandapalli/SFS-Website.git
cd SFS-Website

# Install dependencies (optional for local scripts)
npm install

# Start local preview server
npm run server
```

Navigate to `http://localhost:6000` or `http://127.0.0.1:5173` to explore the website.

---

## 📄 License & Ownership

© 2026 Shine Fin Services. All rights reserved.
Coimbatore, Tamil Nadu, India.
