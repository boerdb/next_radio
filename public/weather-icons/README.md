# Weericonen (optioneel, geen PHP)

Standaard gebruikt de app **ingebouwde SVG-iconen** (geen OpenWeather-plaatjes).

Wil je **eigen** PNG of SVG vanaf deze site (bv. `https://app.benswebradio.nl/weather-icons/01d.png`):

1. Zet in `.env.production` of `.env.local`:

   ```env
   NEXT_PUBLIC_WEATHER_ICON_BASE_URL=https://app.benswebradio.nl/weather-icons
   NEXT_PUBLIC_WEATHER_ICON_EXT=png
   ```

   Of relatief (zelfde host als de app):

   ```env
   NEXT_PUBLIC_WEATHER_ICON_BASE_URL=/weather-icons
   ```

2. Plaats bestanden met **exact** dezelfde naam als het OpenWeather `icon`-veld:

   `01d` `01n` `02d` `02n` `03d` `03n` `04d` `04n` `09d` `09n` `10d` `10n` `11d` `11n` `13d` `13n` `50d` `50n`

   Voorbeeld: `01d.png`, `01n.png`, …

3. Als een bestand ontbreekt of niet laadt, valt de app automatisch terug op de ingebouwde SVG.

**Template-URL** (als je bestanden ergens anders hangen):

```env
NEXT_PUBLIC_WEATHER_ICON_URL_TEMPLATE=https://app.benswebradio.nl/weather-icons/{icon}.png
```

(`{icon}` wordt vervangen door bv. `01d`.)
