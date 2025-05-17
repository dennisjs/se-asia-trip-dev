
mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';

async function fetchLatestLocation() {
  try {
    const res = await fetch("location.json");
    const locations = await res.json();
    if (!Array.isArray(locations) || locations.length === 0) return null;

    locations.sort((a, b) => {
      const da = new Date(a.arrival_date);
      const db = new Date(b.arrival_date);
      return db - da;
    });

    return locations[0]; // Most recent
  } catch (e) {
    console.error("Location fetch error:", e);
    return null;
  }
}

async function initMap() {
  const location = await fetchLatestLocation();
  if (!location) return;

  const { lat, lng, place } = location;

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [lng, lat],
    zoom: 12
  });

  new mapboxgl.Marker({ color: 'red' })
    .setLngLat([lng, lat])
    .setPopup(new mapboxgl.Popup().setText(`My Current Location: ${place}`))
    .addTo(map);

  document.getElementById("location-box").innerHTML = `
    <strong>My Current Location:</strong><br>
    ${place}
  `;

  fetchWeather(lat, lng);
}

async function fetchWeather(lat, lng) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=imperial&appid=YOUR_OPENWEATHER_API_KEY`;
    const res = await fetch(url);
    const data = await res.json();
    const weather = `${Math.round(data.main.temp)}°F, ${data.weather[0].description}`;
    document.getElementById("location-box").innerHTML += `<br>${weather}`;
  } catch (e) {
    console.error("Weather fetch error:", e);
  }
}

initMap();
