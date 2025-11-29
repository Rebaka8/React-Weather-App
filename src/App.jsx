import React, { useState } from 'react';
import './index.css';

const weatherBackgrounds = {
  Clear: 'https://media1.tenor.com/m/FGENNXlTSZkAAAAd/aesthetic-nature.gif',
  Clouds: 'https://media1.tenor.com/m/kKrPCty2eogAAAAd/anime-bird-art.gif',
  Rain: 'https://media1.tenor.com/m/TUN36wlxyhMAAAAC/aesthetic-raining.gif',
  cloudy:'https://media.tenor.com/m/WhD4AWN30YkAAAAM/clouds-moving.gif',
  'Partly cloudy':'https://media1.tenor.com/m/pjzL4LNhIpEAAAAd/clouds-nature.gif',
  Snow: 'https://media1.tenor.com/m/jgyzLqeM3S4AAAAC/whenu.gif',
  Overcast :'https://media1.tenor.com/m/f14xUacYc1oAAAAd/storm-world-meteorological-day.gif',
  Sunny: 'https://media1.tenor.com/m/WMmF-dfb2ZsAAAAd/ngan-pham-kitten.gif',
  Thunderstorm: 'https://media1.tenor.com/m/4kHp8IZiBu8AAAAC/dragon-ball-cinematography.gif',
  Mist: 'https://media1.tenor.com/m/Gwv12BigCYcAAAAC/foggy-fog.gif',
  Default: 'https://media1.tenor.com/m/K0hea_K-qfYAAAAC/rain-nature.gif'
};

function App() {
  const [location, setLocation] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWeather = async () => {
  setLoading(true);
  setError('');
  try {
    const key = import.meta.env.VITE_WEATHER_API_KEY;  // API key from .env
    const query = encodeURIComponent((location || '').trim());
    const url = `https://api.weatherapi.com/v1/current.json?key=${key}&q=${query}&aqi=yes`;
    const response = await fetch(url);
    if (!response.ok) {
      // Try to read body to get API-provided error message
      let bodyText = await response.text();
      try {
        const parsed = JSON.parse(bodyText);
        bodyText = parsed.error?.message || bodyText;
      } catch (e) {
        // not JSON, keep bodyText as-is
      }
      console.error('Weather API returned error', response.status, bodyText);
      throw new Error(bodyText || `Request failed (${response.status})`);
    }
    const data = await response.json();
    // Log both object and stringified versions so the console shows exact payload
    console.log("Weather API Response:", data);
    try {
      console.log("Weather API Response (stringified):", JSON.stringify(data, null, 2));
    } catch (e) {
      console.log("Could not stringify full response", e);
    }
    // Also explicitly log the air_quality sub-object
    console.log("air_quality:", data.current?.air_quality);
    try {
      console.log("air_quality (stringified):", JSON.stringify(data.current?.air_quality ?? null, null, 2));
    } catch (e) {
      console.log("Could not stringify air_quality", e);
    }

    setWeatherData(data);
  } catch (err) {
    // Provide more informative message in UI so user knows whether key/plan/location is the issue
    setError(err.message || 'Location not found');
    setWeatherData(null);
  }
  setLoading(false);
};

  
const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

  // Get background image by weather condition (robust matching)
  const weatherCondition = weatherData?.current?.condition?.text || '';
  const weatherMain = weatherData?.current?.condition?.code;

  const getBgKey = (conditionText) => {
    if (!conditionText) return 'Default';
    const lowered = conditionText.toLowerCase();
    // 1) Try exact match (case-insensitive)
    const exact = Object.keys(weatherBackgrounds).find(k => k.toLowerCase() === lowered);
    if (exact) return exact;
    // 2) Prefer the longest matching key so 'Partly cloudy' wins over 'cloudy'
    const sorted = Object.keys(weatherBackgrounds).sort((a, b) => b.length - a.length);
    const found = sorted.find(k => lowered.includes(k.toLowerCase()));
    return found || 'Default';
  };

  const bgKey = getBgKey(weatherCondition);
  const backgroundImage = weatherBackgrounds[bgKey] || weatherBackgrounds['Default'];

  return (
  <div
    className="app"
    style={{
      backgroundImage: `url(${backgroundImage})`,
    }}
  >
    <div className="container">
      <h1 className="title">Weather App</h1>
      <input
      id="location"
      name="location"
        type="text"
        placeholder="Enter Location"
        value={location}
        onChange={e => setLocation(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') fetchWeather();
        }}
        className="input"
      />
      <button className="btn" onClick={fetchWeather} disabled={loading || !location}>
        {loading ? 'Loading...' : 'Get Weather'}
      </button>
      {error && <p className="error">{error}</p>}
      {weatherData && (
        <div className="weather-info">
          <h2>{weatherData.location.name}, {weatherData.location.country}</h2>
          <p>{weatherData.current.condition.text}</p>
          <img src={weatherData.current.condition.icon} alt="weather icon" />
          <p>Temperature: {weatherData.current.temp_c}°C</p>
          <p>Humidity: {weatherData.current.humidity}%</p>
          {
            (() => {
              const aq = weatherData.current.air_quality;
              if (!aq) return <p>Air Quality Index: N/A</p>;
              const index = aq['us-epa-index'] ?? aq['gb-defra-index'] ?? null;
              const safeNumber = (v) => {
                if (v == null) return null;
                const n = Number(v);
                return Number.isFinite(n) ? n : null;
              };
              const pm25 = safeNumber(aq.pm2_5);
              const pm10 = safeNumber(aq.pm10);
              return (
                <>
                  <p>Air Quality Index: {index ?? 'N/A'}</p>
                  <p>PM2.5: {pm25 != null ? pm25.toFixed(2) : 'N/A'}</p>
                  <p>PM10: {pm10 != null ? pm10.toFixed(2) : 'N/A'}</p>
                  <p style={{fontSize: '0.95rem', marginTop: 8}}>Air quality data present: {aq ? 'Yes' : 'No'}</p>
                  {aq && (
                    <p style={{fontSize: '0.85rem', opacity: 0.9}}>Keys: {Object.keys(aq).join(', ')}</p>
                  )}
                  <details style={{textAlign: 'left', marginTop: 8}}>
                    <summary style={{cursor: 'pointer'}}>Raw air_quality (debug)</summary>
                    <pre style={{whiteSpace: 'pre-wrap', color: '#fff'}}>{JSON.stringify(aq, null, 2)}</pre>
                  </details>
                </>
              );
            })()
          }

          {/* Always-visible debug block for air_quality so it's easy to copy */}
          <div style={{marginTop: 12, width: '100%'}}>
            <div style={{fontSize: '0.9rem', marginBottom: 6}}>air_quality (raw):</div>
            <pre className="aqi-debug">{JSON.stringify(weatherData.current.air_quality ?? 'No data', null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  </div>
);

}

export default App;
