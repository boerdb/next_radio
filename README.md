# Bens Music – Radio PWA

Next.js PWA voor Bens Web Radio met Azuracast-streams, NPO Soul & Jazz, live stream en weer (Harlingen).

## Vereisten

- Node.js 20+
- npm

## Lokaal ontwikkelen

```bash
npm install
cp .env.example .env.local
# Vul OPENWEATHER_API_KEY in .env.local
npm run dev
```

Open http://localhost:3000

## Productie (eigen server)

```bash
git clone <jouw-repo-url>
cd netxt_radio
npm install
cp .env.example .env.local
# Bewerk .env.local:
#   OPENWEATHER_API_KEY=...
#   NEXT_PUBLIC_AZURACAST_URL=https://benswebradio.nl

npm run build
npm start
```

De app draait standaard op poort **3000**. Gebruik nginx/Caddy als reverse proxy met HTTPS (vereist voor PWA).

### Omgevingsvariabelen

| Variabele | Verplicht | Beschrijving |
|-----------|-----------|--------------|
| `OPENWEATHER_API_KEY` | Aanbevolen | OpenWeather API-key voor weer Harlingen |
| `NEXT_PUBLIC_AZURACAST_URL` | Nee | Standaard `https://benswebradio.nl` |

### PM2 (optioneel)

```bash
npm run build
pm2 start npm --name bens-music -- start
pm2 save
```

## Scripts

- `npm run dev` – development
- `npm run build` – productie-build (inclusief PWA service worker)
- `npm start` – productie-server
