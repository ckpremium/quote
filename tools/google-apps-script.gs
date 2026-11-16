/**
 * CK Premium — รับคำขอใบเสนอราคาจากหน้าเช็กราคา
 * - บันทึกทุกคำขอลงชีต "คำขอใบเสนอราคา"
 * - แจ้งเตือนเข้า Telegram (ถ้าตั้งค่า TELEGRAM_BOT_TOKEN และ TELEGRAM_CHAT_ID ใน Script Properties)
 * - ส่งอีเมลแจ้งร้าน พร้อมแนบรูปสรุปราคา
 *   ถ้าลูกค้าเลือกรับทางอีเมล: กด "ตอบกลับ" ในอีเมลนี้ = ตอบลูกค้าโดยตรง แนบใบเสนอราคาแล้วส่งได้เลย
 *
 * วิธีติดตั้ง: ดู README.md หัวข้อ "ตั้งค่าระบบรับคำขอ"
 */

const NOTIFY_EMAIL = "ckprintingth@gmail.com"; // อีเมลร้านที่รับแจ้งเตือน
const SHEET_NAME = "คำขอใบเสนอราคา";
const HEADERS = [
  "เวลา", "เลขอ้างอิง", "ช่องทาง", "สถานะ", "ชื่อ", "อีเมล", "เบอร์โทร", "บริษัท",
  "เลขผู้เสียภาษี", "สาขา", "ที่อยู่ใบกำกับ", "รุ่น", "งาน", "จำนวน", "ราคาต่อใบ",
  "ค่าส่ง", "จัดส่ง", "VAT", "ยอดรวม", "หมายเหตุลูกค้า", "โลโก้", "หมายเหตุระบบ",
];

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (!d.ref || !d.name) return json({ ok: false, error: "missing" });

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sh = sheet();
      sh.appendRow([
        new Date(), d.ref, d.via === "email" ? "อีเมล" : "แชทเพจ", "ใหม่",
        cut(d.name), cut(d.email), "'" + cut(d.phone), cut(d.company),
        "'" + cut(d.taxId), cut(d.branch), cut(d.address, 500), cut(d.product), cut(d.method),
        num(d.qty), num(d.unit), num(d.shipping), cut(d.ship), d.vat ? num(d.vatAmount) : "-",
        num(d.total), cut(d.note || d.deadline, 500), cut(d.logo), cut(d.flags),
      ]);
    } finally {
      lock.releaseLock();
    }

    const viaEmail = d.via === "email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || "");
    const subject = `[${viaEmail ? "ส่งใบเสนอราคาทางอีเมล" : "รอลูกค้าทักแชทเพจ"}] ${d.ref} · ${cut(d.product, 60)} ${d.qty} ใบ · ${d.name}`;
    const intro = viaEmail
      ? `ลูกค้าขอรับใบเสนอราคาทางอีเมล\nกด "ตอบกลับ" อีเมลนี้เพื่อส่งใบเสนอราคาถึงลูกค้า (${d.email}) ได้เลย\n\n`
      : `ลูกค้าเลือกคุยต่อในแชทเพจ Facebook — รอลูกค้าส่งรูปสรุปเลขอ้างอิง ${d.ref} เข้ามา\n\n`;
    const image = d.image ? Utilities.newBlob(Utilities.base64Decode(d.image), "image/png", `${d.ref}.png`) : null;

    // Telegram ก่อน (แจ้งเร็ว) — ถ้าพังไม่กระทบอีเมล
    try { notifyTelegram(d, viaEmail, image); } catch (err) { console.error("telegram", err); }

    const options = { name: "CK Premium · หน้าเช็กราคา" };
    if (viaEmail) options.replyTo = d.email;
    if (image) options.attachments = [image];
    MailApp.sendEmail(NOTIFY_EMAIL, subject, intro + cut(d.summary, 4000), options);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// ---------- Telegram ----------
function tgConfig() {
  const p = PropertiesService.getScriptProperties();
  return { token: p.getProperty("TELEGRAM_BOT_TOKEN"), chatId: p.getProperty("TELEGRAM_CHAT_ID") };
}

function notifyTelegram(d, viaEmail, image) {
  const { token, chatId } = tgConfig();
  if (!token || !chatId) return;
  const money = (n) => (n === "" || n == null ? "-" : Number(n).toLocaleString("th-TH"));
  const lines = [
    `🔔 คำขอใบเสนอราคาใหม่ ${d.ref}`,
    viaEmail ? `📧 ส่งใบเสนอราคาทางอีเมล: ${d.email}` : `💬 ลูกค้าจะทักแชทเพจ (รอรับรูปสรุป)`,
    `👤 ${d.name}${d.company ? " · " + d.company : ""}${d.phone ? " · " + d.phone : ""}`,
    `🥤 ${d.product} · ${d.method}`,
    `📦 ${d.qty} ใบ · ใบละ ${money(d.unit)} บาท`,
    `🚚 ${d.ship}${d.vat ? " · ใบกำกับภาษี" : ""}`,
    `💰 ยอดรวม ${money(d.total)} บาท${d.vat ? " (รวม VAT)" : ""}`,
    d.note ? `📝 ${cut(d.note, 300)}` : "",
  ].filter(Boolean);
  const text = lines.join("\n");
  const base = `https://api.telegram.org/bot${token}`;
  if (image && text.length <= 1000) {
    UrlFetchApp.fetch(`${base}/sendPhoto`, { method: "post", payload: { chat_id: chatId, caption: text, photo: image }, muteHttpExceptions: true });
  } else {
    UrlFetchApp.fetch(`${base}/sendMessage`, { method: "post", payload: { chat_id: chatId, text }, muteHttpExceptions: true });
  }
}

/** ขั้นตอนตั้งค่า: ทักบอทใน Telegram 1 ข้อความก่อน แล้วกด Run ฟังก์ชันนี้ ดู Chat ID ใน Execution log */
function findTelegramChatId() {
  const { token } = tgConfig();
  if (!token) { console.log("ยังไม่ได้ใส่ TELEGRAM_BOT_TOKEN ใน Script Properties"); return; }
  const res = JSON.parse(UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/getUpdates`, { muteHttpExceptions: true }).getContentText());
  const chats = {};
  (res.result || []).forEach((u) => {
    const m = u.message || u.channel_post || u.my_chat_member;
    if (m && m.chat) chats[m.chat.id] = m.chat.title || [m.chat.first_name, m.chat.last_name].filter(Boolean).join(" ") || m.chat.username;
  });
  const list = Object.keys(chats);
  if (!list.length) console.log("ไม่พบแชท — ทักบอทใน Telegram (หรือเพิ่มบอทเข้ากลุ่มแล้วพิมพ์อะไรสักอย่าง) แล้วลองใหม่");
  list.forEach((id) => console.log(`Chat ID: ${id}  (${chats[id]})`));
}

/** กด Run เพื่อทดสอบส่งข้อความเข้า Telegram */
function testTelegram() {
  notifyTelegram({ ref: "TEST", name: "ทดสอบระบบ", product: "TBL-19 แก้วเยติ 20 oz", method: "เลเซอร์โลโก้ 1 ด้าน", qty: 100, unit: 85, ship: "กรุงเทพฯ", total: 9000, vat: false }, false, null);
  console.log("ส่งแล้ว — เช็กใน Telegram");
}

function doGet() {
  return json({ ok: true, service: "CK Premium quote" });
}

function sheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#fff3e8");
  }
  return sh;
}

function cut(v, n) { return String(v == null ? "" : v).slice(0, n || 200); }
function num(v) { return v === "" || v == null ? "" : Number(v); }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** กด Run ฟังก์ชันนี้ 1 ครั้งตอนติดตั้ง เพื่ออนุญาตสิทธิ์ และสร้างหัวตาราง */
function setup() {
  sheet();
  MailApp.getRemainingDailyQuota();
  UrlFetchApp.fetch("https://api.telegram.org", { muteHttpExceptions: true }); // ขอสิทธิ์เรียกเว็บภายนอก (Telegram)
}
