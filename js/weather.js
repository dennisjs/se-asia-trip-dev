
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

function formatForecastCell(day) {
  const icon = day.weather[0].icon;
  const desc = day.weather[0].description;
  const temp = Math.round(day.temp.day);
  const hum = day.humidity;
  return `
    <img src="https://openweathermap.org/img/wn/${icon}@2x.png" class="weather-icon" alt="${desc}" /><br>
    ${temp}°F, ${hum}%<br>
    <span class="forecast-detail">${desc}</span>
  `;
}

async function loadItineraryWeatherTable() {
  const res = await fetch("itinerary.json");
  const itinerary = await res.json();
  const today = new Date();

  const upcoming = itinerary
    .filter(loc => new Date(loc.arrival_date) >= today)
    .slice(0, 4);

  const table = document.getElementById("weatherGridTable");
  table.innerHTML = "";

  const headerRow = document.createElement("tr");
  headerRow.innerHTML = "<th>Location</th>";
  for (let i = 0; i < 7; i++) {
    const future = new Date();
    future.setDate(today.getDate() + i);
    headerRow.innerHTML += "<th>" + future.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + "</th>";
  }
  table.appendChild(headerRow);

  for (const stop of upcoming) {
    const forecast = await getForecast(stop.lat, stop.lng);
    const row = document.createElement("tr");
    row.innerHTML = "<td><strong>" + stop.location + "</strong></td>";
    for (let i = 0; i < 7; i++) {
      const cell = document.createElement("td");
      if (forecast[i]) {
        cell.innerHTML = formatForecastCell(forecast[i]);
      } else {
        cell.textContent = "N/A";
      }
      row.appendChild(cell);
    }
    table.appendChild(row);
  }
}

async function loadCalendarWeatherTable() {
  const res = await fetch("itinerary.json");
  const itinerary = await res.json();

  const today = new Date();
  const itineraryStart = new Date(itinerary[0].arrival_date);
  const lastStop = itinerary[itinerary.length - 1];
  const itineraryEnd = new Date(lastStop.arrival_date);
  itineraryEnd.setDate(itineraryEnd.getDate() + lastStop.nights);

  const forecastDays = 5;
  const table = document.getElementById("calendarGridTable");
  table.innerHTML = "";

  const headerRow = document.createElement("tr");
  headerRow.innerHTML = "<th>Date</th><th>Location</th><th>Forecast</th>";
  table.appendChild(headerRow);

  if (today > itineraryEnd) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="3"><strong>Trip Over — No Forecast Available</strong></td>';
    table.appendChild(row);
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

    const row = document.createElement("tr");
    if (date.toDateString() === today.toDateString()) row.classList.add("today-row");

    const dateCell = "<td>" + date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + "</td>";
    const locCell = "<td>" + (matched ? matched.location : "—") + "</td>";
    let forecastCell = "<td>N/A</td>";

    if (matched) {
      const forecast = await getForecast(matched.lat, matched.lng);
      const offset = Math.floor((date - forecastBaseDate) / (1000 * 60 * 60 * 24));
      if (offset >= 0 && offset < forecast.length && forecast[offset]) {
        forecastCell = "<td>" + formatForecastCell(forecast[offset]) + "</td>";
      }
    }

    row.innerHTML = dateCell + locCell + forecastCell;
    table.appendChild(row);
  }
}
