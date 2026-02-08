# PDI Baobabay (Web App)

## Regras implementadas
- Ciclo mensal automático (Africa/Luanda)
- Login com senha: nº mecanográfico + código da loja + zona + senha
- Colaborador: PDI com autosave (DRAFT) a cada 2 minutos + debounce
- Supervisor: vê apenas loja/zona (RH vê tudo)
- RH/Admin: filtros + ranking + export Excel/PDF + retake (apaga submissão anterior)

## Como correr (local)
1) Copie `.env.example` para `.env` e ajuste DATABASE_URL e APP_JWT_SECRET
2) Instale dependências:
```bash
npm i
```
3) Migração + seed:
```bash
npm run prisma:migrate
npm run db:seed
```
4) Start:
```bash
npm run dev
```
Abra: http://localhost:3000

## Logins de teste (seed)
- Colaborador: 10001 / Y17 / KILAMBA / 123456
- Supervisor: 90001 / Y17 / KILAMBA / 123456
- RH Admin: 99001 / HQ / LUANDA / 123456

## Importar critérios do Excel
Coloque os ficheiros na raiz do projeto e rode:
```bash
npm run import:excel
```


## Zonas oficiais
- KILAMBA
- CIDADE
- TALATONA
- VIANA
- CAMAMA
- PROVINCIAS


## Deploy (gerar um link público)
Este projeto é Next.js + Prisma (PostgreSQL). Para ter um link público, você pode usar:

- **Vercel (frontend) + Neon/Supabase (Postgres)**
- **Render/Fly.io** (tudo junto)

Passos (Vercel):
1) Crie um Postgres (Neon/Supabase) e copie a DATABASE_URL
2) No Vercel, importe o repositório e configure env:
   - DATABASE_URL
   - APP_JWT_SECRET
   - APP_TIMEZONE=Africa/Luanda
3) Build/Start padrão do Next.
Depois o Vercel dá um link tipo: https://pdi-baobabay.vercel.app
