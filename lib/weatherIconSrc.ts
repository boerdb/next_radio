/**
 * Optional custom weather icons (static files, geen PHP).
 *
 * Zet in .env.local bv.:
 *   NEXT_PUBLIC_WEATHER_ICON_BASE_URL=https://app.benswebradio.nl/weather-icons
 * Bestanden: 01d.png, 01n.png, … (zelfde codes als OpenWeather `icon` veld)
 *
 * Of relatief op dezelfde host:
 *   NEXT_PUBLIC_WEATHER_ICON_BASE_URL=/weather-icons
 * en plaats PNG/SVG in public/weather-icons/ (naam bv. 01d.png).
 *
 * Template (één van base of template):
 *   NEXT_PUBLIC_WEATHER_ICON_URL_TEMPLATE=https://app.benswebradio.nl/weather-icons/{icon}.png
 */
export function resolveWeatherIconFileUrl(icon: string): string | null {
  const code = icon.trim() || "01d";
  const template = process.env.NEXT_PUBLIC_WEATHER_ICON_URL_TEMPLATE?.trim();
  if (template?.includes("{icon}")) {
    return template.replaceAll("{icon}", encodeURIComponent(code));
  }
  const base = process.env.NEXT_PUBLIC_WEATHER_ICON_BASE_URL?.replace(/\/+$/, "");
  if (!base) return null;
  const ext = (process.env.NEXT_PUBLIC_WEATHER_ICON_EXT ?? "png").replace(/^\./, "");
  return `${base}/${code}.${ext}`;
}
