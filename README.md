# Bens Music – Radio PWA

Next.js PWA voor Bens Web Radio Live, Sublime FM, NPO Blend, Radio 10 Soul & Jazz en meer R&B-zenders.

## Vereisten

- Node.js 20+
- npm

## Lokaal ontwikkelen

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## Productie (eigen server)

```bash
git clone <jouw-repo-url>
cd netxt_radio
npm install
cp .env.example .env.local

npm run build
npm start
```

De app draait op poort **3002**. Gebruik nginx/Caddy als reverse proxy met HTTPS (vereist voor PWA).

### Omgevingsvariabelen

| Variabele | Verplicht | Beschrijving |
|-----------|-----------|--------------|
| `NEXT_PUBLIC_LIVE_STREAM_DIRECT` | Nee | Interne stream op het LAN. Standaard `http://192.168.1.81:8000/radio` |

Bens Web Radio Live speelt op een HTTP-adres in het LAN direct de interne stream. Via de HTTPS-app (wifi en mobiel) speelt dezelfde interne stream door `/api/live-stream`, zodat iPhone geluid heeft.

### Publieke URL (Cloudflare tunnel)

De app kan o.a. bereikbaar zijn op **https://app.benswebradio.nl** (tunnel naar je server). Zet daar HTTPS op (vereist voor PWA).

### PM2 (poort 3002)

Zet eventuele variabelen in `.env.local` of `.env.production` in de projectmap (zelfde map als `package.json`). PM2 leest die bestanden via `ecosystem.config.cjs`.

```bash
npm run build
pm2 restart ecosystem.config.cjs --update-env
pm2 save
pm2 startup   # eenmalig: autostart na reboot
```

Handige commando’s:

```bash
pm2 status
pm2 logs next_radio
pm2 restart next_radio
pm2 stop next_radio
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
