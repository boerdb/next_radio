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

De app draait op poort **3002**. Gebruik nginx/Caddy als reverse proxy met HTTPS (vereist voor PWA).

### Omgevingsvariabelen

| Variabele | Verplicht | Beschrijving |
|-----------|-----------|--------------|
| `OPENWEATHER_API_KEY` | Aanbevolen | OpenWeather API-key voor weer Harlingen |
| `NEXT_PUBLIC_AZURACAST_URL` | Nee | Standaard `https://benswebradio.nl` |

### PM2 (poort 3002)

```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # eenmalig: autostart na reboot
```

Handige commando’s:

```bash
pm2 status
pm2 logs bens-music
pm2 restart bens-music
pm2 stop bens-music
```

**Nginx-voorbeeld** (proxy naar poort 3002):

```nginx
location / {
    proxy_pass http://127.0.0.1:3002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Scripts

- `npm run dev` – development
- `npm run build` – productie-build (inclusief PWA service worker)
- `npm start` – productie-server (poort 3002)
