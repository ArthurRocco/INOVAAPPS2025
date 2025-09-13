# InovaApps Backend (Gemini Proxy)

## Setup
1. `cp .env.example .env` e edite `GEMINI_API_KEY`.
2. `npm i`
3. `npm run dev`
4. Acesse `http://localhost:3000` (o backend serve o frontend).

## Notas
- O endpoint do proxy é `POST /api/gemini-chat`.
- Healthcheck: `GET /api/health` ou `GET /health`.
- Em produção, mantenha a API key **apenas no servidor**.