# Parses OCR'd Veda pages (from ocr_veda.py) into per-mandala JSON of authentic Hindi,
# aligned by सूक्त—N headers and (मंत्र संख्या) markers. Output consumed by applyRigvedaHindi.js.
#
# Usage: python parse_veda.py <out_dir>
# Produces <out_dir>/rigveda_m<N>.json  ->  { "<sukta>": { "mantras": { "<verse>": "<hindi>" } } }
import re, json, sys, os, glob
from collections import defaultdict

DIG = str.maketrans("०१२३४५६७८९", "0123456789")
def d2i(s): return int(s.translate(DIG))

# Devanagari ordinal -> mandala number (covers Rigveda's 10)
ORD = {"प्रथम":1,"द्वितीय":2,"तृतीय":3,"चतुर्थ":4,"पंचम":5,"पञ्चम":5,
       "षष्ठ":6,"षष्ठम":6,"सप्तम":7,"अष्टम":8,"नवम":9,"दशम":10}

def main():
    out = sys.argv[1]
    pages = sorted(glob.glob(os.path.join(out, "pages", "p*.txt")))
    full = "\n".join(open(p, encoding="utf-8").read() for p in pages)

    # Annotate mandala-change markers inline so split keeps order
    # Replace "<ordinal> मंडल" with a sentinel we can detect during walk
    for word, num in ORD.items():
        full = re.sub(word + r'\s*मंडल', f"@@MANDALA={num}@@", full)

    # Walk tokens: split by sukta headers, but also catch mandala sentinels
    chunks = re.split(r'(सूक्त\s*[—\-–]\s*[०-९\d]+|@@MANDALA=\d+@@)', full)
    mandala = 1
    seen_sukta = False
    by_mandala = defaultdict(dict)  # mandala -> {sukta: {verse: hindi}}
    i = 0
    while i < len(chunks):
        tok = chunks[i]
        mman = re.match(r'@@MANDALA=(\d+)@@', tok or "")
        msuk = re.match(r'सूक्त\s*[—\-–]\s*([०-९\d]+)', tok or "")
        if mman:
            mandala = int(mman.group(1)); i += 1; continue
        if msuk:
            sukta = d2i(msuk.group(1))
            body = chunks[i+1] if i+1 < len(chunks) else ""
            # fallback mandala increment on sukta reset to 1
            if sukta == 1 and seen_sukta:
                mandala += 1
            seen_sukta = True
            marks = [(m.start(), d2i(m.group(1))) for m in re.finditer(r'\(([०-९]+)\)', body)]
            occ = defaultdict(list)
            for pos, n in marks: occ[n].append(pos)
            mantras = {}
            for n in sorted(occ):
                ps = occ[n]
                if len(ps) >= 2:
                    a = body.find(')', ps[0]) + 1; b = ps[1]
                    h = re.sub(r'\s+', ' ', body[a:b]).strip().lstrip('.').strip()
                    if h: mantras[str(n)] = h
            if mantras:
                tgt = by_mandala[mandala].setdefault(str(sukta), {"mantras": {}})
                tgt["mantras"].update(mantras)
            i += 2; continue
        i += 1

    for m, data in sorted(by_mandala.items()):
        fn = os.path.join(out, f"rigveda_m{m}.json")
        json.dump(data, open(fn, "w", encoding="utf-8"), ensure_ascii=False)
        tot = sum(len(v["mantras"]) for v in data.values())
        print(f"mandala {m}: {len(data)} sukta, {tot} mantra hindi -> {os.path.basename(fn)}", flush=True)

if __name__ == "__main__":
    main()
