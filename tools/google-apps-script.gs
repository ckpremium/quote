/**
 * CK Premium — รับคำขอใบเสนอราคาจากหน้าเช็กราคา
 * - บันทึกทุกคำขอลงชีต "คำขอใบเสนอราคา"
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
  "ค่าส่ง", "จัดส่ง", "VAT", "ยอดรวม", "ต้องใช้ของ", "โลโก้", "หมายเหตุระบบ",
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
        num(d.total), cut(d.deadline), cut(d.logo), cut(d.flags),
      ]);
    } finally {
      lock.releaseLock();
    }

    const viaEmail = d.via === "email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || "");
    const subject = `[${viaEmail ? "ส่งใบเสนอราคาทางอีเมล" : "รอลูกค้าทักแชทเพจ"}] ${d.ref} · ${cut(d.product, 60)} ${d.qty} ใบ · ${d.name}`;
    const intro = viaEmail
      ? `ลูกค้าขอรับใบเสนอราคาทางอีเมล\nกด "ตอบกลับ" อีเมลนี้เพื่อส่งใบเสนอราคาถึงลูกค้า (${d.email}) ได้เลย\n\n`
      : `ลูกค้าเลือกคุยต่อในแชทเพจ Facebook — รอลูกค้าส่งรูปสรุปเลขอ้างอิง ${d.ref} เข้ามา\n\n`;
    const options = { name: "CK Premium · หน้าเช็กราคา" };
    if (viaEmail) options.replyTo = d.email;
    if (d.image) {
      options.attachments = [Utilities.newBlob(Utilities.base64Decode(d.image), "image/png", `${d.ref}.png`)];
    }
    MailApp.sendEmail(NOTIFY_EMAIL, subject, intro + cut(d.summary, 4000), options);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
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
}
