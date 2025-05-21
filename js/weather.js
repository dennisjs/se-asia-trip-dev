function updateWeatherBox(lat, lng, place) {
  const box = document.getElementById("location-box");
  if (!box) return;

  box.innerHTML = `<strong>My Current Location:</strong><br>${place}<br>Loading weather...`;

  fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&units=imperial&appid=${window.CONFIG.OPENWEATHER_KEY}`)
    .then(res => res.json())
    .then(weather => {
      //console.log("weather string:", weather);
      //console.log("temp: ", weather.current.weather);
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
  //console.log("Using OpenWeather API key:", API_KEY);
  if (!API_KEY) {
    console.error("Missing OpenWeatherMap API key in config.js");
    return [];
  }
  //const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,alerts&units=imperial&appid=0f8e3622808ddddedef556c32d470ffa`;
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,alerts&units=imperial&appid=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  //console.log("weather data:", data);
  return data.daily.slice(0, 7);
}

async function loadItineraryWeather() {
  const res = await fetch("itinerary.json");
  const itinerary = await res.json();
  const today = new Date();

  // Get next 4 itinerary locations starting today or later
  const upcoming = itinerary
    .filter(loc => new Date(loc.arrival_date) >= today)
    .slice(0, 4);

  const grid = document.getElementById("weatherGrid");
  grid.innerHTML = "";

  // --- HEADER ROW ---
  grid.appendChild(createCell("Location / Date", "location-name"));
  for (let i = 0; i < 7; i++) {
    const future = new Date(today);
    future.setDate(today.getDate() + i);
    grid.appendChild(createCell(future.toLocaleDateString()));
  }

  // --- EACH LOCATION ROW ---
  for (const stop of upcoming) {
    const rowLabel = createCell(stop.location, "location-name");
    grid.appendChild(rowLabel);

    // Fetch forecast
    const forecast = await getForecast(stop.lat, stop.lng);
    for (let i = 0; i < 7; i++) {
      const day = forecast[i];
      if (!day) {
        grid.appendChild(createCell("N/A"));
        continue;
      }

      const icon = day.weather[0].icon;
      //const desc = day.weather[0].description;
      const desc = day.summary;
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

  // Use trip start if we're still before the trip
  const startDate = today < itineraryStart ? itineraryStart : today;

  // Header
  calendarDiv.appendChild(createCell("Date", "location-name"));
  calendarDiv.appendChild(createCell("Location", "location-name"));
  calendarDiv.appendChild(createCell("Forecast", "location-name"));

  for (let i = 0; i < forecastDays; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    // Match itinerary location
    const matched = itinerary.find(loc => {
      const arrival = new Date(loc.arrival_date);
      const departure = new Date(arrival);
      departure.setDate(arrival.getDate() + loc.nights);
      return date >= arrival && date < departure;
    });

    const rowDate = createCell(date.toLocaleDateString());
    const rowLoc = createCell(matched ? matched.location : "—");
    const rowWeather = document.createElement("div");

    calendarDiv.appendChild(rowDate);
    calendarDiv.appendChild(rowLoc);
    calendarDiv.appendChild(rowWeather);

    if (!matched) {
      rowWeather.textContent = "N/A";
      continue;
    }

    const forecast = await getForecast(matched.lat, matched.lng);

    // Align forecast data to today’s date range
    const forecastBaseDate = today < itineraryStart ? itineraryStart : today;
    const offset = Math.floor((date - forecastBaseDate) / (1000 * 60 * 60 * 24));

    if (offset < 0 || offset > 6) {
      console.log("offset out of bounds: ", offset);
      rowWeather.textContent = "N/A";
      continue;
    }

    const day = forecast[offset];
    if (!day) {
      console.log("day out of bounds: ", day);
      rowWeather.textContent = "N/A";
      continue;
    }

    const icon = day.weather[0].icon;
    const desc = day.weather[0].description;
    const temp = Math.round(day.temp.day);
    const hum = day.humidity;

    rowWeather.innerHTML = `
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" class="weather-icon" alt="${desc}" />
      <br>${temp}°F, ${hum}%
      <br><small>${desc}</small>`;
  }
}



function createCell(content, className = "") {
  const div = document.createElement("div");
  div.innerHTML = content;
  if (className) div.className = className;
  return div;
}

