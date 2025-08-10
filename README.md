# Amour à travers le monde — Proxy Gemini

- Déployez un proxy Cloudflare Workers pour appeler Gemini sans exposer la clé côté client.
- En local, vous pouvez tester en « mode démo »: l’app demandera une clé API temporaire (non sauvegardée).

## Cloudflare Workers
1. `npm create cloudflare@latest` (ou utilisez les fichiers ci-dessous si présents: `wrangler.toml`, `worker/src/index.ts`).
2. Ajoutez la variable `GEMINI_API_KEY` via `wrangler secret put GEMINI_API_KEY`.
3. Déployez: `npx wrangler deploy`.
4. Configurez un route (`/api/gemini/generate-romance`) ou utilisez un sous-domaine du worker et mettez-le dans `PROXY_GEMINI_URL` si besoin.

## Mode démo
- Cliquez « Générer un message mignon 💌 ». Si le proxy n’est pas dispo, une invite vous demandera une clé API Gemini. Rien n’est stocké.