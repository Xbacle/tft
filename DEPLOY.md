# DEPLOY — TFT Helper AI trên VPS

Một file duy nhất chạy mọi thứ: `server.js` vừa serve web (thư mục `dist/`) vừa serve API chat (`/api/chat`, `/api/chat/stream`). Nên domain → Nginx (80/443) → Node (3000).

> Chuẩn bị: VPS Ubuntu 22.04/24.04, domain đã trỏ A record về IP VPS.
> Mở port: `sudo ufw allow 80,443/tcp && sudo ufw allow OpenSSH && sudo ufw enable`

---

## Bước 0 — Cài Node.js 22

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git
node -v
```

## Bước 1 — Lấy code & build

```bash
cd /opt
sudo git clone <REPO_CUA_BAN> tft-helper && cd tft-helper
sudo chown -R $USER:$USER .
npm ci
npm run build          # tạo dist/
```

## Bước 2 — Cấu hình API key

```bash
cp .env.example .env.local
nano .env.local        # điền GEMINI_API_KEY (lấy miễn phí tại aistudio.google.com/apikey)
```

Chỉ cần đúng 1 biến `GEMINI_API_KEY`. `GEMINI_MODEL` giữ nguyên `gemini-3.6-flash` (server tự fallback về các model flash khác nếu 404).

Kiểm tra nhanh:
```bash
npm start              # mở http://IP:3000 — vào /api/health phải thấy {"ok":true,"hasApiKey":true}
```

---

## Cách A — Chạy bằng PM2 (khuyên dùng cho VPS nhỏ)

```bash
sudo npm i -g pm2
pm2 start ecosystem.config.cjs
pm2 save && pm2 startup   # chạy tiếp lệnh pm2 startup in ra
pm2 logs tft-helper-ai    # xem log
```

Cập nhật code/data sau này:
```bash
git pull && npm ci && npm run build && pm2 restart tft-helper-ai
```

## Cách B — Chạy bằng Docker

```bash
# Cài docker: curl -fsSL https://get.docker.com | sudo sh
cp .env.example .env.local   # điền key trước
sudo docker compose up -d --build
sudo docker logs -f tft-helper-ai
```

Cập nhật: `git pull && sudo docker compose up -d --build`

---

## Bước 3 — Nginx

```bash
sudo apt-get install -y nginx
sudo cp deploy/nginx.conf /etc/nginx/sites-available/tft-helper
sudo nano /etc/nginx/sites-available/tft-helper   # sửa server_name thành domain của bạn
sudo ln -s /etc/nginx/sites-available/tft-helper /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Quan trọng cho chat streaming: `proxy_buffering off` trong block `/api/` (đã có sẵn trong file mẫu).

## Bước 4 — SSL miễn phí với Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com        # điền email, chọn redirect HTTP → HTTPS
```

Cert tự gia hạn: `sudo certbot renew --dry-run` để kiểm tra.

---

## Cập nhật dữ liệu (3-4 file JSON)

Dữ liệu web + chat nằm ở `public/data/` (Set18.json, comps.json, items_processed.json, assets.json).

1. Thay file JSON mới vào `public/data/`.
2. `npm run build && pm2 restart tft-helper-ai` (Docker: `docker compose up -d --build`).
3. Chat AI tự dùng dữ liệu mới — không cần sửa prompt hay code.

## Xử lý sự cố

| Hiện tượng | Kiểm tra |
|---|---|
| Chat báo thiếu API key | `cat .env.local` có `GEMINI_API_KEY=...`? Restart PM2/Docker sau khi sửa. |
| `GET /api/health` trả `hasApiKey:false` | Env chưa nạp — với PM2: `pm2 restart tft-helper-ai --update-env`; Docker: env_file đúng đường dẫn. |
| Chat trả lời nhưng không stream (đợi rồi hiện 1 lần) | Nginx đang buffer — kiểm tra `proxy_buffering off` trong block `/api/`. |
| Chat báo 429 | Free tier Gemini giới hạn tốc độ — server đã tự retry 3 lần; chờ ít giây rồi thử lại. |
| 502 từ Nginx | `pm2 status` / `docker ps` — app chưa chạy hoặc sai port. |
