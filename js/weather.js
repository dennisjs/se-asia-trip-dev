
function loadWeather() {
  fetch("location.json")
    .then(res => res.json())
    .then(loc => {
      return fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lng}&units=imperial&appid=0f8e3622808ddddedef556c32d470ffa`)
        .then(res => res.json())
        .then(weather => {
          const now = new Date(new Date().getTime() + loc.lng * 4 * 60000);
          const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
          document.getElementById("status-info").textContent =
            `${loc.place} | 🕒 ${timeStr} | ⛅ ${Math.round(weather.main.temp)}°F, ${weather.weather[0].description}`;
        });
    })
    .catch(err => {
      document.getElementById("status-info").textContent = "Weather unavailable";
      console.error("Weather error:", err);
    });
}
