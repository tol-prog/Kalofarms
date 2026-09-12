import { db, schema } from "@/db";
import { PageHeader } from "@/components/ui/page-header";
import { fetchWeather, weatherLabel } from "@/lib/weather";
import { Wind, Droplets, CloudSun } from "lucide-react";

export const dynamic = "force-dynamic";

type DailyForecast = {
  date: string;
  max: number;
  min: number;
  code: number;
  precipitationSum: number;
};

async function fetchDailyForecast(lat: number, lon: number): Promise<DailyForecast[]> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "7");
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.daily?.time ?? []).map((t: string, i: number) => ({
      date: t,
      max: data.daily.temperature_2m_max[i],
      min: data.daily.temperature_2m_min[i],
      code: data.daily.weathercode[i],
      precipitationSum: data.daily.precipitation_sum?.[i] ?? 0,
    }));
  } catch {
    return [];
  }
}

export default async function ClimatePage() {
  const [farm] = await db.select().from(schema.farmSettings).limit(1);
  const lat = farm?.latitude ?? 9.0667;
  const lon = farm?.longitude ?? 38.4833;

  const [weather, daily] = await Promise.all([fetchWeather(lat, lon), fetchDailyForecast(lat, lon)]);

  return (
    <div>
      <PageHeader title="Climate" description={`Weather & climate for ${farm?.location ?? "Holeta"}`} />

      <div className="kf-card p-5 mb-5">
        <h2 className="text-sm font-semibold mb-3">Current Conditions</h2>
        {weather ? (
          <div className="flex items-center gap-8 flex-wrap">
            <div className="flex items-center gap-3">
              <CloudSun size={44} className="text-gray-400" strokeWidth={1.5} />
              <div>
                <p className="text-4xl font-semibold leading-none">{Math.round(weather.currentTempC)}°C</p>
                <p className="text-sm text-gray-500 mt-1">{weatherLabel(weather.weatherCode)}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                High {Math.round(weather.highC)}°C &middot; Low {Math.round(weather.lowC)}°C
              </p>
              <p className="flex items-center gap-1.5">
                <Wind size={13} /> {weather.windSpeed} km/h wind
              </p>
              <p className="flex items-center gap-1.5">
                <Droplets size={13} /> {weather.humidity}% humidity, {weather.precipitation}% precip chance
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Weather data unavailable right now.</p>
        )}
      </div>

      <div className="kf-card p-5 mb-5">
        <h2 className="text-sm font-semibold mb-3">Hourly Forecast</h2>
        {weather && weather.hourly.length > 0 ? (
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {weather.hourly.map((h) => (
              <div key={h.time} className="text-center">
                <p className="text-xs text-gray-500">
                  {new Date(h.time).toLocaleTimeString("en-US", { hour: "numeric" })}
                </p>
                <p className="text-lg font-semibold mt-1">{Math.round(h.temperatureC)}°</p>
                <p className="text-xs text-gray-400">{h.precipitationProbability}%</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No hourly data available.</p>
        )}
      </div>

      <div className="kf-card p-5">
        <h2 className="text-sm font-semibold mb-3">7-Day Forecast</h2>
        {daily.length === 0 ? (
          <p className="text-sm text-gray-400">No forecast data available.</p>
        ) : (
          <table className="w-full kf-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Condition</th>
                <th>High</th>
                <th>Low</th>
                <th>Precipitation</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((d) => (
                <tr key={d.date}>
                  <td className="font-medium">
                    {new Date(d.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </td>
                  <td>{weatherLabel(d.code)}</td>
                  <td>{Math.round(d.max)}°C</td>
                  <td>{Math.round(d.min)}°C</td>
                  <td>{d.precipitationSum} mm</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
