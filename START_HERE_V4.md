# TFT Helper AI V4 — START HERE

## Architecture

React/Vite -> `/api/chat` -> Node server -> Gemini REST API.

For TFT questions: preprocess -> intent -> Fuse.js fuzzy matching -> local JSON retrieval -> Gemini explanation.
For normal chat/greetings: skip RAG and send a small prompt to Gemini.
If Gemini fails: retry transient errors, then frontend falls back to local JSON when possible.

## Local development

1. Copy `.env.example` to `.env.local` and fill `GEMINI_API_KEY`.
2. Install packages: `npm install`.
3. Build once: `npm run build`.
4. Start API/server for the Vite proxy: `npm run dev:api` in terminal 1.
5. Start frontend: `npm run dev` in terminal 2.
6. Open the Vite URL, usually `http://localhost:5173`.

## Production / VPS

1. Install Node.js LTS and Git on the VPS.
2. Clone the project.
3. `npm ci`
4. Create `.env` with `GEMINI_API_KEY` and `GEMINI_MODEL`.
5. `npm run build`
6. `npm start`
7. Put Nginx in front of port 3000 and point your domain at the VPS.
8. Add HTTPS with Certbot.

The same `server.js` runs the API and the built React site, so no Vercel-specific runtime is required for the VPS deployment.
