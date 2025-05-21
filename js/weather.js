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

async function getForecast(lat, lon) {
  const API_KEY = window.CONFIG?.OPENWEATHER_KEY;
  if (!API_KEY) {
    console.error("Missing OpenWeatherMap API key in config.js");
    return [];
  }
  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,alerts&units=imperial&appid=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.daily.slice(0, 7);
}

async function loadItineraryWeather() {
  const res = await fetch("itinerary.json");
  const itinerary = await res.json();
  const today = new Date();

  const upcoming = itinerary.filter(loc => {
    const arrival = new Date(loc.arrival_date);
    return arrival >= today;
  }).slice(0, 4);

  const grid = document.getElementById("weatherGrid");

  const headerRow = document.createElement("div");
  headerRow.className = "location-name";
  headerRow.textContent = "Location / Date";
  grid.appendChild(headerRow);

  for (let i = 0; i < 7; i++) {
    const cell = document.createElement("div");
    const future = new Date();
    future.setDate(today.getDate() + i);
    cell.innerHTML = future.toLocaleDateString();
    grid.appendChild(cell);
  }

  for (const stop of upcoming) {
    const locCell = document.createElement("div");
    locCell.className = "location-name";
    locCell.textContent = stop.location;
    grid.appendChild(locCell);

    const forecast = await getForecast(stop.lat, stop.lng);
    forecast.forEach(day => {
      const div = document.createElement("div");
      const icon = day.weather[0].icon;
      const desc = day.weather[0].description;
      const temp = Math.round(day.temp.day);
      div.innerHTML = `<img src="https://openweathermap.org/img/wn/${icon}@2x.png" class="weather-icon" alt="${desc}" /><br>${temp}°F<br><small>${desc}</small>`;
      grid.appendChild(div);
    });
  }
}
