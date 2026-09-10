"use client";

import { useState } from "react";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudSun } from "lucide-react";

export default function Home() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getWeatherDetails = (code: number) => {
    if (code === 0) return { label: "Clear Sky", icon: <Sun className="w-8 h-8 text-amber-400 mx-auto" /> };
    if (code >= 1 && code <= 3) return { label: "Partly Cloudy", icon: <CloudSun className="w-8 h-8 text-slate-300 mx-auto" /> };
    if (code >= 45 && code <= 48) return { label: "Foggy", icon: <Cloud className="w-8 h-8 text-slate-400 mx-auto" /> };
    if (code >= 51 && code <= 67) return { label: "Rainy", icon: <CloudRain className="w-8 h-8 text-sky-400 mx-auto" /> };
    if (code >= 71 && code <= 77) return { label: "Snowy", icon: <CloudSnow className="w-8 h-8 text-indigo-200 mx-auto" /> };
    if (code >= 80 && code <= 82) return { label: "Showers", icon: <CloudRain className="w-8 h-8 text-sky-400 mx-auto" /> };
    if (code >= 95) return { label: "Thunderstorm", icon: <CloudLightning className="w-8 h-8 text-yellow-400 mx-auto" /> };
    return { label: "Cloudy", icon: <Cloud className="w-8 h-8 text-slate-300 mx-auto" /> };
  };

  const normalizeCityName = (inputName: string) => {
    const nameMap: Record<string, string> = {
      bangalore: "Bengaluru",
      banglore: "Bengaluru",
      calcutta: "Kolkata",
      madras: "Chennai",
      bombay: "Mumbai",
      poona: "Pune",
    };
    const cleanInput = inputName.trim().toLowerCase();
    return nameMap[cleanInput] || inputName.trim();
  };

  const fetchWeather = async () => {
    if (!city.trim()) return;

    setLoading(true);
    setError("");
    setWeather(null);
    setForecast([]);

    const targetCity = normalizeCityName(city);

    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        targetCity
      )}&count=10&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        setError("City not found. Try another!");
        setLoading(false);
        return;
      }

      const indianMatch = geoData.results.find(
        (item: any) =>
          item.country === "India" ||
          item.country_code === "IN" ||
          item.admin1 === "Karnataka"
      );

      const location = indianMatch || geoData.results[0];
      const { latitude, longitude, name, admin1, country } = location;

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
      const weatherRes = await fetch(weatherUrl);
      const weatherData = await weatherRes.json();

      const currentDetails = getWeatherDetails(weatherData.current_weather.weathercode);

      setWeather({
        locationName: `${name}${admin1 ? `, ${admin1}` : ""}${
          country ? `, ${country}` : ""
        }`,
        temp: weatherData.current_weather.temperature,
        windspeed: weatherData.current_weather.windspeed,
        label: currentDetails.label,
        icon: currentDetails.icon,
      });

      if (weatherData.daily) {
        const dailyList = weatherData.daily.time.slice(1, 6).map((dateStr: string, idx: number) => {
          const dayDetails = getWeatherDetails(weatherData.daily.weathercode[idx + 1]);
          return {
            date: new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
            maxTemp: weatherData.daily.temperature_2m_max[idx + 1],
            minTemp: weatherData.daily.temperature_2m_min[idx + 1],
            icon: dayDetails.icon,
          };
        });
        setForecast(dailyList);
      }
    } catch (err) {
      setError("Failed to connect to weather server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-sky-400 mb-2">
        Sushant's Weather App
      </h1>
      <p className="text-slate-400 text-sm mb-6">
        Built with Next.js, React Hooks & Tailwind CSS
      </p>

      <div className="bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Enter city (e.g. Bangalore)..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchWeather()}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-sky-500 transition"
          />
          <button
            onClick={fetchWeather}
            className="bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold px-4 py-2 rounded-lg transition"
          >
            Search
          </button>
        </div>

        {loading && <p className="text-center text-slate-400">Fetching live weather...</p>}
        {error && <p className="text-center text-rose-400 font-medium">{error}</p>}

        {weather && (
          <div className="text-center mt-4">
            <h2 className="text-xl font-semibold text-slate-200">{weather.locationName}</h2>
            <div className="my-3 flex items-center justify-center gap-2">
              {weather.icon}
              <span className="text-slate-300 font-medium">{weather.label}</span>
            </div>
            <div className="text-6xl font-extrabold text-sky-400 my-2">{weather.temp}°C</div>
            <p className="text-slate-400 text-sm mb-6">Wind Speed: {weather.windspeed} km/h</p>

            {forecast.length > 0 && (
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 text-left">5-Day Forecast</h3>
                <div className="grid grid-cols-5 gap-2">
                  {forecast.map((day, i) => (
                    <div key={i} className="bg-slate-900 p-2 rounded-lg text-center border border-slate-700/50 flex flex-col justify-between items-center min-h-[110px]">
                      <p className="text-[10px] text-slate-400 font-medium">{day.date}</p>
                      <div className="my-1 scale-75">{day.icon}</div>
                      <div>
                        <p className="text-sm font-bold text-sky-400">{day.maxTemp}°</p>
                        <p className="text-[11px] text-slate-500">{day.minTemp}°</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}