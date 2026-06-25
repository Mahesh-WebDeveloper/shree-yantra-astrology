# Authentic Hindi Veda extractor — renders a mahakavya Veda PDF page-by-page and
# OCRs each page with Gemini Vision (the book's REAL Hindi anuvad, AI only transcribes).
# Resumable: already-OCR'd pages skipped. Then run parse_veda.py to build aligned JSON.
#
# Usage:
#   python ocr_veda.py <pdf_path> <out_dir> <first_content_page> [last_page]
# Needs: pip install pymupdf ; GEMINI_API_KEY in backend/.env
import fitz, base64, json, urllib.request, sys, time, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ENV = os.path.join(HERE, "..", "..", "..", ".env")

def gemini_key():
    for line in open(ENV, encoding="utf-8"):
        if line.startswith("GEMINI_API_KEY"):
            return line.split("=", 1)[1].strip().strip('"').strip("\r")
    raise SystemExit("GEMINI_API_KEY not found in .env")

PROMPT = ("Transcribe ALL text on this page from an authentic printed Hindi Veda book "
          "EXACTLY as printed: the संस्कृत मंत्र (ending with its number like (१)), then its "
          "हिंदी अनुवाद (also ending with the same (१)), plus headers like 'सूक्त—N देवता—X' and "
          "'प्रथम मंडल'/'द्वितीय मंडल'. Preserve line breaks. Output ONLY the transcribed text, nothing else.")

def ocr_page(doc, pn, key, model="gemini-2.5-flash"):
    pix = doc[pn].get_pixmap(dpi=200)
    b64 = base64.b64encode(pix.tobytes("png")).decode()
    body = json.dumps({"contents": [{"parts": [
        {"text": PROMPT},
        {"inline_data": {"mime_type": "image/png", "data": b64}}]}],
        "generationConfig": {"temperature": 0, "maxOutputTokens": 3000}}).encode()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    r = urllib.request.urlopen(req, timeout=150)
    d = json.load(r)
    return "".join(p.get("text", "") for p in d["candidates"][0]["content"]["parts"])

def main():
    sys.stdout.reconfigure(encoding="utf-8")
    pdf = sys.argv[1]; out = sys.argv[2]
    first = int(sys.argv[3]); last = int(sys.argv[4]) if len(sys.argv) > 4 else None
    key = gemini_key()
    doc = fitz.open(pdf)
    last = last if last is not None else doc.page_count - 1
    pages_dir = os.path.join(out, "pages")
    os.makedirs(pages_dir, exist_ok=True)
    done = 0; skipped = 0; failed = []
    for pn in range(first, last + 1):
        fn = os.path.join(pages_dir, f"p{pn:04d}.txt")
        if os.path.exists(fn) and os.path.getsize(fn) > 5:
            skipped += 1; continue
        for attempt in range(4):
            try:
                t = ocr_page(doc, pn, key)
                open(fn, "w", encoding="utf-8").write(t)
                done += 1; break
            except urllib.error.HTTPError as e:
                if e.code in (429, 503):  # rate limit / overloaded — backoff
                    wait = 20 * (attempt + 1)
                    print(f"p{pn}: {e.code}, backoff {wait}s", flush=True); time.sleep(wait)
                else:
                    print(f"p{pn}: HTTP {e.code}", flush=True); failed.append(pn); break
            except Exception as e:
                print(f"p{pn}: {e}", flush=True); time.sleep(5)
        else:
            failed.append(pn)
        if done % 20 == 0 and done:
            print(f"...{done} OCR'd ({skipped} skipped), at page {pn}", flush=True)
        time.sleep(1)
    print(f"DONE. ocr'd={done} skipped={skipped} failed={len(failed)} {failed[:20]}", flush=True)

if __name__ == "__main__":
    main()
