
mapboxgl.accessToken = window.CONFIG.MAPBOX_TOKEN;

async function fetchLatestLocation() {
  try {
    const res = await fetch("location.json");
    const locations = await res.json();
    if (!Array.isArray(locations) || locations.length === 0) return null;

    locations.sort((a, b) => new Date(b.arrival_date) - new Date(a.arrival_date));
    return locations[0];
  } catch (e) {
    console.error("Location fetch error:", e);
    return null;
  }
}

function initMapWithPhotos() {
  fetchLatestLocation().then(loc => {
    if (!loc) return;

    const { lat, lng, place } = loc;

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 12
    });

    const marker = new mapboxgl.Marker({ color: "red" })
      .setLngLat([lng, lat])
      .addTo(map);

    const popup = new mapboxgl.Popup({ offset: 25 })
      .setLngLat([lng, lat])
      .setHTML(`<strong>My Current Location:</strong><br>${place}<br>Loading weather...`)
      .addTo(map);

    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=imperial&appid=${window.CONFIG.OPENWEATHER_KEY}`)
      .then(res => res.json())
      .then(weather => {
        const weatherStr = `${Math.round(weather.main.temp)}°F, ${weather.weather[0].description}`;
        popup.setHTML(`<strong>My Current Location:</strong><br>${place}<br>⛅ ${weatherStr}`);
      })
      .catch(err => {
        popup.setHTML(`<strong>My Current Location:</strong><br>${place}<br>Weather unavailable`);
      });

    fetch("timeline.json").then(r => r.json()).then(timeline => {
      timeline.forEach(day => {
        (day.photos || []).forEach(photo => {
          if (!photo.lat || !photo.lng) return;
          const el = document.createElement('div');
          el.className = 'map-thumb';
          el.style = `
            width: 32px;
            height: 32px;
            border-radius: 4px;
            background-size: cover;
            background-position: center;
            box-shadow: 0 0 4px rgba(0,0,0,0.5);
            background-image: url(images/${photo.id}.jpg);
            cursor: pointer;
          `;
          el.onclick = () => showOverlay('images/' + photo.id + '.jpg', photo.caption);
          new mapboxgl.Marker(el).setLngLat([photo.lng, photo.lat]).addTo(map);
        });
      });
    });
  });
}

initMapWithPhotos();
