
function loadWeather() {
  fetch("location.json")
    .then(res => res.json())
    .then(loc => {
      return fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lng}&units=imperial&appid=0f8e3622808ddddedef556c32d470ffa`)
        .then(res => res.json())
        .then(weather => {
          const now = new Date(new Date().getTime() + loc.lng * 4 * 60000);
          const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
          const box = document.createElement("div");
          box.className = "location-box";
          box.innerHTML = `
            <strong>My Current Location:</strong>
            ${loc.place}<br>
            🕒 ${timeStr}<br>
            ⛅ ${Math.round(weather.main.temp)}°F, ${weather.weather[0].description}
          `;
          document.getElementById("map-section").appendChild(box);
        });
    })
    .catch(err => {
      console.error("Weather info error:", err);
    });
}
