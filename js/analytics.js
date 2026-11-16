// Google tag (GA4) — ตั้งรหัสที่ CK.config.googleTagId ใน js/data.js ว่างไว้ = ปิด
// แท็ก GTM-W69FF44C ส่งข้อมูลเข้า GA4 G-FM2Q2WX4GT (ตั้งค่าในหน้า Google tag)
// ไม่ส่งข้อมูลส่วนตัวลูกค้า (ชื่อ เบอร์ อีเมล) เข้า GA — ส่งแค่ขั้นตอน รุ่น จำนวน ยอดเงิน ช่องทาง
(function () {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };

  const id = (window.CK && CK.config.googleTagId) || "";
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const debug = /[?&]ga_debug=1/.test(location.search);
  if (!id || (local && !debug)) return; // เครื่องตัวเองไม่นับยอด (เปิดทดสอบด้วย ?ga_debug=1)

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);

  gtag("js", new Date());
  if (debug) gtag("set", { debug_mode: true }); // ดูใน GA4 → Admin → DebugView
})();
