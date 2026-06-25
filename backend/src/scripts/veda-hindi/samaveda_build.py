# Builds Samaveda JSON: GRETIL IAST Sanskrit (->Devanagari) + Griffith English, aligned positionally.
# Structure: book = Griffith BOOK (sequential), section = DECADE (sequential within book), verse = within decade.
# Reads /tmp sv_sa.html (GRETIL) + sv_en.html (Griffith). Writes samaveda.json (consumed by importSama.js).
import re, json, sys
sys.stdout.reconfigure(encoding="utf-8")
from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate

OUT = sys.argv[1] if len(sys.argv) > 1 else "samaveda.json"
SA_HTML = sys.argv[2] if len(sys.argv) > 2 else "/tmp/sv_sa.html"   # may be Windows-relative
EN_HTML = sys.argv[3] if len(sys.argv) > 3 else "/tmp/sv_en.html"

def clean(html):
    t = re.sub(r'<[^>]+>', ' ', html)
    t = re.sub(r'&#(\d+);', lambda m: chr(int(m.group(1))), t)
    t = re.sub(r'&[a-zA-Z]+;', ' ', t)
    return re.sub(r'\s+', ' ', t)

# ---- GRETIL Sanskrit: extract verse text lines in order, transliterate ----
def parse_gretil(html):
    t = clean(html)
    # verse line refs look like: "1 1 1 0101a <iast text> ." ; collect text after the ref code
    # capture sequences: <digits...> <4-digit><letter> <text until next ref or '..'>
    verses = []
    # split on the reference codes (e.g. 0101a, 0102c) keeping text between
    # a ref token = a 3-4 digit group followed by a single latin letter
    parts = re.split(r'\b(\d{3,4}[a-z])\b', t)
    # parts: text, ref, text, ref, ...
    cur = None
    buf = []
    def flush():
        if cur and buf:
            txt = ' '.join(buf).strip()
            txt = re.sub(r'\s*\.\.?\s*$', '', txt).strip()
            txt = re.sub(r'\s+', ' ', txt)
            if txt:
                verses.append((cur, txt))
    for i, seg in enumerate(parts):
        if re.fullmatch(r'\d{3,4}[a-z]', seg):
            # new ref: dasati+verse code like 0101 (line letter a/c/e...)
            code = seg[:-1]
            line = seg[-1]
            if line == 'a':  # start of a new verse
                flush(); buf = []; cur = code
            # accumulate
        else:
            # text segment following a ref
            seg = seg.strip()
            if cur is not None and seg:
                buf.append(seg)
    flush()
    # transliterate IAST->Devanagari
    out = []
    for code, txt in verses:
        # strip leading hierarchy digits that may remain
        txt = re.sub(r'^[\d\s]+', '', txt).strip()
        dev = transliterate(txt, sanscript.IAST, sanscript.DEVANAGARI)
        out.append(dev)
    return out

# ---- Griffith English: book/decade structure + verses ----
def parse_griffith(html):
    t = clean(html)
    s = t.find('HYMNS OF THE SAMAVEDA')
    if s >= 0: t = t[s:]
    e = t.find('NOTES ON')
    if e > 0: t = t[:e]
    # tokenize by markers and verses
    token = re.compile(r'(FIRST PART|SECOND PART|BOOK [IVXLC]+|CHAPTER [IVXLC]+|DECADE [IVXLC]+|\b\d+\.\s)')
    pieces = token.split(t)
    items = []  # (book, decade, verseNum, text)
    book = 0; decade = 0; vnum = 0
    i = 0
    pending = None
    flat = []
    while i < len(pieces):
        p = pieces[i].strip()
        if p in ('FIRST PART', 'SECOND PART'):
            pass
        elif p.startswith('BOOK '):
            book += 1; decade = 0
        elif p.startswith('CHAPTER '):
            pass
        elif p.startswith('DECADE '):
            decade += 1
        elif re.fullmatch(r'\d+\.', p):
            vnum = int(p[:-1])
            text = pieces[i+1].strip() if i+1 < len(pieces) else ''
            # cut trailing markers accidentally included
            text = re.sub(r'\s+(BOOK|CHAPTER|DECADE|SECOND PART).*$', '', text).strip()
            if text:
                flat.append({'book': book or 1, 'decade': decade or 1, 'verse': vnum, 'english': text})
            i += 1
        i += 1
    return flat

def main():
    sa = parse_gretil(open(SA_HTML, encoding="utf-8", errors="ignore").read())
    en = parse_griffith(open(EN_HTML, encoding="utf-8", errors="ignore").read())
    print(f"GRETIL sanskrit verses: {len(sa)} | Griffith english verses: {len(en)}")
    n = max(len(sa), len(en))
    # group by (book, decade)
    grouped = {}
    for i in range(len(en)):
        e = en[i]
        key = (e['book'], e['decade'])
        grouped.setdefault(key, []).append({
            'verse': e['verse'],
            'sanskrit': sa[i] if i < len(sa) else '',
            'english': e['english'],
        })
    docs = []
    for (book, decade), verses in sorted(grouped.items()):
        docs.append({'book': book, 'section': decade, 'verses': verses})
    json.dump(docs, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"books: {len(set(d['book'] for d in docs))}, sections: {len(docs)}, verses: {sum(len(d['verses']) for d in docs)} -> {OUT}")
    if docs:
        print("sample b1 s1 v1 sa:", docs[0]['verses'][0]['sanskrit'][:50])
        print("sample b1 s1 v1 en:", docs[0]['verses'][0]['english'][:60])

if __name__ == "__main__":
    main()
