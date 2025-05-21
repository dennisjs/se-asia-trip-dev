
function updateWeatherBox(lat, lng, place) {
  const box = document.getElementById("location-box");
  if (!box) return;

  box.innerHTML = `<strong>My Current Location:</strong><br>${place}<br>Loading weather...`;

  fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&units=imperial&appid=${window.CONFIG.OPENWEATHER_KEY}`)
    .then(res => res.json())
    .then(weather => {
      const weatherStr = `${Math.round(weather.current.temp)}°F, ${weather.current.weather[0].description}`;
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
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,alerts&units=imperial&appid=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.daily.slice(0, 7);
}

async function loadItineraryWeather() {
  const res = await fetch("itinerary.json");
  const itinerary = await res.json();
  const today = new Date();

  const upcoming = itinerary
    .filter(loc => new Date(loc.arrival_date) >= today)
    .slice(0, 4);

  const grid = document.getElementById("weatherGrid");
  grid.innerHTML = "";

  grid.appendChild(createCell("Location / Date", "location-name"));
  for (let i = 0; i < 7; i++) {
    const future = new Date(today);
    future.setDate(today.getDate() + i);
    grid.appendChild(createCell(future.toLocaleDateString()));
  }

  for (const stop of upcoming) {
    const rowLabel = createCell(stop.location, "location-name");
    grid.appendChild(rowLabel);

    const forecast = await getForecast(stop.lat, stop.lng);
    for (let i = 0; i < 7; i++) {
      const day = forecast[i];
      if (!day) {
        grid.appendChild(createCell("N/A"));
        continue;
      }

      const icon = day.weather[0].icon;
      const desc = day.weather[0].description;
      const temp = Math.round(day.temp.day);
      const hum = day.humidity;
      const html = `<img src="https://openweathermap.org/img/wn/${icon}@2x.png" class="weather-icon" alt="${desc}" /><br>${temp}°F, ${hum}%<br><small>${desc}</small>`;
      grid.appendChild(createCell(html));
    }
  }
}


async function loadCalendarWeather() {
  const res = await fetch("itinerary.json");
  const itinerary = await res.json();

  const today = new Date();
  const itineraryStart = new Date(itinerary[0].arrival_date);
  const lastStop = itinerary[itinerary.length - 1];
  const itineraryEnd = new Date(lastStop.arrival_date);
  itineraryEnd.setDate(itineraryEnd.getDate() + lastStop.nights);

  const forecastDays = 5;
  const calendarDiv = document.getElementById("calendarGrid");
  calendarDiv.innerHTML = "";

  // Handle trip-over case
  if (today > itineraryEnd) {
    const msg = document.createElement("div");
    msg.className = "location-name";
    msg.style.gridColumn = "1 / -1";
    msg.textContent = "Trip Over — No Forecast Available";
    calendarDiv.appendChild(msg);
    return;
  }

  const forecastBaseDate = today < itineraryStart ? itineraryStart : today;

  for (let i = 0; i < forecastDays; i++) {
    const date = new Date(forecastBaseDate);
    date.setDate(forecastBaseDate.getDate() + i);

    const matched = itinerary.find(loc => {
      const arrival = new Date(loc.arrival_date);
      const departure = new Date(arrival);
      departure.setDate(arrival.getDate() + loc.nights);
      return date >= arrival && date < departure;
    });

    const card = document.createElement("div");
    card.className = "forecast-card";

    //const dateEl = `<div class="forecast-date">${date.toLocaleDateString()}</div>`;
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateEl = `<div class="forecast-date">${weekday}, ${date.toLocaleDateString()}</div>`;
    const locEl = `<div class="forecast-location">${matched ? matched.location : "—"}</div>`;
    let forecastHTML = `<div>N/A</div>`;

    if (matched) {
      const forecast = await getForecast(matched.lat, matched.lng);
      const offset = Math.floor((date - forecastBaseDate) / (1000 * 60 * 60 * 24));

      if (offset >= 0 && offset < forecast.length) {
        const day = forecast[offset];
        if (day) {
          const icon = day.weather[0].icon;
          const desc = day.weather[0].description;
          const temp = Math.round(day.temp.day);
          const hum = day.humidity;

          forecastHTML = `
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" class="weather-icon" alt="${desc}" />
            <div>${temp}°F, ${hum}%</div>
            <small>${desc}</small>
          `;
        }
      }
    }

    card.innerHTML = `${dateEl}${locEl}${forecastHTML}`;
    calendarDiv.appendChild(card);
  }
}


function createCell(content, className = "") {
  const div = document.createElement("div");
  div.innerHTML = content;
  if (className) div.className = className;
  return div;
}
