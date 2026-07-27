/* Betül Tercih Robotu — statik dosya sunucusu + liste senkron API'si
   Bağımlılık yok (sadece Node çekirdeği). Listeler DATA_DIR/store.json
   içinde tutulur; böylece her cihazdan aynı listelere ulaşılır. */
const http = require("http");
const fs   = require("fs");
const path = require("path");

const PORT      = process.env.PORT || 8080;
const ROOT      = __dirname;
const DATA_DIR  = process.env.DATA_DIR || path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");
try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}

const TYPES = {
  ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8",
  ".png":"image/png", ".jpg":"image/jpeg", ".svg":"image/svg+xml",
  ".ico":"image/x-icon", ".txt":"text/plain; charset=utf-8", ".woff2":"font/woff2"
};

function readStore(){
  try { return fs.readFileSync(DATA_FILE, "utf8"); }
  catch (e) { return JSON.stringify({ lists: [], score: null }); }
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://localhost");

  // ---- liste senkron API ----
  if (u.pathname === "/api/store") {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store" });
      res.end(readStore()); return;
    }
    if (req.method === "PUT" || req.method === "POST") {
      let body = "";
      req.on("data", c => { body += c; if (body.length > 3e6) req.destroy(); });
      req.on("end", () => {
        try {
          const j = JSON.parse(body);
          if (!j || !Array.isArray(j.lists)) throw new Error("bad");
          fs.writeFileSync(DATA_FILE, JSON.stringify(j));
          res.writeHead(200, { "Content-Type":"application/json" }); res.end('{"ok":true}');
        } catch (e) { res.writeHead(400, { "Content-Type":"application/json" }); res.end('{"ok":false}'); }
      });
      return;
    }
    res.writeHead(405); res.end(); return;
  }

  // ---- statik dosyalar ----
  let p = decodeURIComponent(u.pathname);
  if (p === "/") p = "/index.html";
  const fp = path.normalize(path.join(ROOT, p));
  if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end("Yasak"); return; }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404, { "Content-Type":"text/plain; charset=utf-8" }); res.end("Bulunamadı"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(fp)] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => console.log("Betül Tercih Robotu → 0.0.0.0:" + PORT + "  (veri: " + DATA_FILE + ")"));
