# TFT_18_HELPER — AI Coach V3

## Kiến trúc

`React UI -> retrieveContext() -> /api/chat -> Gemini`

API key chỉ nằm ở server (`GEMINI_API_KEY`). Frontend không gọi Gemini trực tiếp.

## 1. Chạy local bằng Vercel

Không dùng `npm run dev` để test AI vì Vite không tự chạy `/api/chat`.

Cài Vercel CLI một lần:

```powershell
npm install -g vercel
```

Cài project:

```powershell
npm install
```

Đăng nhập:

```powershell
vercel login
```

Tạo `.env.local` ở thư mục gốc:

```env
GEMINI_API_KEY=YOUR_REAL_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.8-flash
```

Chạy:

```powershell
vercel dev
```

Mở URL Vercel CLI đưa ra, thường là `http://localhost:3000`.

## 2. Đổi model

Chỉ sửa:

```env
GEMINI_MODEL=ten-model-muon-dung
```

Không cần sửa React, `api/chat.js` hay retriever.

Ví dụ:

```env
GEMINI_MODEL=gemini-3.8-flash
```

Lưu ý: model phải thực sự tồn tại và được API key/project của bạn cấp quyền. Nếu Gemini trả lỗi 404/not supported thì đổi biến này sang model được phép dùng.

## 3. Deploy Vercel

### Bước A — GitHub

Push toàn bộ project lên GitHub. Không commit `.env.local`.

### Bước B — Import

Vercel -> Add New Project -> Import Git Repository.

Framework: Vite. Build command:

```text
npm run build
```

Output directory:

```text
dist
```

### Bước C — Environment Variables

Vào:

`Project -> Settings -> Environment Variables`

Thêm:

```text
GEMINI_API_KEY = API_KEY_CUA_BAN
GEMINI_MODEL = gemini-3.8-flash
```

Chọn cả Production, Preview và Development nếu cần.

### Bước D — Deploy lại

Vào Deployments -> Redeploy.

Sau đó mở website Vercel và thử chat.

## 4. Kiểm tra lỗi nhanh

Nếu UI báo:

- `Thiếu GEMINI_API_KEY` -> chưa thêm key trên server.
- `Model ... không tồn tại...` -> đổi `GEMINI_MODEL`.
- `Gemini API key không hợp lệ...` -> kiểm tra API key/project/quyền.
- `404 /api/chat` khi chạy local -> đang dùng `npm run dev`; hãy dùng `vercel dev`.

## 5. Bảo mật

Không dùng:

```env
VITE_GEMINI_API_KEY=...
```

Không đặt Gemini API key trong React/frontend. Chỉ dùng:

```env
GEMINI_API_KEY=...
```


## AI V4.1 — tối ưu chat
- `hello`, `helo`, `hi`, `xin chào` được xử lý local: phản hồi gần như tức thì và không gọi Gemini.
- Không retry HTTP 429 vì retry không giúp khi đang bị giới hạn quota/rate.
- Chỉ retry 5xx một lần với delay ngắn.
- Gemini trả Markdown chuẩn và UI render Markdown thay vì hiện `\\*\\*` / `\\#`.
- Chat panel desktop đã tăng kích thước.
