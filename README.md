# TFT_18_HELPER — TFT Helper AI

A learning-focused React + Vite helper for TFT Set 18, with a Gemini-powered real-time AI coach grounded on local JSON data.

## Principles
- `public/data/Set18.json`, `comps.json`, and `items_processed.json` remain the source data and are never rewritten by the UI.
- Player-facing text is generated from current JSON values at runtime. Replacing the JSON with a newer export updates names, stats, tooltips, pools, traits and other supported information without rewriting page copy.
- Unit = `shopUnit === true`.
- Internal IDs are used only inside the data/repository layer; the UI prefers in-game names.

## Run locally
```powershell
npm install
copy .env.example .env.local   # điền GEMINI_API_KEY (miễn phí: aistudio.google.com/apikey)
npm run build
npm start                      # http://localhost:3000 — web + AI chat trong 1 server
```

Dev frontend với hot reload: `npm run dev` (cần API chạy riêng: `npm run dev:api`).

Test chat không cần API key thật (mock):
```powershell
node scripts/mock-gemini.js    # terminal 1
$env:GEMINI_API_KEY="mock"; $env:GEMINI_MODEL="mock"; $env:GEMINI_API_ROOT="http://127.0.0.1:8789/v1beta"; npm start  # terminal 2
```

## AI chat (V6)
- **Streaming**: server dùng SSE (`/api/chat/stream`), chữ hiện dần từng đoạn — không phải chờ nguyên câu.
- **Đúng dữ liệu**: trước khi gọi Gemini, câu hỏi được phân tích cục bộ (intent + fuzzy match tên tướng/item/tộc/augment) và chỉ gửi phần dữ liệu JSON liên quan (`RETRIEVED DATA`). Không tìm thấy thực thể nhưng câu hỏi thuộc TFT → gửi digest top đội hình.
- **Chỉ trả lời về TFT**: system prompt buộc từ chối mọi câu hỏi ngoài game.
- **Chống lỗi "lúc được lúc không"**: retry 3 lần cho 429/5xx với backoff, fallback model khi 404, fallback API thường khi stream lỗi, và fallback dữ liệu local khi Gemini không phản hồi.
- Gemini key chỉ nằm trên server (`GEMINI_API_KEY`), không bao giờ gửi xuống trình duyệt.
- Giới hạn 20 request/phút mỗi IP (`server/rateLimit.js`).

## Asset pipeline
```powershell
pip install requests pillow
python scripts/sync_assets.py
```
This downloads supported assets from the current URL templates, creates lightweight WebP derivatives, updates `public/data/assets.json`, and generates augment rarity variants from the augment data.

## Build
```powershell
npm run build
```

## Updating live JSON data
Replace only these files with the newest snapshots, keeping the filenames unchanged: `public/data/Set18.json`, `public/data/comps.json`, `public/data/items_processed.json`. Run `npm run data:validate` after replacement, then rebuild. The AI chat reads the same files — updating them updates the AI's knowledge.

## Deploy lên VPS
Xem **[DEPLOY.md](DEPLOY.md)** — đầy đủ: Node.js, PM2, Docker (`Dockerfile` + `docker-compose.yml`), Nginx (`deploy/nginx.conf`), SSL Certbot.
