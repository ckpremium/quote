import re, json, sys, os
src, out, imgdir = sys.argv[1], sys.argv[2], sys.argv[3]
txt = open(src, encoding='utf-8').read()
tier_mins = [10,20,50,100,200,500,1000,3000,5000]
products = []
for line in txt.splitlines():
    m = re.match(r'^(TBL?-\d+) (.+?) \(([^,()]+), (\d+) Oz\): (.+)$', line)
    if not m: continue
    code, name, mat, oz, rest = m.groups()
    prices = [int(x) for x in re.findall(r'ใบละ (\d+) บาท', rest)]
    assert len(prices) == 9, (code, prices)
    if code.startswith('TBL'): continue
    if 'กระบอก' in name or 'กระติก' in name: cat = 'bottle'
    elif 'กาแฟ' in name or 'coffee' in name.lower(): cat = 'coffee'
    else: cat = 'tumbler'
    p = {"code": code, "name": name, "material": mat, "oz": int(oz), "cat": cat, "prices": prices}
    if code in ("TB-014","TB-030","TB-038"): p["oz"] = None  # capacity unconfirmed
    p["img"] = f"assets/products/{code}.jpg" if os.path.exists(os.path.join(imgdir, code + ".jpg")) else None
    products.append(p)
js = "// สร้างอัตโนมัติจาก FAQ/CK_2_ราคา.txt — แก้ราคาที่ไฟล์นั้นแล้วรันสคริปต์ใหม่ หรือแก้ตรงนี้ได้เลย\nwindow.CK_OTHER_PRODUCTS = " + json.dumps(products, ensure_ascii=False, indent=1) + ";\n"
open(out, 'w', encoding='utf-8').write(js)
print(len(products), "products;", sum(1 for p in products if not p["img"]), "without image:", [p["code"] for p in products if not p["img"]])
