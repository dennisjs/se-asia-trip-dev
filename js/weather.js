function updateWeatherBox(lat, lng, place) {
  const box = document.getElementById("location-box");
  if (!box) return;

  box.innerHTML = `<strong>My Current Location:</strong><br>${place}<br>Loading weather...`;

  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=imperial&appid=${window.CONFIG.OPENWEATHER_KEY}`)
    .then(res => res.json())
    .then(weather => {
      const weatherStr = `${Math.round(weather.main.temp)}°F, ${weather.weather[0].description}`;
      box.innerHTML = `<strong>My Current Location:</strong><br>${place}<br>⛅ ${weatherStr}`;
    })
    .catch(err => {
      console.error("Weather info error:", err);
      box.innerHTML = `<strong>My Current Location:</strong><br>${place}<br>Weather unavailable`;
    });
}
