# AI Text Summariser

Next.js + Vercel AI SDK + Gemini. Paste text, get a streaming summary.

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env.local` and put your Gemini key
   (get one at https://aistudio.google.com/apikey)
3. `npm run dev` and open http://localhost:3000

## Deploy
Push to GitHub, import in Vercel, add env var `GOOGLE_GENERATIVE_AI_API_KEY`, deploy.
