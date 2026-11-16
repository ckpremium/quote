// ตัวคำนวณราคา — ไม่มี AI ไม่มีการเดา ทุกตัวเลขมาจากตารางใน data.js
(function (root) {
  function tierIndex(CK, qty) {
    let idx = -1;
    CK.tierMins.forEach((min, i) => { if (qty >= min) idx = i; });
    return idx;
  }

  function stepPrice(table, qty) {
    let price = null;
    table.forEach((row) => { if (qty >= row.min) price = row.price; });
    return price;
  }

  function isFeatured(CK, product) {
    return CK.featured.some((p) => p.code === product.code);
  }

  // ราคาโลโก้ต่อใบ (รวมแก้ว) ตามวิธีทำ — คืน null ถ้าต้องให้แอดมินแจ้งราคา
  function unitPrice(CK, product, method, qty) {
    const i = tierIndex(CK, qty);
    if (i < 0) return null;
    const laser = product.prices[i];
    if (method !== "print") return laser;
    if (isFeatured(CK, product)) return stepPrice(CK.tblPrint, qty); // null ถ้าต่ำกว่า 50
    return laser + CK.printSurcharge;
  }

  function shippingCost(CK, qty, ship) {
    if (!ship) return null;
    if (ship === "pickup") return 0;
    if (qty < 50) return 50 + 10 * (qty - 1);
    return ship === "bkk" ? 500 : 10 * qty;
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  /**
   * sel = { product, method: "laser"|"print", uniqueName: bool, twoSides: bool, qty, ship: "bkk"|"upc"|"pickup"|null,
   *         vat: bool, deadline: "" | "YYYY-MM-DD" }
   */
  function quote(CK, sel) {
    const r = { ok: false, flags: [] };
    const qty = Math.floor(Number(sel.qty) || 0);
    r.qty = qty;
    if (!sel.product) return r;
    if (qty < CK.minQuote) { r.flags.push("tooFew"); return r; }

    const method = sel.method || "laser";
    const item = unitPrice(CK, sel.product, method, qty);
    if (item === null) {
      r.flags.push("adminPrice");
      return r;
    }
    const nameAdd = sel.uniqueName ? stepPrice(CK.uniqueName, qty) : 0;
    const sideAdd = sel.twoSides ? stepPrice(CK.secondSide[method], qty) : 0;
    r.itemUnit = item;
    r.nameUnit = nameAdd;
    r.sideUnit = sideAdd;
    r.unit = item + nameAdd + sideAdd;
    r.subtotal = r.unit * qty;
    r.shipping = shippingCost(CK, qty, sel.ship);
    const beforeVat = r.subtotal + (r.shipping || 0);
    r.vat = sel.vat ? round2(beforeVat * CK.vatRate) : 0;
    r.total = round2(beforeVat + r.vat);
    r.ok = true;

    if (qty < CK.minOrder) r.flags.push("belowMin");
    if (qty >= CK.bigOrder) r.flags.push("bigOrder");
    if (sel.deadline) r.flags.push("deadline");

    // ขั้นราคาถัดไป — ใช้ชวนสั่งเพิ่ม
    const candidates = CK.tierMins.concat(CK.tblPrint.map((t) => t.min), CK.uniqueName.map((t) => t.min), CK.secondSide[method].map((t) => t.min))
      .filter((m) => m > qty).sort((a, b) => a - b);
    for (const nextQty of candidates) {
      const nItem = unitPrice(CK, sel.product, method, nextQty);
      if (nItem === null) continue;
      const nUnit = nItem + (sel.uniqueName ? stepPrice(CK.uniqueName, nextQty) : 0) + (sel.twoSides ? stepPrice(CK.secondSide[method], nextQty) : 0);
      if (nUnit < r.unit) {
        r.next = { qty: nextQty, unit: nUnit, save: r.unit - nUnit };
        break;
      }
    }
    return r;
  }

  const api = { quote, unitPrice, shippingCost, tierIndex, isFeatured, stepPrice };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CKPricing = api;
})(typeof window !== "undefined" ? window : globalThis);
