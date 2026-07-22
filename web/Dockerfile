# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Frontend (servidor de dev do Vite) em container — para clonar e correr sem
# instalar Node. O backend (Supabase) corre à parte via `npx supabase start`
# (já é dockerizado pelo CLI); o browser fala com ele em http://127.0.0.1:44321
# (ver web/.env.local). Ver docs/SETUP.md.
# ---------------------------------------------------------------------------
FROM node:20-alpine

WORKDIR /app

# Dependências primeiro, para aproveitar a cache de camadas do Docker.
COPY package.json package-lock.json ./
RUN npm ci

# No docker-compose o código é montado por bind-mount (hot reload); este COPY
# torna a imagem utilizável também sozinha (`docker build` + `docker run`).
COPY . .

EXPOSE 5173

# `--host` liga o servidor a 0.0.0.0 para ser acessível fora do container.
CMD ["npm", "run", "dev", "--", "--host"]
