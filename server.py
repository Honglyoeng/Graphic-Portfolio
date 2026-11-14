#!/usr/bin/env python3
"""
Backstage server for the lotus portfolio.

    python3 server.py

Then open:
    http://localhost:8765          the portfolio
    http://localhost:8765/admin    backstage (upload images, edit projects)

Uploaded images are saved into ./works and project details into ./projects.json.
It only listens on your own computer (127.0.0.1), so nobody else can reach backstage.
To publish, upload the whole folder (index.html, projects.json, works/) to any static host;
backstage itself only works while this server runs on your machine.
"""
import json
import mimetypes
import os
import re
import secrets
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
WORKS = os.path.join(ROOT, "works")
DATA = os.path.join(ROOT, "projects.json")
PORT = int(os.environ.get("PORT", "8765"))
MAX_BYTES = 40 * 1024 * 1024
TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp",
         "image/gif": ".gif", "image/avif": ".avif"}

mimetypes.add_type("image/avif", ".avif")
mimetypes.add_type("image/webp", ".webp")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "/api/" in (args[0] if args else ""):
            sys.stderr.write("%s\n" % (fmt % args))

    # --- helpers -------------------------------------------------------
    def send_json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_body(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > MAX_BYTES:
            raise ValueError("File is larger than 40 MB")
        return self.rfile.read(n)

    def same_origin(self):
        origin = self.headers.get("Origin")
        return origin is None or origin == "http://%s" % self.headers.get("Host")

    # --- API -----------------------------------------------------------
    def do_POST(self):
        if not self.same_origin():
            return self.send_json(403, {"error": "forbidden"})
        url = urlparse(self.path)
        try:
            if url.path == "/api/projects":
                data = json.loads(self.read_body())
                if not isinstance(data, dict) or not isinstance(data.get("projects"), list):
                    raise ValueError("Unexpected data")
                tmp = DATA + ".tmp"
                with open(tmp, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                os.replace(tmp, DATA)
                return self.send_json(200, {"ok": True})

            if url.path == "/api/upload":
                ctype = (self.headers.get("Content-Type") or "").split(";")[0].strip()
                if ctype not in TYPES:
                    return self.send_json(415, {"error": "Use JPG, PNG, WebP, AVIF or GIF"})
                name = parse_qs(url.query).get("name", ["image"])[0]
                stem = re.sub(r"[^a-z0-9]+", "-", os.path.splitext(name)[0].lower()).strip("-")[:40] or "image"
                filename = "%s-%s%s" % (stem, secrets.token_hex(3), TYPES[ctype])
                os.makedirs(WORKS, exist_ok=True)
                with open(os.path.join(WORKS, filename), "wb") as f:
                    f.write(self.read_body())
                return self.send_json(200, {"src": "works/" + filename})
        except Exception as e:  # report problems to the backstage page
            return self.send_json(400, {"error": str(e)})
        self.send_json(404, {"error": "not found"})

    def do_DELETE(self):
        if not self.same_origin():
            return self.send_json(403, {"error": "forbidden"})
        url = urlparse(self.path)
        if url.path == "/api/upload":
            src = parse_qs(url.query).get("src", [""])[0]
            filename = os.path.basename(src)
            path = os.path.join(WORKS, filename)
            if filename and src == "works/" + filename and os.path.isfile(path):
                os.remove(path)
                return self.send_json(200, {"ok": True})
            return self.send_json(404, {"error": "not found"})
        self.send_json(404, {"error": "not found"})


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print("Portfolio:  http://localhost:%d" % PORT)
    print("Backstage:  http://localhost:%d/admin" % PORT)
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
