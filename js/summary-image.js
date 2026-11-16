// วาด "รูปสรุปราคา" เป็น PNG เพื่อให้ลูกค้าส่งในแชทเพจ / แนบอีเมลได้ — ไม่ใช้ไลบรารีภายนอก
(function () {
  const W = 1080;
  const PAD = 72;
  const C = {
    orange: "#f07a22", orangeD: "#d45f12", orangeL: "#fff3e8",
    ink: "#2a2522", muted: "#8a817a", line: "#efe8e1", soft: "#faf7f4",
  };
  const F = (w, size, fam = "Prompt") => `${w} ${size}px "${fam}", system-ui, sans-serif`;

  const seg = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("th", { granularity: "word" }) : null;
  function words(text) {
    if (seg) return Array.from(seg.segment(text), (s) => s.segment);
    return Array.from(text);
  }
  function wrap(ctx, text, maxW) {
    const lines = [];
    String(text).split("\n").forEach((para) => {
      let line = "";
      for (const w of words(para)) {
        const test = line + w;
        if (ctx.measureText(test).width > maxW && line) { lines.push(line.trimEnd()); line = w.trimStart(); }
        else line = test;
      }
      lines.push(line);
    });
    return lines;
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function loadImg(src) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => res(img); img.onerror = () => res(null);
      img.src = src;
    });
  }
  async function fontsReady() {
    if (!document.fonts) return;
    const th = "ใบสรุปราคาแก้วโลโก้ บาท";
    await Promise.all([
      document.fonts.load(F(200, 40), th), document.fonts.load(F(300, 40), th),
      document.fonts.load(F(500, 40), th), document.fonts.load(F(600, 40), th),
      document.fonts.load(F(600, 40, "Montserrat"), "CK Premium"), document.fonts.load(F(500, 40, "Montserrat"), "TBL-19"),
    ]).catch(() => {});
  }

  /**
   * d = { ref, date, code, name, img, method, rows: [{label, sub, amount}], total, totalNote, perUnit,
   *       details: [[k, v]], notes: [string], contact: string }
   */
  async function draw(d) {
    await fontsReady();
    const photo = d.img ? await loadImg(d.img) : null;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const inner = W - PAD * 2;

    // ---- วัดความสูงก่อน ----
    const plan = [];
    let y = 0;
    const add = (h, fn) => { plan.push([y, fn]); y += h; };

    // header
    add(300, (y0) => {
      const g = ctx.createLinearGradient(0, y0, W, y0 + 300);
      g.addColorStop(0, "#ffa24a"); g.addColorStop(.5, "#f07a22"); g.addColorStop(1, "#e2552a");
      ctx.fillStyle = g; ctx.fillRect(0, y0, W, 300);
      // logo
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(PAD + 24, y0 + 84, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#ffe0bf"; ctx.beginPath(); ctx.arc(PAD + 46, y0 + 62, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = F(600, 38, "Montserrat"); ctx.textBaseline = "middle";
      ctx.fillText("CK Premium", PAD + 66, y0 + 86);
      ctx.font = F(500, 22, "Montserrat"); ctx.textAlign = "right"; ctx.globalAlpha = .9;
      ctx.fillText("P R I C E   S U M M A R Y", W - PAD, y0 + 86);
      ctx.globalAlpha = 1; ctx.textAlign = "left";
      ctx.font = F(300, 64); ctx.textBaseline = "alphabetic";
      ctx.fillText("ใบสรุปราคา", PAD, y0 + 210);
      ctx.font = F(300, 28); ctx.globalAlpha = .92;
      ctx.fillText(`เลขอ้างอิง ${d.ref}  ·  ${d.date}`, PAD, y0 + 258);
      ctx.globalAlpha = 1;
    });

    // product
    ctx.font = F(500, 44);
    const textX = PAD + 300 + 36;
    const nameLines = wrap(ctx, d.name, W - PAD - textX);
    ctx.font = F(300, 28);
    const methodLines = wrap(ctx, d.method, W - PAD - textX);
    const prodH = Math.max(250, 60 + nameLines.length * 58 + methodLines.length * 40 + 20);
    add(prodH + 40, (y0) => {
      const top = y0 + 50;
      if (photo) {
        ctx.save(); rrect(ctx, PAD, top, 300, 240, 24); ctx.clip();
        const s = Math.max(300 / photo.width, 240 / photo.height);
        const w = photo.width * s, h = photo.height * s;
        ctx.drawImage(photo, PAD + (300 - w) / 2, top + (240 - h) / 2, w, h);
        ctx.restore();
      } else { ctx.fillStyle = C.soft; rrect(ctx, PAD, top, 300, 240, 24); ctx.fill(); }
      let ty = top + 30;
      ctx.fillStyle = C.orangeD; ctx.font = F(500, 24, "Montserrat");
      ctx.fillText(d.code.split("").join(" "), textX, ty);
      ty += 58; ctx.fillStyle = C.ink; ctx.font = F(500, 44);
      nameLines.forEach((l) => { ctx.fillText(l, textX, ty); ty += 58; });
      ctx.fillStyle = C.muted; ctx.font = F(300, 28);
      methodLines.forEach((l) => { ctx.fillText(l, textX, ty - 6); ty += 40; });
    });

    // rows
    add(30, (y0) => { ctx.fillStyle = C.line; ctx.fillRect(PAD, y0 + 10, inner, 2); });
    d.rows.forEach((r) => {
      const h = r.sub ? 110 : 84;
      add(h, (y0) => {
        ctx.fillStyle = C.ink; ctx.font = F(300, 32);
        ctx.fillText(r.label, PAD, y0 + 50);
        if (r.sub) { ctx.fillStyle = C.muted; ctx.font = F(300, 26); ctx.fillText(r.sub, PAD, y0 + 88); }
        ctx.textAlign = "right"; ctx.fillStyle = C.ink; ctx.font = F(400, 34);
        ctx.fillText(r.amount, W - PAD, y0 + 50); ctx.textAlign = "left";
        ctx.fillStyle = C.line; ctx.fillRect(PAD, y0 + h - 2, inner, 2);
      });
    });

    // total
    add(190, (y0) => {
      ctx.fillStyle = C.ink; ctx.font = F(500, 34);
      ctx.fillText(d.totalNote, PAD, y0 + 120);
      ctx.textAlign = "right"; ctx.font = F(200, 112);
      ctx.fillText(d.total, W - PAD, y0 + 130);
      ctx.fillStyle = C.muted; ctx.font = F(300, 26);
      if (d.perUnit) ctx.fillText(d.perUnit, W - PAD, y0 + 176);
      ctx.textAlign = "left";
    });

    // details box
    const detH = 40 + d.details.length * 52 + 20;
    add(detH + 30, (y0) => {
      ctx.fillStyle = C.soft; rrect(ctx, PAD, y0 + 20, inner, detH, 24); ctx.fill();
      let ty = y0 + 20 + 62;
      d.details.forEach(([k, v]) => {
        ctx.fillStyle = C.muted; ctx.font = F(300, 28); ctx.fillText(k, PAD + 36, ty);
        ctx.fillStyle = C.ink; ctx.font = F(400, 28); ctx.textAlign = "right";
        let val = String(v);
        while (ctx.measureText(val).width > inner - 300 && val.length > 4) val = val.slice(0, -2);
        if (val !== String(v)) val = val.trimEnd() + "…";
        ctx.fillText(val, W - PAD - 36, ty); ctx.textAlign = "left";
        ty += 52;
      });
    });

    // notes
    ctx.font = F(300, 26);
    d.notes.forEach((n) => {
      const lines = wrap(ctx, "• " + n, inner - 60);
      const h = 30 + lines.length * 40 + 10;
      add(h + 16, (y0) => {
        ctx.fillStyle = C.orangeL; rrect(ctx, PAD, y0 + 16, inner, h, 18); ctx.fill();
        ctx.fillStyle = "#8a4210"; ctx.font = F(300, 26);
        lines.forEach((l, i) => ctx.fillText(l, PAD + 30, y0 + 16 + 46 + i * 40));
      });
    });

    // footer
    ctx.font = F(300, 24);
    const disclaimer = wrap(ctx, "ราคานี้คำนวณจากตารางราคาปัจจุบัน ยังไม่ใช่ใบเสนอราคา แอดมินจะยืนยันราคาและส่งใบเสนอราคาอย่างเป็นทางการให้อีกครั้ง", inner);
    add(60 + disclaimer.length * 36 + 90, (y0) => {
      ctx.fillStyle = C.line; ctx.fillRect(PAD, y0 + 30, inner, 2);
      ctx.fillStyle = C.muted; ctx.font = F(300, 24);
      disclaimer.forEach((l, i) => ctx.fillText(l, PAD, y0 + 80 + i * 36));
      ctx.fillStyle = C.orangeD; ctx.font = F(400, 26);
      ctx.fillText(d.contact, PAD, y0 + 80 + disclaimer.length * 36 + 30);
    });

    // ---- วาดจริง ----
    canvas.width = W; canvas.height = y + 20;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, canvas.height);
    ctx.textBaseline = "alphabetic";
    plan.forEach(([y0, fn]) => { ctx.save(); fn(y0); ctx.restore(); });
    return new Promise((res) => canvas.toBlob(res, "image/png"));
  }

  window.CKSummaryImage = { draw };
})();
