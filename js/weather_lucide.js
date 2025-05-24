
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
  const debugBox = document.getElementById("weather-debug");
  debugBox.textContent += ` | 🌍 Fetching forecast for (${lat}, ${lon})`;

  const API_KEY = window.CONFIG?.OPENWEATHER_KEY;
  if (!API_KEY) {
    debugBox.textContent += " | ❌ Missing API key in getForecast";
    return [];
  }

  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,alerts&units=imperial&appid=${API_KEY}`;

  try {
    const response = await fetch(url);
    debugBox.textContent += ` | ↩️ ${response.status}`;
    const data = await response.json();
    if (!data.daily || !Array.isArray(data.daily)) {
      debugBox.textContent += " | ❌ Malformed daily data";
      return [];
    }
    debugBox.textContent += ` | ✅ ${data.daily.length} days`;
    return data.daily.slice(0, 7);
  } catch (err) {
    debugBox.textContent += ` | ❌ getForecast error: ${err.message}`;
    return [];
  }
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

  const toUTCDateOnly = d => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const today = toUTCDateOnly(new Date());
  if (debugBox) debugBox.textContent += ` | Today: ${today.toISOString().slice(0, 10)}`;

  const upcoming = itinerary.filter(loc => {
    const [mm, dd, yyyy] = loc.arrival_date.split("-").map(Number);
    const arrival = new Date(Date.UTC(yyyy, mm - 1, dd));
    const isUpcoming = arrival >= today;
    if (debugBox) debugBox.textContent += ` | ${loc.location}: arrival=${arrival.toISOString().slice(0,10)} → ${isUpcoming ? "✅" : "❌"}`;
    return isUpcoming;
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

  const toUTCDateOnly = d => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const today = toUTCDateOnly(new Date());
  const [mm0, dd0, yyyy0] = itinerary[0].arrival_date.split("-").map(Number);
  const itineraryStart = new Date(Date.UTC(yyyy0, mm0 - 1, dd0));
  const lastStop = itinerary[itinerary.length - 1];
  const [mmEnd, ddEnd, yyyyEnd] = lastStop.arrival_date.split("-").map(Number);
  const itineraryEnd = new Date(Date.UTC(yyyyEnd, mmEnd - 1, ddEnd));
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
      const [mm, dd, yyyy] = loc.arrival_date.split("-").map(Number);
      const arrival = new Date(Date.UTC(yyyy, mm - 1, dd));
      const departure = new Date(Date.UTC(yyyy, mm - 1, dd));
      departure.setUTCDate(departure.getUTCDate() + loc.nights);
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
  try {
    await loadItineraryWeatherTable();          // 7-day table
    await loadGroupedCalendarForecast();        // 5-day calendar
  } 
});

