// CK Premium — Quote Quiz
(function () {
  const CK = window.CK;
  const P = window.CKPricing;
  const OTHERS = window.CK_OTHER_PRODUCTS || [];
  const ALL = CK.featured.concat(OTHERS);
  const STORE_KEY = "ck-quiz-v1";

  const $ = (sel, el = document) => el.querySelector(sel);
  const app = $("#app");

  // ---------- state ----------
  const blank = () => ({
    step: "intro",
    code: null,
    colors: [],
    method: null,
    uniqueName: false,
    twoSides: false,
    qty: 100,
    ship: null,
    vat: null,
    deadlineMode: null,
    deadline: "",
    logo: null,
    contact: { via: null, name: "", email: "", phone: "", company: "", taxId: "", branch: "", address: "", note: "", website: "" },
    submitStatus: null,
    ref: null,
    sentAt: null,
    catFilter: "all",
    showAll: false,
  });
  let S = load() || blank();

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      return s && s.step ? Object.assign(blank(), s) : null;
    } catch (e) { return null; }
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) {} }

  // ช่องทางรับใบเสนอราคา: อีเมลมีเฉพาะกรณีรับใบกำกับภาษี — ไม่รับใบกำกับ = แชทเพจเสมอ
  const via = () => (S.vat === true ? S.contact.via : S.vat === false ? "messenger" : null);
  const product = () => ALL.find((p) => p.code === S.code) || null;
  const featured = () => { const p = product(); return p && P.isFeatured(CK, p); };
  const q = () => P.quote(CK, {
    product: product(), method: S.method || "laser", uniqueName: S.uniqueName, twoSides: S.twoSides, qty: S.qty,
    ship: S.ship, vat: !!S.vat, deadline: "",
  });

  // ---------- helpers ----------
  const fmt = (n) => Number(n).toLocaleString("th-TH", { maximumFractionDigits: 2, minimumFractionDigits: Number.isInteger(n) ? 0 : 2 });
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ICON = {
    check: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v6M12 7.5v.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    mail: '<svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    messenger: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2.5C6.6 2.5 2.5 6.4 2.5 11.6c0 2.7 1.1 5.1 3 6.7v3.2l2.9-1.6c1.1.3 2.3.5 3.6.5 5.4 0 9.5-3.9 9.5-9.1S17.4 2.5 12 2.5zm1 12.2l-2.4-2.6-4.7 2.6 5.2-5.5 2.5 2.6 4.6-2.6-5.2 5.5z"/></svg>',
    download: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    zoom: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 16l4 4M11 8.5v5M8.5 11h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };
  const productLabel = (p) => `${p.code} ${p.name}`;
  const capacity = (p) => p.ml ? `${p.ml} ml` : p.oz ? `${p.oz} oz` : "";
  function track(name, data) {
    // จุดเชื่อม Meta Pixel / Google Analytics ภายหลัง
    if (window.fbq) window.fbq("trackCustom", name, data || {});
    if (window.dataLayer) window.dataLayer.push(Object.assign({ event: name }, data || {}));
  }
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 2600);
  }

  // ---------- steps ----------
  const STEPS = [
    { id: "intro" },
    { id: "model", title: "เลือก<b>รุ่นแก้ว</b>", valid: () => !!S.code },
    // ขั้นเลือกสี ปิดไว้ก่อน — เปิดใหม่โดยเปลี่ยน visible เป็น () => featured()
    { id: "color", title: "เลือก<b>สีแก้ว</b>", visible: () => false, valid: () => true, optional: true },
    { id: "method", title: "ทำโลโก้<b>แบบไหนดี</b>", valid: () => !!S.method },
    { id: "qty", title: "ต้องการ<b>กี่ใบ</b>", valid: () => S.qty >= CK.minQuote },
    { id: "ship", title: "รับสินค้า<b>แบบไหน</b>", valid: () => !!S.ship, auto: true },
    // ถามใบกำกับภาษีในหน้าสรุป (ท้ายสุด) แทนขั้นแยก
    { id: "vat", title: "ต้องการ<b>ใบกำกับภาษี</b>ไหม", visible: () => false, valid: () => S.vat !== null, auto: true },
    // ขั้นวันที่ต้องใช้ของ ปิดไว้ — ไม่ชวนให้ลูกค้าระบุวัน ให้ใส่ในช่องหมายเหตุแทนถ้ารีบ
    { id: "deadline", title: "ต้องใช้ของ<b>เมื่อไร</b>", visible: () => false, valid: () => S.deadlineMode === "none" || (S.deadlineMode === "date" && !!S.deadline) },
    { id: "logo", title: "มี<b>โลโก้</b>แล้วหรือยัง", valid: () => !!S.logo, auto: true },
    { id: "summary", title: "สรุป<b>ราคา</b>", valid: () => contactErrors().length === 0 },
    { id: "done" },
  ];
  const visibleSteps = () => STEPS.filter((s) => !s.visible || s.visible());
  const stepDef = (id) => STEPS.find((s) => s.id === id);

  function go(id, opts = {}) {
    S.step = id; save();
    render(opts.dir || "fwd");
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    track("quiz_step", { step: id });
  }
  function next() {
    const vs = visibleSteps();
    const i = vs.findIndex((s) => s.id === S.step);
    const cur = vs[i];
    if (cur.id === "summary") return submit(); // submit() ชี้ช่องที่ยังไม่ครบเอง
    if (cur.valid && !cur.valid()) return;
    if (vs[i + 1]) go(vs[i + 1].id);
  }
  function back() {
    const vs = visibleSteps();
    const i = vs.findIndex((s) => s.id === S.step);
    if (i > 0) go(vs[i - 1].id, { dir: "back" });
  }
  function autoNext() { setTimeout(next, 260); }

  // ---------- render ----------
  function render(dir) {
    const id = S.step;
    const def = stepDef(id) || STEPS[0];
    const vs = visibleSteps();
    const quizSteps = vs.filter((s) => s.title);
    const idx = quizSteps.findIndex((s) => s.id === id);

    $("#topbar").hidden = id === "intro";
    $("#backBtn").hidden = id === "intro" || id === "done";
    $("#progress").hidden = idx < 0;
    if (idx >= 0) $("#progressFill").style.width = `${((idx + 1) / quizSteps.length) * 100}%`;
    const eyebrow = idx >= 0 ? `<p class="step-eyebrow">STEP ${idx + 1} / ${quizSteps.length}</p>` : "";

    const view = VIEWS[id] ? VIEWS[id]() : "";
    app.innerHTML = `<section class="step step-${id} enter-${dir || "fwd"}">${def.title ? `${eyebrow}<h1 class="step-title">${def.title}</h1>` : ""}${view}</section>`;
    renderBar();
    if (AFTER[id]) AFTER[id]();
  }

  function renderBar() {
    const id = S.step;
    const bar = $("#bottombar");
    bar.hidden = id === "intro" || id === "done";
    if (bar.hidden) return;
    const def = stepDef(id);
    const r = q();
    const chip = $("#priceChip");
    if (product() && r.ok) {
      chip.innerHTML = `<span class="chip-unit">${fmt(S.qty)} ใบ · ใบละ ${fmt(r.unit)}฿</span><span class="chip-total">${fmt(r.total)}<small>฿</small></span>`;
    } else if (product() && r.flags.includes("adminPrice")) {
      chip.innerHTML = `<span class="chip-unit">${fmt(S.qty)} ใบ</span><span class="chip-total small">แอดมินแจ้งราคา</span>`;
    } else {
      chip.innerHTML = `<span class="chip-unit">เลือกรุ่นเพื่อดูราคา</span>`;
    }
    const btn = $("#nextBtn");
    const ok = !def.valid || def.valid();
    btn.disabled = id === "summary" ? false : !ok; // หน้าสรุปกดได้เสมอ เพื่อชี้ช่องที่ยังไม่ครบ
    if (id === "summary") btn.innerHTML = `ขอใบเสนอราคา ${ICON.arrow}`;
    else if (id === "color" && !S.colors.length) btn.innerHTML = `ข้ามไปก่อน ${ICON.arrow}`;
    else btn.innerHTML = `ถัดไป ${ICON.arrow}`;
  }

  // ---------- views ----------
  const VIEWS = {
    intro() {
      const f = CK.featured;
      return `
      <div class="landing">
        <header class="hero">
          <div class="hero-nav">
            <span class="logo"><span class="logo-mark"></span>CK Premium</span>
            <a class="pill-outline" href="${CK.config.lineUrl}" target="_blank" rel="noopener">LINE ${esc(CK.config.lineId)}</a>
          </div>
          <p class="eyebrow-latin">CUSTOM LOGO TUMBLER</p>
          <h1 class="hero-title">แก้วสกรีนโลโก้ <b>รู้ราคาใน 1 นาที</b></h1>
          <p class="hero-sub">เลือกรุ่น จำนวน และวิธีทำโลโก้ ระบบคำนวณราคาให้ทันที ไม่ต้องรอแชท สำหรับของแจก ของขวัญ และของพรีเมียมองค์กร</p>
          <ul class="dots">
            <li>ม็อคอัพฟรีก่อนผลิต</li>
            <li>ผลิต 7–10 วันทำการ</li>
            <li>ออกใบกำกับภาษีได้</li>
          </ul>
          <button class="btn btn-light btn-lg" data-action="start">เริ่มเช็กราคา ${ICON.arrow}</button>
        </header>

        <section class="band">
          <p class="band-label">ราคาเริ่มต้น 100 ใบ</p>
          <div class="glass-row">
            <div class="glass"><span class="big">85<small>฿</small></span><span>เลเซอร์โลโก้ / ใบ</span></div>
            <div class="glass"><span class="big">99<small>฿</small></span><span>พิมพ์โลโก้สี / ใบ</span></div>
          </div>
          <p class="band-note">รุ่นขายดี TBL-17/18/19 · รวมโลโก้ 1 จุดแล้ว · ไม่รวม VAT และค่าส่ง</p>
        </section>

        <section class="section">
          <p class="section-label"><span>สินค้าขายดี</span></p>
          <h2 class="section-title">เลือก<b>รุ่นแก้ว</b></h2>
          <div class="prod-list">
            ${f.map((p) => `
            <article class="prod">
              <button class="prod-img" data-action="start-with" data-code="${p.code}" aria-label="เช็กราคา ${p.code}">
                <img src="${p.img}" alt="${esc(p.name)}" loading="lazy" />
                <span class="prod-badge">${p.colors.length} สี</span>
              </button>
              <div class="prod-body">
                <p class="prod-eyebrow">${p.code} · ${p.ml} ML</p>
                <h3 class="prod-name">${esc(p.name)}</h3>
                <p class="prod-desc">แก้วเก็บอุณหภูมิ ${p.oz} oz พร้อมกล่องแยกใบ เลเซอร์หรือพิมพ์โลโก้ได้</p>
                <div class="prod-foot">
                  <span class="price-light">${p.prices[3]}<small>฿</small> <i>/ ใบ</i></span>
                  <button class="link-arrow" data-action="start-with" data-code="${p.code}">เช็กราคา ${ICON.arrow}</button>
                </div>
              </div>
            </article>`).join("")}
          </div>
          <button class="btn btn-outline" data-action="start">ดูรุ่นอื่นอีก ${OTHERS.length} รุ่น</button>
        </section>

        <section class="section alt">
          <p class="section-label"><span>สั่งง่าย 3 ขั้นตอน</span></p>
          <div class="how">
            <div class="how-item"><span class="num">1</span><b>เช็กราคาในหน้านี้</b><span>เลือกรุ่น สี จำนวน รู้ยอดรวมทันที</span></div>
            <div class="how-item"><span class="num">2</span><b>รับใบเสนอราคา</b><span>แอดมินส่งใบเสนอราคาพร้อมรายละเอียดการชำระเงิน</span></div>
            <div class="how-item"><span class="num">3</span><b>ดูม็อคอัพฟรี แล้วผลิต</b><span>ส่งโลโก้ ดูแบบภายใน 2 วัน แก้ได้จนพอใจ</span></div>
          </div>
          <button class="btn btn-primary btn-lg" data-action="start">เริ่มเช็กราคา ${ICON.arrow}</button>
        </section>

        <footer class="foot">
          <span class="logo dark"><span class="logo-mark"></span>CK Premium</span>
          <p>ผลิตที่ถนนเพชรบุรี ซอย 7 กรุงเทพฯ · มีตำหนิจากการผลิต เปลี่ยนให้ฟรี</p>
          <p><a href="${CK.config.lineUrl}" target="_blank" rel="noopener">LINE ${esc(CK.config.lineId)}</a> · <a href="${CK.config.catalogueUrl}" target="_blank" rel="noopener">แคตตาล็อก</a></p>
        </footer>
      </div>`;
    },

    model() {
      const cats = [["all", "ทั้งหมด"]].concat(Object.entries(CK.categories));
      const list = OTHERS.filter((p) => S.catFilter === "all" || p.cat === S.catFilter);
      return `
      <p class="step-sub">3 รุ่นขายดี ราคาเดียวกัน · 100 ใบ ใบละ 85 บาท</p>
      <div class="featured">
        ${CK.featured.map((p) => `
          <button class="fcard ${S.code === p.code ? "selected" : ""}" data-action="pick-model" data-code="${p.code}">
            <span class="badge">ขายดี</span>
            <span class="tick">${ICON.check}</span>
            <img src="${p.img}" alt="${esc(p.name)}" />
            <span class="fcard-body">
              <span class="code">${p.code}</span>
              <span class="name">${esc(p.name)}</span>
              <span class="meta">${capacity(p)} · ${p.colors.length} สี</span>
            </span>
            <span class="fcard-price"><small>100 ใบ</small>${p.prices[3]}<i>฿</i></span>
          </button>`).join("")}
      </div>
      <div class="others">
        <button class="others-toggle" data-action="toggle-all" aria-expanded="${S.showAll}">
          ${S.showAll ? "ซ่อนรุ่นอื่น" : `ดูรุ่นอื่นอีก ${OTHERS.length} รุ่น`}
          <svg viewBox="0 0 24 24" width="18" height="18" class="${S.showAll ? "up" : ""}"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
        </button>
        ${S.showAll ? `
        <div class="chips">${cats.map(([k, v]) => `<button class="chip ${S.catFilter === k ? "on" : ""}" data-action="cat" data-cat="${k}">${v}</button>`).join("")}</div>
        <div class="grid">
          ${list.map((p) => `
            <button class="pcard ${S.code === p.code ? "selected" : ""}" data-action="pick-model" data-code="${p.code}">
              <span class="tick">${ICON.check}</span>
              <img src="${p.img}" alt="${esc(p.name)}" loading="lazy" />
              <span class="pcard-body">
                <span class="code">${p.code}</span>
                <span class="name">${esc(p.name)}</span>
                <span class="price"><b>${p.prices[3]}฿</b> / ใบ · 100 ใบ</span>
              </span>
            </button>`).join("")}
        </div>
        <p class="hint">ดูรายละเอียดทุกรุ่นได้ที่ <a href="${CK.config.catalogueUrl}" target="_blank" rel="noopener">แคตตาล็อก</a></p>` : ""}
      </div>`;
    },

    color() {
      const p = product();
      const unsure = S.colors.includes("?");
      return `
      <p class="step-sub">${esc(productLabel(p))} มี ${p.colors.length} สี · เลือกได้มากกว่า 1 สี</p>
      <button class="chart" data-action="zoom" data-src="${p.colorsImg}">
        <img src="${p.colorsImg}" alt="สีของ ${p.code}" />
        <span class="chart-zoom">${ICON.zoom} แตะเพื่อขยาย</span>
      </button>
      <div class="swatches">
        ${p.colors.map((c) => `
          <button class="swatch ${S.colors.includes(c.k) ? "on" : ""}" data-action="color" data-k="${c.k}" title="${esc(c.name)}">
            <span class="dot" style="background:${c.hex}"></span>
            <span class="sw-k">${c.k}</span>
            <span class="sw-name">${esc(c.name)}</span>
          </button>`).join("")}
      </div>
      <button class="option slim ${unsure ? "selected" : ""}" data-action="color" data-k="?">
        <span class="tick">${ICON.check}</span>
        <span class="opt-title">ยังไม่แน่ใจ ให้แอดมินช่วยแนะนำ</span>
      </button>
      <p class="hint">${ICON.info} สีบนหน้าจออาจต่างจากของจริงเล็กน้อย ถ้าสั่งหลายสี แจ้งจำนวนต่อสีกับแอดมินได้ภายหลัง</p>`;
    },

    method() {
      const p = product();
      const qty = S.qty;
      const laser = P.unitPrice(CK, p, "laser", qty);
      const print = P.unitPrice(CK, p, "print", qty);
      const name = P.stepPrice(CK.uniqueName, qty);
      const side = P.stepPrice(CK.secondSide[S.method || "laser"], qty);
      const priceTag = (v) => v === null ? `<span class="opt-price muted">แอดมินแจ้งราคา</span>` : `<span class="opt-price"><b>${fmt(v)}<small>฿</small></b> / ใบ · ${fmt(qty)} ใบ</span>`;
      return `
      <p class="step-sub">ราคารวมโลโก้ 1 จุด (1 ด้าน) แล้ว</p>
      <div class="options two">
        <button class="option big ${S.method === "laser" ? "selected" : ""}" data-action="method" data-v="laser">
          <span class="tick">${ICON.check}</span>
          <span class="opt-visual laser"><span>LOGO</span></span>
          <span class="opt-title">เลเซอร์โลโก้</span>
          <span class="opt-desc">แกะลงเนื้อแก้ว ลายออกมาเป็นสีเงิน ดูเรียบหรู เหมาะกับโลโก้สีเดียว</span>
          ${priceTag(laser)}
        </button>
        <button class="option big ${S.method === "print" ? "selected" : ""}" data-action="method" data-v="print">
          <span class="tick">${ICON.check}</span>
          <span class="opt-visual print"><span>LOGO</span></span>
          <span class="opt-title">พิมพ์โลโก้สี</span>
          <span class="opt-desc">พิมพ์สีลงบนผิวแก้ว ได้สีตามโลโก้ ไม่จำกัดสี ตรงสีแบรนด์</span>
          ${priceTag(print)}
        </button>
      </div>
      <div class="addons">
        <label class="toggle">
          <input type="checkbox" data-action="unique" ${S.uniqueName ? "checked" : ""} />
          <span class="toggle-ui"></span>
          <span class="toggle-text"><b>เพิ่มชื่อไม่ซ้ำกันแต่ละใบ</b> (เลเซอร์) · ${name ? `+${name} บาท/ใบ ที่ ${qty} ใบ` : ""}</span>
        </label>
        <label class="toggle">
          <input type="checkbox" data-action="twosides" ${S.twoSides ? "checked" : ""} />
          <span class="toggle-ui"></span>
          <span class="toggle-text"><b>โลโก้ 2 ด้าน (หน้า–หลัง)</b> · +${side} บาท/ใบ ที่ ${fmt(qty)} ใบ${S.method ? "" : " (ราคาเลเซอร์)"}</span>
        </label>
      </div>
      <p class="hint">${ICON.info} ต้องการมากกว่า 2 จุด แจ้งแอดมินในแชทได้ แอดมินจะประเมินราคาให้</p>`;
    },

    qty() {
      const p = product();
      const r = q();
      const tiers = CK.tierMins.map((min, i) => {
        const max = CK.tierMins[i + 1] ? CK.tierMins[i + 1] - 1 : null;
        const unit = P.unitPrice(CK, p, S.method || "laser", min);
        const active = S.qty >= min && (max === null || S.qty <= max);
        return { min, max, unit, active };
      }).filter((t) => t.min >= 100 || S.qty < 100);
      return `
      <p class="step-sub">แนะนำ 100 ใบขึ้นไป · ยิ่งสั่งมาก ราคาต่อใบยิ่งถูก</p>
      <div class="qty-box">
        <button class="qbtn" data-action="qty-step" data-d="-1" aria-label="ลด">−</button>
        <div class="qty-input-wrap">
          <input id="qtyInput" class="qty-input" type="number" inputmode="numeric" min="${CK.minQuote}" step="1" value="${S.qty}" aria-label="จำนวน (ใบ)" />
          <span class="qty-unit">ใบ</span>
        </div>
        <button class="qbtn" data-action="qty-step" data-d="1" aria-label="เพิ่ม">+</button>
      </div>
      <input id="qtyRange" class="qty-range" type="range" min="0" max="${QTY_STOPS.length - 1}" step="1" value="${nearestStop(S.qty)}" aria-label="เลื่อนเลือกจำนวน" />
      <div class="chips center">${[100, 200, 300, 500, 1000, 2000].map((n) => `<button class="chip ${S.qty === n ? "on" : ""}" data-action="qty-set" data-n="${n}">${fmt(n)}</button>`).join("")}</div>
      <div id="qtyLive">${qtyLive(r)}</div>
      <div class="tiers">
        <div class="tiers-head"><span>จำนวน (ใบ)</span><span>ราคาต่อใบ</span></div>
        ${tiers.map((t) => `<div class="tier ${t.active ? "on" : ""}"><span>${fmt(t.min)}${t.max ? `–${fmt(t.max)}` : "+"}</span><span>${t.unit === null ? "แอดมินแจ้ง" : `${fmt(t.unit + (S.uniqueName ? P.stepPrice(CK.uniqueName, t.min) : 0) + (S.twoSides ? P.stepPrice(CK.secondSide[S.method || "laser"], t.min) : 0))} ฿`}</span></div>`).join("")}
      </div>`;
    },

    ship() {
      const s = (k) => P.shippingCost(CK, S.qty, k);
      return `
      <p class="step-sub">ค่าส่งสำหรับ ${fmt(S.qty)} ใบ</p>
      <div class="options">
        ${opt("ship", "bkk", "ส่งในกรุงเทพฯ", S.qty >= 50 ? "เหมาจ่าย ส่งถึงที่" : "ใบแรก 50 บาท ใบต่อไปใบละ 10 บาท", `${fmt(s("bkk"))} ฿`)}
        ${opt("ship", "upc", "ส่งต่างจังหวัด", S.qty >= 50 ? "ใบละ 10 บาท" : "ใบแรก 50 บาท ใบต่อไปใบละ 10 บาท", `${fmt(s("upc"))} ฿`)}
        ${opt("ship", "pickup", "เรียกรถมารับเอง", "ถนนเพชรบุรี ซอย 7 กรุงเทพฯ · แอดมินแจ้งจุดรับของ", "ฟรี")}
      </div>`;
    },

    vat() {
      const r = P.quote(CK, { product: product(), method: S.method, uniqueName: S.uniqueName, twoSides: S.twoSides, qty: S.qty, ship: S.ship, vat: true });
      return `
      <p class="step-sub">ราคาทั้งหมดในหน้านี้ยังไม่รวม VAT</p>
      <div class="options">
        ${opt("vat", false, "ไม่ต้องการ", "ใช้ราคาตามตาราง", "")}
        ${opt("vat", true, "ต้องการใบกำกับภาษี", "บวกเพิ่ม 7% · ขอชื่อบริษัท ที่อยู่ และเลขผู้เสียภาษีในขั้นสุดท้าย", r.ok ? `+${fmt(r.vat)} ฿` : "+7%")}
      </div>`;
    },

    deadline() {
      const today = new Date(); today.setDate(today.getDate() + 1);
      const min = today.toISOString().slice(0, 10);
      return `
      <p class="step-sub">ระยะเวลาผลิตปกติ 7–10 วันทำการ หลังคอนเฟิร์มแบบ</p>
      <div class="options">
        ${opt("deadlineMode", "none", "ไม่รีบ ตามคิวปกติ", "ผลิตประมาณ 7–10 วันทำการ", "")}
        ${opt("deadlineMode", "date", "มีวันที่ต้องใช้ของ", "แอดมินจะเช็กคิวผลิตแล้วแจ้งกลับ", "")}
      </div>
      ${S.deadlineMode === "date" ? `
      <label class="field">
        <span>วันที่ต้องได้รับของ</span>
        <input type="date" id="deadlineInput" min="${min}" value="${esc(S.deadline)}" />
      </label>` : ""}`;
    },

    logo() {
      return `
      <p class="step-sub">ยังไม่ต้องส่งไฟล์ตอนนี้ — ส่งหลังยืนยันสั่งซื้อ แล้วทีมทำม็อคอัพให้ดูภายใน 2 วัน</p>
      <div class="options">
        ${opt("logo", "file", "มีไฟล์โลโก้แล้ว", "ไฟล์ .ai หรือ .png พื้นหลังใส", "")}
        ${opt("logo", "image", "มีแต่รูปโลโก้", "ส่งรูปมาก่อน แอดมินช่วยดูว่าใช้ได้ไหม", "")}
        ${opt("logo", "text", "เป็นข้อความ / ชื่อ", "เลือกฟอนต์จาก fonts.google.com แล้วแจ้งชื่อฟอนต์", "")}
        ${opt("logo", "none", "ยังไม่มีโลโก้", "ร้านไม่รับออกแบบโลโก้ แต่จัดวางข้อความบนแก้วให้ฟรี", "")}
      </div>`;
    },

    summary() {
      const p = product();
      const r = q();
      const c = S.contact;
      return `
      <div class="receipt">
        <div class="receipt-head">
          <img src="${p.img}" alt="" />
          <div>
            <div class="code">${p.code}</div>
            <div class="name">${esc(p.name)}</div>
            <div class="meta">${methodText()}${colorText() ? ` · สี ${esc(colorText())}` : ""}</div>
          </div>
        </div>
        ${r.ok ? `
        <div class="rows">
          ${row(`แก้ว + ${S.method === "print" ? "พิมพ์" : "เลเซอร์"}โลโก้${S.twoSides ? "ด้านที่ 1" : " 1 จุด"}`, `${fmt(r.itemUnit)} × ${fmt(S.qty)}`, fmt(r.itemUnit * S.qty), "qty")}
          ${S.twoSides ? row(`${S.method === "print" ? "พิมพ์" : "เลเซอร์"}โลโก้ด้านที่ 2`, `${fmt(r.sideUnit)} × ${fmt(S.qty)}`, fmt(r.sideUnit * S.qty), "method") : ""}
          ${S.uniqueName ? row("ชื่อไม่ซ้ำกันแต่ละใบ", `${fmt(r.nameUnit)} × ${fmt(S.qty)}`, fmt(r.nameUnit * S.qty), "method") : ""}
          ${row(`ค่าส่ง · ${shipText()}`, "", r.shipping === 0 ? "ฟรี" : fmt(r.shipping), "ship")}
          ${S.vat ? row("VAT 7%", "", fmt(r.vat), "vat") : ""}
        </div>
        <div class="total"><span>ยอดรวม${S.vat ? "" : " (ไม่รวม VAT)"}</span><strong>${fmt(r.total)}<small>฿</small></strong></div>
        <div class="per-unit">เฉลี่ยใบละ ${fmt(Math.round((r.total / S.qty) * 100) / 100)} บาท</div>` : `
        <div class="notice">${ICON.info}<span>งานพิมพ์รุ่นนี้ต่ำกว่า 50 ใบ แอดมินจะแจ้งราคาให้ในใบเสนอราคา</span></div>`}
        ${flagNotes(r)}
      </div>

      <h2 class="form-title">ขอ<b>ใบเสนอราคา</b></h2>
      <p class="step-sub">ต้องการใบกำกับภาษีไหม</p>
      <div class="options vat-q">
        ${opt("vat", false, "ไม่ต้องการใบกำกับภาษี", "ใช้ราคาตามตาราง", "")}
        ${opt("vat", true, "ต้องการใบกำกับภาษี", "บวกเพิ่ม 7% · กรอกข้อมูลบริษัทสำหรับออกใบกำกับ", vatPreview())}
      </div>
      ${S.vat === true ? `
      <p class="step-sub sub-gap">เลือกช่องทางรับใบเสนอราคาและใบกำกับภาษี</p>
      <div class="options via">
        <button type="button" class="option ${c.via === "email" ? "selected" : ""}" data-action="via" data-v="email">
          <span class="tick">${ICON.check}</span>
          <span class="via-icon">${ICON.mail}</span>
          <span class="opt-main"><span class="opt-title">รับทางอีเมล</span><span class="opt-desc">กรอกอีเมลไว้ แอดมินส่งใบเสนอราคาไปให้ ไม่ต้องส่งข้อมูลเพิ่ม</span></span>
        </button>
        <button type="button" class="option ${c.via === "messenger" ? "selected" : ""}" data-action="via" data-v="messenger">
          <span class="tick">${ICON.check}</span>
          <span class="via-icon fb">${ICON.messenger}</span>
          <span class="opt-main"><span class="opt-title">คุยต่อในแชทเพจ Facebook</span><span class="opt-desc">ส่งรูปสรุปราคาเข้า Messenger ของเพจ แอดมินตอบกลับในแชท</span></span>
        </button>
      </div>` : S.vat === false ? `
      <p class="step-sub sub-gap">กรอกชื่อ แล้วส่งรูปสรุปราคาเข้าแชทเพจ Facebook แอดมินจะตอบกลับพร้อมใบเสนอราคาในแชท</p>` : ""}
      ${via() ? `
      <form class="form" id="contactForm" novalidate>
        ${field("name", "ชื่อผู้ติดต่อ", c.name, "text", "เช่น คุณสมชาย", true)}
        ${via() === "email" ? field("email", "อีเมลสำหรับรับใบเสนอราคา", c.email, "email", "name@company.com", true, 'autocomplete="email" inputmode="email"') : ""}
        ${field("phone", "เบอร์โทร (ถ้ามี)", c.phone, "tel", "08x-xxx-xxxx หรือ +66 8x xxx xxxx", false, 'autocomplete="tel"')}
        ${S.vat ? `
        ${field("company", "ชื่อบริษัท / ผู้เสียภาษี", c.company, "text", "", true, 'autocomplete="organization"')}
        ${field("taxId", "เลขประจำตัวผู้เสียภาษี 13 หลัก", c.taxId, "text", "", true, 'inputmode="numeric" maxlength="17"')}
        ${field("branch", "สาขา (เช่น สำนักงานใหญ่ / 00001)", c.branch, "text", "สำนักงานใหญ่", false)}
        <label class="field"><span>ที่อยู่สำหรับออกใบกำกับภาษี <i>*</i></span><textarea name="address" rows="3" autocomplete="street-address">${esc(c.address)}</textarea></label>` : `
        ${field("company", "ชื่อบริษัท / หน่วยงาน (ถ้ามี)", c.company, "text", "", false)}`}
        <label class="field"><span>หมายเหตุถึงแอดมิน (ถ้ามี)</span><textarea name="note" rows="3" maxlength="500" placeholder="เช่น วันที่ต้องใช้ของ ตำแหน่งโลโก้ หรือรายละเอียดอื่นๆ">${esc(c.note)}</textarea></label>
        <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
        <p class="privacy">ข้อมูลนี้ใช้เพื่อออกใบเสนอราคาและใบกำกับภาษีเท่านั้น</p>
      </form>` : ""}`;
    },

    done() {
      const r = q();
      const c = S.contact;
      const viaEmail = via() === "email";
      const totalChip = `<div class="done-total">${r.ok ? `${fmt(S.qty)} ใบ · ${fmt(r.total)} ฿` : `${fmt(S.qty)} ใบ · แอดมินแจ้งราคา`}</div>`;
      const preview = `
          <figure class="sum-img">
            <div class="sum-img-frame"><img id="summaryImg" alt="รูปสรุปราคา ${esc(S.ref)}" /><span class="sum-img-loading">กำลังสร้างรูป…</span></div>
            <figcaption>รูปสรุปราคา · กดค้างที่รูปเพื่อบันทึกได้</figcaption>
          </figure>`;
      const textBox = `
          <div class="summary-box">
            <div class="summary-head"><span>ข้อความสรุป</span><button class="link-arrow" data-action="copy">คัดลอก</button></div>
            <pre>${esc(summaryText())}</pre>
          </div>`;
      const switchBtn = S.vat ? `<button class="btn btn-ghost" data-action="switch-via">${viaEmail ? "เปลี่ยนไปคุยในแชทเพจ Facebook" : "เปลี่ยนไปรับทางอีเมล"}</button>` : "";

      if (viaEmail && S.submitStatus === "sent") {
        return `
      <div class="done">
        <div class="done-badge">${ICON.check}</div>
        <h1 class="step-title">ได้รับ<b>คำขอแล้ว</b></h1>
        <p class="ref">เลขอ้างอิง <b>${esc(S.ref)}</b></p>
        <p class="step-sub">แอดมินจะส่งใบเสนอราคาไปที่ <b>${esc(c.email)}</b><br />ไม่ต้องส่งข้อมูลซ้ำครับ</p>
        ${totalChip}
        <div class="done-actions">
          ${preview}
          <button class="btn btn-ghost" data-action="share-img">${ICON.download} บันทึกรูปสรุปราคาเก็บไว้</button>
          <button class="btn btn-ghost" data-action="open-chat">${ICON.messenger} มีคำถามเพิ่มเติม ทักแชทเพจ</button>
        </div>
        <button class="link" data-action="restart">เริ่มเช็กราคาใหม่</button>
      </div>`;
      }

      if (viaEmail) {
        // ส่งเข้าระบบไม่สำเร็จ หรือยังไม่ได้ตั้งค่า submitUrl — ให้ลูกค้าส่งเองได้ ข้อมูลจะได้ไม่หาย
        const subject = `ขอใบเสนอราคา ${S.ref} — ${S.code} ${fmt(S.qty)} ใบ`;
        const mailHref = `mailto:${CK.config.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summaryText())}`;
        return `
      <div class="done">
        <div class="done-badge warn">!</div>
        <h1 class="step-title">ส่งคำขอ<b>ยังไม่สำเร็จ</b></h1>
        <p class="ref">เลขอ้างอิง <b>${esc(S.ref)}</b></p>
        <p class="step-sub">${CK.config.submitUrl ? "การเชื่อมต่อมีปัญหา ลองส่งอีกครั้ง หรือส่งอีเมลหาร้านเองได้ครับ" : "ระบบรับคำขออัตโนมัติยังไม่ได้ตั้งค่า (submitUrl) — ระหว่างนี้ส่งอีเมลหาร้านเองได้"}</p>
        ${totalChip}
        <div class="done-actions">
          ${CK.config.submitUrl ? `<button class="btn btn-primary" data-action="retry">ลองส่งอีกครั้ง</button>` : ""}
          <a class="btn ${CK.config.submitUrl ? "btn-ghost" : "btn-primary"}" href="${mailHref}" data-action="sent-email">${ICON.mail} ส่งอีเมลหาร้านเอง</a>
          ${preview}
          ${textBox}
          ${switchBtn}
        </div>
        <button class="link" data-action="restart">เริ่มเช็กราคาใหม่</button>
      </div>`;
      }

      return `
      <div class="done">
        <div class="done-badge">${ICON.check}</div>
        <h1 class="step-title">เหลืออีก<b>ขั้นเดียว</b></h1>
        <p class="ref">เลขอ้างอิง <b>${esc(S.ref)}</b></p>
        <p class="step-sub"><b>บันทึกรูปสรุปราคา</b> แล้วส่งรูปในแชทเพจ CK Premium แอดมินจะตอบกลับพร้อมใบเสนอราคาในแชท</p>
        ${totalChip}
        <div class="done-actions">
          <button class="btn btn-primary" data-action="share-img">${ICON.download} บันทึก / แชร์รูปสรุปราคา</button>
          <button class="btn btn-fb" data-action="messenger">${ICON.messenger} เปิดแชทเพจ (คัดลอกข้อความให้ด้วย)</button>
          ${preview}
          ${textBox}
          <button class="btn btn-ghost" data-action="print">บันทึกเป็น PDF</button>
          ${switchBtn}
        </div>
        <button class="link" data-action="restart">เริ่มเช็กราคาใหม่</button>
      </div>`;
    },
  };

  const AFTER = {
    done() { buildSummaryImage(); },
    qty() {
      const input = $("#qtyInput"), range = $("#qtyRange");
      input.addEventListener("input", () => {
        const v = Math.max(0, Math.floor(Number(input.value) || 0));
        S.qty = v; save();
        range.value = nearestStop(v);
        refreshQty();
      });
      input.addEventListener("blur", () => { if (S.qty < CK.minQuote) { S.qty = CK.minQuote; save(); render(); } });
      range.addEventListener("input", () => { S.qty = QTY_STOPS[range.value]; input.value = S.qty; save(); refreshQty(); });
    },
    deadline() {
      const d = $("#deadlineInput");
      if (d) d.addEventListener("change", () => { S.deadline = d.value; save(); renderBar(); });
    },
    summary() {
      const f = $("#contactForm");
      if (!f) return;
      f.addEventListener("input", (e) => {
        const n = e.target.name;
        if (!n) return;
        S.contact[n] = e.target.value;
        e.target.closest(".field")?.classList.remove("err");
        save(); renderBar();
      });
      f.addEventListener("submit", (e) => { e.preventDefault(); next(); });
    },
  };

  // ---------- small view helpers ----------
  function vatPreview() {
    const r = P.quote(CK, { product: product(), method: S.method || "laser", uniqueName: S.uniqueName, twoSides: S.twoSides, qty: S.qty, ship: S.ship, vat: true });
    return r.ok ? `+${fmt(r.vat)} ฿` : "+7%";
  }
  function opt(key, val, title, desc, price) {
    const sel = S[key] === val;
    return `<button class="option ${sel ? "selected" : ""}" data-action="set" data-key="${key}" data-v='${JSON.stringify(val)}'>
      <span class="tick">${ICON.check}</span>
      <span class="opt-main"><span class="opt-title">${title}</span><span class="opt-desc">${desc}</span></span>
      ${price ? `<span class="opt-side">${price}</span>` : ""}
    </button>`;
  }
  function row(label, sub, amount, editStep) {
    return `<div class="row"><div><div class="row-label">${label}</div>${sub ? `<div class="row-sub">${sub}</div>` : ""}</div><div class="row-amt">${amount}${editStep ? `<button class="edit" data-action="goto" data-step="${editStep}">แก้ไข</button>` : ""}</div></div>`;
  }
  function field(name, label, value, type, ph, req, extra = "") {
    return `<label class="field"><span>${label}${req ? " <i>*</i>" : ""}</span><input name="${name}" type="${type}" value="${esc(value)}" placeholder="${esc(ph)}" ${extra} /></label>`;
  }
  function flagNotes(r) {
    const notes = [];
    if (r.flags.includes("belowMin")) notes.push("ต่ำกว่าขั้นต่ำปกติ (50 ใบ) แอดมินจะยืนยันการรับงานอีกครั้ง");
    if (r.flags.includes("bigOrder")) notes.push("ออเดอร์จำนวนมาก แอดมินจะติดต่อกลับภายในวันเดียว");
    if (r.flags.includes("deadline")) notes.push(`ต้องการรับของภายใน ${thaiDate(S.deadline)} — แอดมินจะเช็กคิวผลิตแล้วยืนยันวันส่ง`);
    if (S.colors.length > 1 && !S.colors.includes("?")) notes.push("สั่งหลายสี — แจ้งจำนวนต่อสีกับแอดมินได้เลย");
    return notes.map((n) => `<div class="notice">${ICON.info}<span>${esc(n)}</span></div>`).join("");
  }
  function qtyLive(r) {
    if (r.flags.includes("tooFew")) return `<div class="live warn">จำนวนน้อยกว่านี้ ทักแชทเพจเพื่อสอบถามแอดมินได้ครับ</div>`;
    if (r.flags.includes("adminPrice")) return `<div class="live warn">งานพิมพ์รุ่นนี้ต่ำกว่า 50 ใบ แอดมินจะแจ้งราคาให้</div>`;
    if (!r.ok) return "";
    let nudge = r.next;
    if (S.qty < 100) {
      const at100 = q100();
      if (at100.ok && at100.unit < r.unit) nudge = { qty: 100, unit: at100.unit, save: r.unit - at100.unit };
    }
    return `<div class="live">
      <div class="live-row"><span>ราคาต่อใบ</span><b>${fmt(r.unit)} ฿</b></div>
      <div class="live-row"><span>${fmt(S.qty)} ใบ</span><b>${fmt(r.subtotal)} ฿</b></div>
      ${nudge ? `<button class="nudge" data-action="qty-set" data-n="${nudge.qty}">สั่ง ${fmt(nudge.qty)} ใบ ลดเหลือใบละ ${fmt(nudge.unit)} ฿ <span>(ถูกลง ${fmt(nudge.save)} ฿/ใบ)</span></button>` : ""}
      ${r.flags.includes("belowMin") ? `<div class="live-note">ต่ำกว่าขั้นต่ำปกติ 50 ใบ</div>` : ""}
      ${r.flags.includes("bigOrder") ? `<div class="live-note">ออเดอร์ใหญ่ แอดมินดูแลให้เป็นพิเศษ</div>` : ""}
    </div>`;
  }
  const q100 = () => P.quote(CK, { product: product(), method: S.method || "laser", uniqueName: S.uniqueName, twoSides: S.twoSides, qty: 100 });
  function refreshQty() {
    $("#qtyLive").innerHTML = qtyLive(q());
    document.querySelectorAll(".step-qty .chip").forEach((c) => c.classList.toggle("on", Number(c.dataset.n) === S.qty));
    document.querySelectorAll(".step-qty .tier").forEach((t, i, all) => {
      const span = t.firstElementChild.textContent.replace(/,/g, "");
      const [a, b] = span.split("–");
      const min = parseInt(a, 10), max = b ? parseInt(b, 10) : Infinity;
      t.classList.toggle("on", S.qty >= min && S.qty <= max);
    });
    renderBar();
  }
  // แถบเลื่อนเริ่มที่ 20 ใบ
  const QTY_STOPS = [20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1500, 2000, 3000, 4000, 5000];
  function nearestStop(v) {
    let best = 0;
    QTY_STOPS.forEach((s, i) => { if (Math.abs(s - v) < Math.abs(QTY_STOPS[best] - v)) best = i; });
    return best;
  }

  const methodText = () => (S.method === "print" ? "พิมพ์โลโก้สี" : "เลเซอร์โลโก้") + (S.twoSides ? " 2 ด้าน" : " 1 ด้าน") + (S.uniqueName ? " + ชื่อไม่ซ้ำ" : "");
  const shipText = () => ({ bkk: "กรุงเทพฯ", upc: "ต่างจังหวัด", pickup: "รับเอง" }[S.ship] || "-");
  const logoText = () => ({ file: "มีไฟล์แล้ว", image: "มีแต่รูป", text: "เป็นข้อความ", none: "ยังไม่มี" }[S.logo] || "-");
  function colorText() {
    const p = product();
    if (!p || !p.colors || !S.colors.length) return "";
    if (S.colors.includes("?")) return "ให้แอดมินแนะนำ";
    return S.colors.map((k) => { const c = p.colors.find((x) => x.k === k); return c ? `${c.k} ${c.name}` : k; }).join(", ");
  }
  function thaiDate(iso) {
    if (!iso) return "-";
    return new Date(iso + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  }

  function summaryText() {
    const p = product(); const r = q(); const c = S.contact;
    const lines = [
      `สวัสดีครับ ขอใบเสนอราคา (เลขอ้างอิง ${S.ref})`,
      `รุ่น: ${productLabel(p)}`,
      colorText() ? `สี: ${colorText()}` : null,
      `งาน: ${methodText()}`,
      `จำนวน: ${fmt(S.qty)} ใบ`,
      r.ok ? `ราคาต่อใบ: ${fmt(r.unit)} บาท` : `ราคา: รอแอดมินแจ้ง`,
      `จัดส่ง: ${shipText()}${r.ok && r.shipping ? ` (${fmt(r.shipping)} บาท)` : ""}`,
      `ใบกำกับภาษี: ${S.vat ? "ต้องการ (+7%)" : "ไม่ต้องการ"}`,
      r.ok ? `ยอดรวม: ${fmt(r.total)} บาท` : null,
      `โลโก้: ${logoText()}`,
      `ชื่อ: ${c.name}`,
      c.email ? `อีเมล: ${c.email}` : null,
      c.phone ? `โทร: ${c.phone}` : null,
      `รับใบเสนอราคาทาง: ${via() === "email" ? "อีเมล" : "แชทเพจ Facebook"}`,
      c.company ? `บริษัท: ${c.company}` : null,
      S.vat && c.taxId ? `เลขผู้เสียภาษี: ${c.taxId}${c.branch ? ` (${c.branch})` : ""}` : null,
      S.vat && c.address ? `ที่อยู่: ${c.address}` : null,
      c.note.trim() ? `หมายเหตุ: ${c.note.trim()}` : null,
    ];
    return lines.filter(Boolean).join("\n");
  }

  // เบอร์โทร: รับได้ทั้ง 08x-xxx-xxxx, +66 8x xxx xxxx, 66812345678, +66 (0)81... และเบอร์ต่างประเทศ +xx
  function normPhone(v) {
    let d = String(v).replace(/[\s\-().]/g, "");
    if (/^\+?66/.test(d)) d = "0" + d.replace(/^\+?66/, "").replace(/^0/, "");
    return d;
  }
  function validPhone(v) {
    const d = normPhone(v);
    return /^0\d{8,9}$/.test(d) || /^\+\d{8,15}$/.test(d);
  }

  function contactErrors() {
    const c = S.contact, errs = [];
    if (S.vat !== true && S.vat !== false) { errs.push("vat"); return errs; }
    if (!via()) { errs.push("via"); return errs; }
    if (!c.name.trim()) errs.push("name");
    if (via() === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) errs.push("email");
    if (c.phone.trim() && !validPhone(c.phone)) errs.push("phone");
    if (S.vat) {
      if (!c.company.trim()) errs.push("company");
      if (!/^\d{13}$/.test(c.taxId.replace(/[\s-]/g, ""))) errs.push("taxId");
      if (!c.address.trim()) errs.push("address");
    }
    return errs;
  }

  function makeRef() {
    const d = new Date();
    const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    return `CK-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  async function submit() {
    const errs = contactErrors();
    if (errs.length) {
      if (errs.includes("vat")) {
        document.querySelector(".vat-q")?.scrollIntoView({ behavior: "smooth", block: "center" });
        toast("เลือกก่อนว่าต้องการใบกำกับภาษีไหมครับ");
        return;
      }
      if (errs.includes("via")) {
        document.querySelector(".options.via")?.scrollIntoView({ behavior: "smooth", block: "center" });
        toast("เลือกช่องทางรับใบเสนอราคาก่อนครับ");
        return;
      }
      errs.forEach((n) => document.querySelector(`[name="${n}"]`)?.closest(".field")?.classList.add("err"));
      document.querySelector(".field.err")?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast(errs.length === 1 && errs[0] === "phone" ? "เบอร์โทรไม่ถูกต้อง เช่น 081-234-5678 หรือ +66 81 234 5678"
        : errs.length === 1 && errs[0] === "email" ? "อีเมลไม่ถูกต้อง"
        : errs.length === 1 && errs[0] === "taxId" ? "เลขผู้เสียภาษีต้องมี 13 หลัก"
        : "กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    if (!S.ref) S.ref = makeRef();
    S.sentAt = new Date().toISOString();
    S.submitStatus = null;
    save();
    const btn = $("#nextBtn"); btn.disabled = true; btn.textContent = "กำลังส่ง…";
    await sendToShop();
    const r = q();
    track("quote_request", { product: S.code, qty: S.qty, value: r.total || 0, currency: "THB", via: via() });
    buildPrint();
    go("done");
  }

  // ส่งคำขอเข้าระบบร้าน (Google Apps Script → Google Sheet + อีเมลแจ้งร้าน)
  async function sendToShop() {
    if (S.contact.website) { S.submitStatus = "sent"; save(); return; } // bot กรอกช่องซ่อน — ไม่ส่งจริง
    if (!CK.config.submitUrl) { S.submitStatus = "none"; save(); return; }
    const r = q(); const c = S.contact;
    let image = "";
    try {
      const blob = await window.CKSummaryImage.draw(imageData());
      image = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(",")[1] || ""); fr.readAsDataURL(blob); });
    } catch (e) {}
    const payload = {
      ref: S.ref, sentAt: S.sentAt, via: via(),
      product: `${S.code} ${product().name}`, method: methodText(), qty: S.qty,
      unit: r.unit ?? "", shipping: r.shipping ?? "", vat: !!S.vat, vatAmount: r.vat ?? "", total: r.total ?? "",
      // note ส่งในช่อง deadline ด้วย เพื่อให้ Apps Script เวอร์ชันที่ติดตั้งอยู่บันทึกลงคอลัมน์ "ต้องใช้ของ" ได้โดยไม่ต้อง deploy ใหม่
      ship: shipText(), deadline: c.note.trim(), note: c.note.trim(), logo: logoText(), flags: r.flags.join(","),
      name: c.name, email: via() === "email" ? c.email : "", phone: c.phone ? normPhone(c.phone) : "", company: c.company,
      taxId: S.vat ? c.taxId.replace(/\D/g, "") : "", branch: S.vat ? c.branch : "", address: S.vat ? c.address : "",
      summary: summaryText(), image,
    };
    try {
      await fetch(CK.config.submitUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
      S.submitStatus = "sent";
    } catch (e) {
      S.submitStatus = "failed";
    }
    save();
  }

  function buildPrint() {
    const p = product(); const r = q();
    $("#printSheet").innerHTML = `
      <div class="ps-head"><div class="ps-brand">CK Premium</div><div>ใบสรุปราคา<br /><small>เลขอ้างอิง ${esc(S.ref)} · ${thaiDate(S.sentAt.slice(0, 10))}</small></div></div>
      <pre>${esc(summaryText().split("\n").slice(1).join("\n"))}</pre>
      <p class="ps-note">ใบสรุปนี้คำนวณจากตารางราคาปัจจุบัน ยังไม่ใช่ใบเสนอราคา แอดมินจะส่งใบเสนอราคาอย่างเป็นทางการพร้อมรายละเอียดการชำระเงินให้อีกครั้ง<br />LINE ${esc(CK.config.lineId)} · ${esc(CK.config.email)}</p>`;
  }

  // ---------- events ----------
  app.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const a = el.dataset.action;
    switch (a) {
      case "start":
        track("quiz_start");
        go("model"); break;
      case "start-with": {
        track("quiz_start", { product: el.dataset.code });
        if (S.code !== el.dataset.code) S.colors = [];
        S.code = el.dataset.code; save();
        go("method"); break;
      }
      case "pick-model": {
        const changed = S.code !== el.dataset.code;
        S.code = el.dataset.code;
        if (changed) S.colors = [];
        save();
        app.querySelectorAll(".fcard, .pcard").forEach((c) => c.classList.toggle("selected", c.dataset.code === S.code));
        renderBar(); autoNext(); break;
      }
      case "toggle-all": S.showAll = !S.showAll; save(); render("none"); break;
      case "cat": S.catFilter = el.dataset.cat; save(); render("none"); break;
      case "zoom": openLightbox(el.dataset.src); break;
      case "color": {
        const k = el.dataset.k;
        if (k === "?") S.colors = S.colors.includes("?") ? [] : ["?"];
        else {
          S.colors = S.colors.filter((x) => x !== "?");
          S.colors = S.colors.includes(k) ? S.colors.filter((x) => x !== k) : S.colors.concat(k);
        }
        save(); render("none"); break;
      }
      case "method": S.method = el.dataset.v; save(); render("none"); break;
      case "qty-step": {
        const d = Number(el.dataset.d);
        const stepSize = S.qty >= 1000 ? 100 : S.qty >= 200 ? 50 : 10;
        S.qty = Math.max(CK.minQuote, S.qty + d * stepSize);
        $("#qtyInput").value = S.qty; $("#qtyRange").value = nearestStop(S.qty);
        save(); refreshQty(); break;
      }
      case "qty-set":
        S.qty = Number(el.dataset.n);
        $("#qtyInput").value = S.qty; $("#qtyRange").value = nearestStop(S.qty);
        save(); refreshQty(); break;
      case "set": {
        const key = el.dataset.key;
        S[key] = JSON.parse(el.dataset.v);
        save();
        const def = stepDef(S.step);
        if (key === "deadlineMode" && S.deadlineMode === "date") { render("none"); $("#deadlineInput")?.focus(); break; }
        render("none");
        if (key === "vat" && S.step === "summary") {
          const el = document.querySelector(".vat-q");
          if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 140 });
        }
        if (def.auto || (key === "deadlineMode" && S.deadlineMode === "none")) autoNext();
        break;
      }
      case "goto": go(el.dataset.step, { dir: "back" }); break;
      case "copy":
        copyText(summaryText()).then((ok) => toast(ok ? "คัดลอกสรุปแล้ว" : "กดค้างที่ข้อความเพื่อคัดลอก"));
        break;
      case "messenger": {
        track("send_messenger");
        const open = () => {
          if (!CK.config.messengerPage) { toast("ยังไม่ได้ตั้งชื่อเพจ (messengerPage ใน js/data.js)"); return; }
          window.open(`https://m.me/${CK.config.messengerPage}?ref=${encodeURIComponent(S.ref)}`, "_blank");
        };
        copyText(summaryText()).then((ok) => {
          toast(ok ? "คัดลอกสรุปแล้ว วางในแชทแล้วกดส่งได้เลย" : "คัดลอกจากกล่องข้อความสรุปด้านล่างได้เลย");
          setTimeout(open, 900);
        });
        break;
      }
      case "sent-email": track("send_email"); break;
      case "share-img": shareSummaryImage(); break;
      case "via": {
        S.contact.via = el.dataset.v; save();
        render("none");
        setTimeout(() => document.querySelector('#contactForm [name="name"]')?.focus({ preventScroll: true }), 50);
        document.querySelector("#contactForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
        break;
      }
      case "retry":
        el.disabled = true; el.textContent = "กำลังส่ง…";
        sendToShop().then(() => render("none"));
        break;
      case "open-chat":
        window.open(`https://m.me/${CK.config.messengerPage}?ref=${encodeURIComponent(S.ref)}`, "_blank");
        break;
      case "switch-via":
        S.contact.via = S.contact.via === "email" ? "messenger" : "email"; save();
        go("summary", { dir: "back" });
        break;
      case "print": buildPrint(); window.print(); break;
      case "restart": localStorage.removeItem(STORE_KEY); S = blank(); go("intro", { dir: "back" }); break;
    }
  });
  app.addEventListener("change", (e) => {
    const a = e.target.dataset.action;
    if (a === "unique") { S.uniqueName = e.target.checked; save(); render("none"); }
    if (a === "twosides") { S.twoSides = e.target.checked; save(); render("none"); }
  });
  $("#nextBtn").addEventListener("click", next);
  $("#backBtn").addEventListener("click", back);

  // ---------- รูปสรุปราคา ----------
  let summaryBlob = null, summaryUrl = null;
  function imageData() {
    const p = product(); const r = q(); const c = S.contact;
    const m = S.method === "print" ? "พิมพ์" : "เลเซอร์";
    const rows = [];
    if (r.ok) {
      rows.push({ label: `แก้ว + ${m}โลโก้${S.twoSides ? "ด้านที่ 1" : " 1 จุด"}`, sub: `${fmt(r.itemUnit)} × ${fmt(S.qty)} ใบ`, amount: fmt(r.itemUnit * S.qty) });
      if (S.twoSides) rows.push({ label: `${m}โลโก้ด้านที่ 2`, sub: `${fmt(r.sideUnit)} × ${fmt(S.qty)} ใบ`, amount: fmt(r.sideUnit * S.qty) });
      if (S.uniqueName) rows.push({ label: "ชื่อไม่ซ้ำกันแต่ละใบ", sub: `${fmt(r.nameUnit)} × ${fmt(S.qty)} ใบ`, amount: fmt(r.nameUnit * S.qty) });
      rows.push({ label: `ค่าส่ง · ${shipText()}`, amount: r.shipping === 0 ? "ฟรี" : fmt(r.shipping) });
      if (S.vat) rows.push({ label: "VAT 7%", amount: fmt(r.vat) });
    }
    const notes = [];
    if (!r.ok) notes.push("งานพิมพ์รุ่นนี้ต่ำกว่า 50 ใบ แอดมินจะแจ้งราคาให้");
    if (r.flags.includes("belowMin")) notes.push("ต่ำกว่าขั้นต่ำปกติ (50 ใบ) แอดมินจะยืนยันการรับงาน");
    if (r.flags.includes("bigOrder")) notes.push("ออเดอร์จำนวนมาก แอดมินดูแลเป็นพิเศษ");
    if (c.note.trim()) notes.push(`หมายเหตุ: ${c.note.trim()}`);
    return {
      ref: S.ref, date: thaiDate((S.sentAt || new Date().toISOString()).slice(0, 10)),
      code: p.code, name: p.name, img: p.img, method: methodText(),
      rows, total: r.ok ? `${fmt(r.total)}฿` : "รอแอดมิน", totalNote: r.ok ? (S.vat ? "ยอดรวม" : "ยอดรวม (ไม่รวม VAT)") : "ราคา",
      perUnit: r.ok ? `เฉลี่ยใบละ ${fmt(Math.round((r.total / S.qty) * 100) / 100)} บาท` : "",
      details: [
        ["จำนวน", `${fmt(S.qty)} ใบ`],
        ["ใบกำกับภาษี", S.vat ? "ต้องการ" : "ไม่ต้องการ"],
        ["โลโก้", logoText()],
        ["ผู้ติดต่อ", c.name + (c.company ? ` · ${c.company}` : "")],
      ],
      notes,
      contact: `แชทเพจ CK Premium  ·  ${CK.config.email}`,
    };
  }
  async function buildSummaryImage() {
    const img = $("#summaryImg");
    try {
      summaryBlob = await window.CKSummaryImage.draw(imageData());
      if (summaryUrl) URL.revokeObjectURL(summaryUrl);
      summaryUrl = URL.createObjectURL(summaryBlob);
      if (img) { img.src = summaryUrl; img.closest(".sum-img")?.classList.add("ready"); }
    } catch (e) {
      img?.closest(".sum-img")?.classList.add("failed");
    }
  }
  async function shareSummaryImage() {
    if (!summaryBlob) await buildSummaryImage();
    if (!summaryBlob) { toast("สร้างรูปไม่สำเร็จ ใช้ข้อความสรุปแทนได้"); return; }
    const name = `CK-Premium-${S.ref}.png`;
    const file = new File([summaryBlob], name, { type: "image/png" });
    track("summary_image", { via: S.contact.via });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: `สรุปราคา ${S.ref}` }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    const a = document.createElement("a");
    a.href = summaryUrl; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    toast("บันทึกรูปแล้ว — ถ้าไม่มีไฟล์ ให้กดค้างที่รูปเพื่อบันทึก");
  }

  // คัดลอกข้อความ — รองรับเบราว์เซอร์ในแอป Facebook ที่ไม่มี clipboard API
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
      const ok = document.execCommand("copy"); ta.remove(); return ok;
    } catch (e) { return false; }
  }

  function openLightbox(src) { $("#lightboxImg").src = src; $("#lightbox").hidden = false; }
  $("#lightbox").addEventListener("click", () => ($("#lightbox").hidden = true));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("#lightbox").hidden = true; });

  S.contact = Object.assign(blank().contact, S.contact);
  // ขั้นเลือกสีปิดอยู่ — ล้างสีที่อาจค้างจากเวอร์ชันก่อน
  if (!stepDef("color").visible()) S.colors = [];
  // ถ้ากลับมาหน้าเดิมหลังส่งแล้ว ให้เตรียมใบพิมพ์ไว้
  if (S.step === "done" && S.ref) buildPrint();
  // ข้อมูลไม่ครบ (เช่น รุ่นถูกลบ) ให้เริ่มใหม่
  if (!["intro", "model"].includes(S.step) && !product()) S.step = "model";
  render("none");
})();
