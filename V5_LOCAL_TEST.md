# TFT Helper V5 — Local test

## 1. Install
```bash
npm install
```

## 2. Environment
Create `.env.local`:
```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.6-flash
```

## 3. Run AI API
Terminal 1:
```bash
npm run dev:api
```
This starts the local API on `http://localhost:8787`.

## 4. Run React
Terminal 2:
```bash
npm run dev
```
Vite proxies `/api` to port `8787`.

## V5 behavior
- Greetings are handled locally.
- TFT questions use cached Fuse matching + small local RAG context.
- Context sent to Gemini is capped to keep prompts small.
- Asset URLs stay outside the AI prompt.
- `/api/chat` has a small in-memory development rate limit.
- Auth/VPS/Nginx/PM2/Docker are intentionally not required for local testing.

### V5.0.1 changes
- Gemini default/model example: `gemini-3.6-flash`.
- Không retry 429; chỉ retry 5xx tối đa 1 lần.
- Context và history được thu gọn để giảm độ trễ.
- Router nhận diện các câu hỏi gợi ý bài/reroll tốt hơn.
- Fallback đọc đúng cấu trúc `context.chunks`.
