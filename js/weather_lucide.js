async function debugCheckItinerary() {
  const debugBox = document.getElementById("weather-debug");

  try {
    const res = await fetch("itinerary.json");
    const data = await res.json();
    debugBox.textContent += ` | 🧭 itinerary.json: ${data.length} stops`;
  } catch (err) {
    debugBox.textContent += ` | ❌ itinerary.json error: ${err.message}`;
  }
}


async function debugFetchWeather() {
  const debugBox = document.getElementById("weather-debug");
  debugBox.textContent = "🔍 Started debugFetchWeather";

  const API_KEY = window.CONFIG?.OPENWEATHER_KEY;
  if (!API_KEY) {
    debugBox.textContent = "❌ Missing API key.";
    return;
  }

  debugBox.textContent += " | API key loaded.";

  const lat = 13.7563;
  const lon = 100.5018;

  try {
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=imperial&appid=${API_KEY}`;
    debugBox.textContent += " | Fetching...";

    const response = await fetch(url);
    debugBox.textContent += ` | Status: ${response.status}`;

    const data = await response.json();
    debugBox.textContent += ` | Fetched`;

    const today = data.daily?.[0];
    if (!today) {
      debugBox.textContent += " | ❌ No daily data.";
      return;
    }

    const temp = Math.round(today.temp.day);
    const desc = today.weather[0].description;
    debugBox.textContent += ` | ✅ ${temp}°F – ${desc}`;
  } catch (err) {
    debugBox.textContent += ` | ❌ Fetch error: ${err.message}`;
  }
}


async function updateWeatherBox(lat, lon, locationName, weatherBox) {
  const apiKey = window.CONFIG?.OPENWEATHER_KEY;
  if (!apiKey) {
    console.error("Missing OpenWeatherMap API key in config.js");
    return;
  }

  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=imperial&appid=${window.CONFIG.OPENWEATHER_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const today = data.daily[0];

    if (!today) {
      console.warn("No daily forecast returned");
      return;
    }

    const temp = Math.round(today.temp.day);
    const desc = today.weather[0].description;
    const iconCode = today.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    if (!weatherBox) {
      console.warn("weatherBox is undefined");
      return;
    }
    weatherBox.innerHTML = `
      <strong>My Current Location:</strong><br>
      ${locationName}<br>
      ${temp}°F – ${desc}<br>
    `;

  } catch (err) {
    console.error("Weather fetch failed:", err);
  }
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

function getLucideIcon(desc) {
  const lower = desc.toLowerCase();
  if (lower.includes("clear")) return "sun";
  if (lower.includes("cloud")) return "cloud";
  if (lower.includes("rain")) return "cloud-rain";
  if (lower.includes("thunder")) return "cloud-lightning";
  if (lower.includes("snow")) return "cloud-snow";
  if (lower.includes("fog") || lower.includes("mist") || lower.includes("haze")) return "cloud-fog";
  return "cloud";
}

function formatForecastCell(day) {
  const desc = day.weather[0].description;
  const icon = getLucideIcon(desc);
  const temp = Math.round(day.temp.day);
  const hum = day.humidity;
  return `
    <i data-lucide="${icon}" class="icon-${icon}"></i><br>
    ${temp}°F, ${hum}%<br>
    <span class="forecast-detail">${desc}</span>
  `;
}

async function loadItineraryWeatherTable() {
  const debugBox = document.getElementById("weather-debug");
  if (debugBox) debugBox.textContent += " | 🔄 Table start";

  let itinerary;
  try {
    const res = await fetch("itinerary.json");
    itinerary = await res.json();
    debugBox.textContent += ` | 📅 ${itinerary.length} loaded`;
  } catch (e) {
    debugBox.textContent += ` | ❌ itinerary fetch failed: ${e.message}`;
    return;
  }

  const stripTime = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = stripTime(new Date());
  const upcoming = itinerary.filter(loc => {
    const arrival = stripTime(new Date(loc.arrival_date));
    return arrival >= today;
  }).slice(0, 4);
  debugBox.textContent += ` | 📆 ${upcoming.length} upcoming`;

  const table = document.getElementById("weatherGridTable");
  if (!table) {
    debugBox.textContent += " | ❌ No table element";
    return;
  }

  table.innerHTML = "";
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = "<th>Location</th>";
  for (let i = 0; i < 7; i++) {
    const future = new Date();
    future.setDate(today.getDate() + i);
    headerRow.innerHTML += `<th>${future.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</th>`;
  }
  table.appendChild(headerRow);
  debugBox.textContent += " | 🧱 Header built";

  for (const stop of upcoming) {
    debugBox.textContent += ` | ☁️ Fetching for ${stop.location}`;
    const forecast = await getForecast(stop.lat, stop.lng);
    const row = document.createElement("tr");
    row.innerHTML = `<td><strong>${stop.location}</strong></td>`;

    for (let i = 0; i < 7; i++) {
      const cell = document.createElement("td");
      cell.innerHTML = forecast[i] ? formatForecastCell(forecast[i]) : "N/A";
      row.appendChild(cell);
    }
    table.appendChild(row);
  }

  debugBox.textContent += " | ✅ Table complete";
}


async function loadGroupedCalendarForecast() {
  const res = await fetch("itinerary.json");
  const itinerary = await res.json();

  const stripTime = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = stripTime(new Date());
  const itineraryStart = stripTime(new Date(itinerary[0].arrival_date));
  const lastStop = itinerary[itinerary.length - 1];
  const itineraryEnd = new Date(lastStop.arrival_date);
  itineraryEnd.setDate(itineraryEnd.getDate() + lastStop.nights);

  const forecastDays = 5;
  const gridContainer = document.getElementById("calendarGridGrouped");
  gridContainer.innerHTML = "";

  if (today > itineraryEnd) {
    const msg = document.createElement("div");
    msg.className = "location-name";
    msg.textContent = "Trip Over — No Forecast Available";
    gridContainer.appendChild(msg);
    lucide.createIcons({
      attrs: (iconNode) => {
        const iconName = iconNode.getAttribute("data-lucide");
        return { class: `lucide lucide-icon icon-${iconName}`,
                 stroke: "currentColor"
        };
      }
    });
    return;
  }

  const forecastBaseDate = today < itineraryStart ? itineraryStart : today;
  const groupedForecasts = {};

  for (let i = 0; i < forecastDays; i++) {
    const date = new Date(forecastBaseDate);
    date.setDate(forecastBaseDate.getDate() + i);

    const matched = itinerary.find(loc => {
      const arrival = new Date(loc.arrival_date);
      const departure = new Date(arrival);
      departure.setDate(arrival.getDate() + loc.nights);
      return date >= arrival && date < departure;
    });

    if (!matched) continue;

    const loc = matched.location;
    if (!groupedForecasts[loc]) groupedForecasts[loc] = [];

    const forecast = await getForecast(matched.lat, matched.lng);
    const offset = Math.floor((date - forecastBaseDate) / (1000 * 60 * 60 * 24));
    let weatherHTML = "N/A";

    if (offset >= 0 && offset < forecast.length && forecast[offset]) {
      weatherHTML = formatForecastCell(forecast[offset]);
    }

    groupedForecasts[loc].push({
      date: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      weather: weatherHTML
    });
  }

  for (const [location, entries] of Object.entries(groupedForecasts)) {
    const box = document.createElement("div");
    box.className = "calendar-location-box";

    const title = document.createElement("div");
    title.className = "calendar-location-title";
    title.textContent = location;
    box.appendChild(title);

    const table = document.createElement("table");
    table.className = "calendar-location-table";

    const header = document.createElement("tr");
    header.innerHTML = "<th>Date</th><th>Forecast</th>";
    table.appendChild(header);

    entries.forEach(entry => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${entry.date}</td><td>${entry.weather}</td>`;
      table.appendChild(row);
    });

    box.appendChild(table);
    gridContainer.appendChild(box);
  }

  lucide.createIcons({
    attrs: (iconNode) => {
      const iconName = iconNode.getAttribute("data-lucide");
      return { class: `lucide lucide-icon icon-${iconName}` };
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const debugBox = document.getElementById("weather-debug");
  if (debugBox) debugBox.textContent += " | 🧩 DOM ready";

  try {
    await debugFetchWeather();                  // optional
    await debugCheckItinerary();                // confirms itinerary loads
    await loadItineraryWeatherTable();          // 7-day table
    await loadGroupedCalendarForecast();        // 5-day calendar
  } catch (err) {
    if (debugBox) debugBox.textContent += ` | ❌ JS error: ${err.message}`;
  }
});

