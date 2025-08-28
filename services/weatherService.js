import fetch from "node-fetch";

export async function getWeather(loc) {
  const apiKey = process.env.WEATHER_API_KEY;
  const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(loc)}&aqi=no`;

  const r = await fetch(url);
  const data = await r.json();

  if (data.error) return `Weather data not found for ${loc}`;
  return `${data.location.name}: ${data.current.temp_c}°C, ${data.current.condition.text}`;
}
