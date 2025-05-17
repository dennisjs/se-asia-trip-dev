
mapboxgl.accessToken = window.CONFIG.MAPBOX_TOKEN;

async function fetchLocations() {
  try {
    const res = await fetch("location.json");
    const locations = await res.json();
    return Array.isArray(locations) ? locations : [locations];
  } catch (e) {
    console.error("Failed to load location.json:", e);
    return [];
  }
}

function createFloatingBox(map, lat, lng, htmlContent) {
  const el = document.createElement('div');
  el.className = 'floating-info-box';
  el.innerHTML = htmlContent;
  new mapboxgl.Marker(el, { offset: [0, 0] }).setLngLat([lng, lat]).addTo(map);
}

function initMapWithPhotos() {
  fetchLocations().then(locations => {
    if (locations.length === 0) return;

    locations.sort((a, b) => new Date(b.arrival_date) - new Date(a.arrival_date));
    const current = locations[0];
    const { lat, lng, place } = current;

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 12
    });

    // Red marker for current location
    new mapboxgl.Marker({ color: "red" })
      .setLngLat([lng, lat])
      .addTo(map);

    // Floating info box
    const box = document.createElement("div");
    box.className = "location-box";
    box.style.position = "absolute";
    box.style.background = "rgba(255,255,255,0.9)";
    box.style.padding = "10px";
    box.style.borderRadius = "8px";
    box.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    box.style.fontSize = "0.9rem";
    box.style.color = "#004080";
    box.style.maxWidth = "220px";
    box.innerHTML = `<strong>My Current Location:</strong><br>${place}<br>Loading weather...`;
    document.body.appendChild(box);

    const mapContainer = document.getElementById("map");
    map.on('load', () => {
      const point = map.project([lng, lat]);
      box.style.left = (point.x + 20) + "px";
      box.style.top = (point.y - 30) + "px";
    });

    map.on('move', () => {
      const point = map.project([lng, lat]);
      box.style.left = (point.x + 20) + "px";
      box.style.top = (point.y - 30) + "px";
    });

    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=imperial&appid=${window.CONFIG.OPENWEATHER_KEY}`)
      .then(res => res.json())
      .then(weather => {
        const weatherStr = `${Math.round(weather.main.temp)}°F, ${weather.weather[0].description}`;
        box.innerHTML = `<strong>My Current Location:</strong><br>${place}<br>⛅ ${weatherStr}`;
      })
      .catch(err => {
        box.innerHTML = `<strong>My Current Location:</strong><br>${place}<br>Weather unavailable`;
      });

    // Add gray markers for previous locations
    locations.slice(1).forEach(loc => {
      if (loc.lat && loc.lng) {
        new mapboxgl.Marker({ color: "gray" })
          .setLngLat([loc.lng, loc.lat])
          .addTo(map);
      }
    });

    // Load photo markers from timeline.json
    fetch("timeline.json").then(r => r.json()).then(timeline => {
      timeline.forEach(day => {
        (day.photos || []).forEach(photo => {
          if (!photo.lat || !photo.lng) return;
          const el = document.createElement('div');
          el.className = 'map-thumb';
          el.style = \`
            width: 32px;
            height: 32px;
            border-radius: 4px;
            background-size: cover;
            background-position: center;
            box-shadow: 0 0 4px rgba(0,0,0,0.5);
            background-image: url(images/\${photo.id}.jpg);
            cursor: pointer;
          \`;
          el.onclick = () => showOverlay('images/' + photo.id + '.jpg', photo.caption);
          new mapboxgl.Marker(el).setLngLat([photo.lng, photo.lat]).addTo(map);
        });
      });
    });
  });
}

initMapWithPhotos();
