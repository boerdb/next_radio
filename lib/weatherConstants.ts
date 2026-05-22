/**
 * Shared server cache (all radio-app users). With 15 min → max ~96 OpenWeather
 * calls/day from this app. Your dashboard shows ~25 calls/dag totaal — ruim onder 1000.
 */
export const WEATHER_SERVER_CACHE_MS = 15 * 60 * 1000;
