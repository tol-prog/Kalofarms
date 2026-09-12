export type WeatherHourly = {
  time: string;
  temperatureC: number;
  weatherCode: number;
  windSpeed: number;
  precipitationProbability: number;
  humidity: number;
};

export type WeatherSnapshot = {
  currentTempC: number;
  weatherCode: number;
  highC: number;
  lowC: number;
  windSpeed: number;
  humidity: number;
  precipitation: number;
  sunset: string | null;
  hourly: WeatherHourly[];
};

// WMO weather codes -> short label (subset covering common Ethiopian highland conditions)
const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast Clouds",
  45: "Fog",
  48: "Depositing Rime Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Dense Drizzle",
  61: "Slight Rain",
  63: "Rain",
  65: "Heavy Rain",
  71: "Slight Snow",
  73: "Snow",
  75: "Heavy Snow",
  80: "Rain Showers",
  81: "Rain Showers",
  82: "Violent Rain Showers",
  95: "Thunderstorm",
  96: "Thunderstorm w/ Hail",
  99: "Thunderstorm w/ Hail",
};

export function weatherLabel(code: number): string {
  return WEATHER_CODE_LABELS[code] ?? "Unknown";
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherSnapshot | null> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set(
      "hourly",
      "temperature_2m,weathercode,windspeed_10m,precipitation_probability,relativehumidity_2m"
    );
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,sunset");
    url.searchParams.set("current_weather", "true");
    url.searchParams.set("timezone", "auto");

    const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = await res.json();

    const hourly: WeatherHourly[] = (data.hourly?.time ?? [])
      .map((t: string, i: number) => ({
        time: t,
        temperatureC: data.hourly.temperature_2m[i],
        weatherCode: data.hourly.weathercode[i],
        windSpeed: data.hourly.windspeed_10m[i],
        precipitationProbability: data.hourly.precipitation_probability?.[i] ?? 0,
        humidity: data.hourly.relativehumidity_2m?.[i] ?? 0,
      }))
      .filter((h: WeatherHourly) => new Date(h.time).getTime() >= Date.now() - 3600_000)
      .slice(0, 8);

    return {
      currentTempC: data.current_weather?.temperature ?? 0,
      weatherCode: data.current_weather?.weathercode ?? 0,
      highC: data.daily?.temperature_2m_max?.[0] ?? 0,
      lowC: data.daily?.temperature_2m_min?.[0] ?? 0,
      windSpeed: data.current_weather?.windspeed ?? 0,
      humidity: hourly[0]?.humidity ?? 0,
      precipitation: hourly[0]?.precipitationProbability ?? 0,
      sunset: data.daily?.sunset?.[0] ?? null,
      hourly,
    };
  } catch {
    return null;
  }
}
