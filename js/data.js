// ข้อมูลร้านและราคา CK Premium — อ้างอิง FAQ/CK_1, CK_2, CK_3 (อัปเดต 16 พ.ย. 2026)
// ราคาทั้งหมดเป็นราคาต่อใบ ไม่รวม VAT ไม่รวมค่าส่ง รวมโลโก้ 1 จุดแล้ว

window.CK = {
  config: {
    // ใส่ URL ของ Google Apps Script (หรือ API อื่น) เพื่อบันทึกคำขอใบเสนอราคา — ว่างไว้ = ยังไม่บันทึก
    submitUrl: "https://script.google.com/macros/s/AKfycbwEiNaI9TuiPHDKEDLdJrRVuL8E2HJCpjJlA5-pYqOE23aPw7DVmTS6LVKeTuHySFoH/exec",
    // ชื่อผู้ใช้เพจ Facebook เช่น "ckpremium" (จะเปิด m.me/ckpremium) — ว่างไว้ = ซ่อนปุ่ม Messenger
    messengerPage: "ckprintingth",
    lineId: "@ckprinting",
    lineUrl: "https://lin.ee/cta05QU",
    email: "ckprintingth@gmail.com",
    catalogueUrl: "https://ckpremium.github.io/catalogue/",
  },

  // จุดเริ่มของแต่ละขั้นราคา: 10–19, 20–49, 50–99, 100–199, 200–499, 500–999, 1,000–2,999, 3,000–4,999, 5,000+
  tierMins: [10, 20, 50, 100, 200, 500, 1000, 3000, 5000],

  minOrder: 50,      // ขั้นต่ำปกติ (10–49 ใบ ยังบอกราคาได้)
  minQuote: 10,      // จำนวนน้อยที่สุดที่มีราคา
  bigOrder: 2000,    // ตั้งแต่จำนวนนี้ แอดมินดูแลเป็นเคสด่วน
  vatRate: 0.07,

  // งานพิมพ์: รุ่นทั่วไป = ราคาเลเซอร์ + 20 บาท/ใบ
  printSurcharge: 20,
  // งานพิมพ์ TBL-17/18/19 (ต่ำกว่า 50 ใบ แอดมินแจ้งราคา)
  tblPrint: [
    { min: 50, price: 130 },
    { min: 100, price: 99 },
    { min: 200, price: 97 },
    { min: 500, price: 95 },
    { min: 1000, price: 90 },
  ],
  // เลเซอร์ชื่อไม่ซ้ำ (บวกเพิ่มต่อใบ)
  uniqueName: [
    { min: 10, price: 65 },
    { min: 20, price: 60 },
    { min: 50, price: 55 },
    { min: 100, price: 50 },
    { min: 200, price: 47 },
    { min: 500, price: 45 },
    { min: 1000, price: 40 },
  ],

  // โลโก้ด้านที่ 2 (บวกเพิ่มต่อใบ) — จากตาราง "เลเซอร์ / พิมพ์ UV" ใน CK_2 (ต่ำกว่า 50 ใบ ใช้ราคาขั้น 50)
  secondSide: {
    laser: [
      { min: 0, price: 45 },
      { min: 100, price: 20 },
      { min: 300, price: 17 },
      { min: 500, price: 15 },
      { min: 1000, price: 10 },
    ],
    print: [
      { min: 0, price: 65 },
      { min: 100, price: 40 },
      { min: 300, price: 37 },
      { min: 500, price: 35 },
      { min: 1000, price: 30 },
    ],
  },

  // รุ่นขายดี — ราคาเหมือนกันทั้ง 3 รุ่น
  featured: [
    {
      code: "TBL-17",
      name: "แก้วทรงไข่",
      ml: 360,
      oz: 12,
      material: "SUS 201",
      img: "assets/tbl/TBL-17.jpg",
      colorsImg: "assets/tbl/TBL-17-colors.jpg",
      prices: [170, 160, 110, 85, 82, 80, 75, 72, 68],
      colors: [
        { k: "A", name: "บานเย็น", hex: "#C42A7E" },
        { k: "B", name: "แดงเลือดหมู", hex: "#A8142E" },
        { k: "C", name: "ชมพูนู้ด", hex: "#E7A4A6" },
        { k: "D", name: "ฟ้า", hex: "#2EA6DC" },
        { k: "E", name: "ส้ม", hex: "#EE7A22" },
        { k: "F", name: "ดำ", hex: "#1D1D1F" },
        { k: "G", name: "ขาว", hex: "#F3F3F1" },
        { k: "H", name: "เขียวทหาร", hex: "#4B6A2C" },
        { k: "I", name: "ม่วงลาเวนเดอร์", hex: "#B592E2" },
        { k: "J", name: "ชมพู", hex: "#F29BB2" },
        { k: "K", name: "กรมท่า", hex: "#1F2C5A" },
      ],
    },
    {
      code: "TBL-18",
      name: "แก้วเยติ 30 oz ทรงอ้วน",
      ml: 890,
      oz: 30,
      material: "SUS 201",
      img: "assets/tbl/TBL-18.jpg",
      colorsImg: "assets/tbl/TBL-18-colors.jpg",
      prices: [170, 160, 110, 85, 82, 80, 75, 72, 68],
      colors: [
        { k: "A", name: "ดำ", hex: "#1D1D1F" },
        { k: "B", name: "ฟ้า", hex: "#2E9AD0" },
        { k: "C", name: "กรมท่า", hex: "#1E2D4E" },
        { k: "D", name: "ขาว", hex: "#ECEDEB" },
        { k: "E", name: "ส้ม", hex: "#FF7A00" },
        { k: "F", name: "เขียวทหาร", hex: "#3D5A29" },
        { k: "G", name: "ชมพู", hex: "#F4A3B6" },
        { k: "H", name: "เหลือง", hex: "#F0DE00" },
        { k: "I", name: "น้ำเงิน", hex: "#1B4DA6" },
        { k: "J", name: "แดงส้ม", hex: "#E5371F" },
        { k: "K", name: "เขียวมะนาว", hex: "#7CCF22" },
        { k: "L", name: "แดง", hex: "#C8102E" },
        { k: "M", name: "ขาว (ฝาแบบ 2)", hex: "#F8F8F8" },
        { k: "N", name: "ม่วง", hex: "#5A3A99" },
        { k: "O", name: "เขียวมินต์", hex: "#4FD0C6" },
        { k: "P", name: "ชมพูช็อกกิ้งพิงก์", hex: "#FF2E92" },
      ],
    },
    {
      code: "TBL-19",
      name: "แก้วเยติ 20 oz",
      ml: 590,
      oz: 20,
      material: "SUS 201",
      img: "assets/tbl/TBL-19.jpg",
      colorsImg: "assets/tbl/TBL-19-colors.jpg",
      prices: [170, 160, 110, 85, 82, 80, 75, 72, 68],
      colors: [
        { k: "A", name: "ส้ม", hex: "#F27A1E" },
        { k: "B", name: "แดง", hex: "#CF1029" },
        { k: "C", name: "ชมพู", hex: "#F3A7C1" },
        { k: "D", name: "ม่วงพลัม", hex: "#8C1B6E" },
        { k: "E", name: "ชมพูเข้ม", hex: "#EF3E89" },
        { k: "F", name: "เขียวเข้ม", hex: "#1F4C3A" },
        { k: "G", name: "เทา", hex: "#7A7A7A" },
        { k: "H", name: "เขียวทหาร", hex: "#556B2F" },
        { k: "I", name: "ดำ", hex: "#1D1D1F" },
        { k: "J", name: "เหลือง", hex: "#E6DF1C" },
        { k: "K", name: "สแตนเลส", hex: "linear-gradient(135deg,#9a9a9a,#f2f2f2 45%,#a8a8a8)" },
        { k: "L", name: "เขียวมะนาว", hex: "#5DBA1F" },
        { k: "M", name: "ม่วง", hex: "#8E5BD6" },
        { k: "N", name: "ส้มอิฐ", hex: "#D1482A" },
        { k: "O", name: "เขียวมินต์", hex: "#3CCDC4" },
        { k: "P", name: "กรมท่า", hex: "#1E2A4A" },
        { k: "Q", name: "ขาว", hex: "#F1F1F1" },
        { k: "R", name: "น้ำเงิน", hex: "#1F7AC0" },
      ],
    },
  ],

  categories: {
    tumbler: "แก้วเก็บความเย็น",
    coffee: "แก้วกาแฟ",
    bottle: "กระบอกน้ำ / กระติก",
  },
};
