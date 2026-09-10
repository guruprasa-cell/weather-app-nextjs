"use client";

import { useState } from "react";

export default function Home() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWeather = async () => {
    if (!city.trim()) return;

    setLoading(true);
    setError("");
    setWeather(null);

    try {
      // 1. Fetch location candidates
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        setError("City not found. Try another!");
        setLoading(false);
        return;
      }

      // Prioritize Indian cities if available, or fall back to the highest population/first result
      const indianMatch = geoData.results.find(
        (item: any) => item.country === "India" || item.country_code === "IN"
      );

      const location = indianMatch || geoData.results[0];
      const { latitude, longitude, name, admin1, country } = location;

      // 2. Fetch live weather conditions
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
      const weatherRes = await fetch(weatherUrl);
      const weatherData = await weatherRes.json();

      setWeather({
        locationName: `${name}${admin1 ? `, ${admin1}` : ""}${country ? `, ${country}` : ""}`,
        temp: weatherData.current_weather.temperature,
        windspeed: weatherData.current_weather.windspeed,
      });
    } catch (err) {
      setError("Failed to connect to weather server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-sky-400 mb-2">
        Guruprasad's Weather App
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
            <div className="text-6xl font-extrabold text-sky-400 my-4">{weather.temp}°C</div>
            <p className="text-slate-400 text-sm">Wind Speed: {weather.windspeed} km/h</p>
          </div>
        )}
      </div>
    </main>
  );
}