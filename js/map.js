
mapboxgl.accessToken = window.CONFIG.MAPBOX_TOKEN;

async function fetchLatestLocation() {
  try {
    const res = await fetch("location.json");
    const locations = await res.json();
    if (!Array.isArray(locations)) return [locations];

    locations.sort((a, b) => new Date(b.arrival_date) - new Date(a.arrival_date));
    return locations;
  } catch (e) {
    console.error("Location fetch error:", e);
    return [];
  }
}

window.initMapWithPhotos = function () {
  document.querySelectorAll(".location-info-box").forEach(el => el.remove());

  fetchLatestLocation().then(locations => {
    if (locations.length === 0) return;

    const current = locations[0];
    const { lat, lng, place } = current;

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 12
    });

    new mapboxgl.Marker({ color: "red" })
      .setLngLat([lng, lat])
      .addTo(map);

    const infoBox = document.createElement('div');
    infoBox.className = 'location-info-box';
    infoBox.innerHTML = `<strong>My Current Location:</strong><br>${place}<br>Loading weather...`;
    document.body.appendChild(infoBox);

    function positionBox() {
      const pos = map.project([lng, lat]);
      infoBox.style.left = `${pos.x + 20}px`;
      infoBox.style.top = `${pos.y - 20}px`;
    }

    map.on('load', positionBox);
    map.on('move', positionBox);

    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=imperial&appid=${window.CONFIG.OPENWEATHER_KEY}`)
      .then(res => res.json())
      .then(weather => {
        const weatherStr = `${Math.round(weather.main.temp)}°F, ${weather.weather[0].description}`;
        infoBox.innerHTML = `<strong>My Current Location:</strong><br>${place}<br>⛅ ${weatherStr}`;
      })
      .catch(() => {
        infoBox.innerHTML = `<strong>My Current Location:</strong><br>${place}<br>Weather unavailable`;
      });

    const previousLocations = locations.slice(1);

    previousLocations.forEach((loc, i) => {
      if (!loc.lat || !loc.lng || !loc.arrival_date) return;

      new mapboxgl.Marker({ color: "gray" })
        .setLngLat([loc.lng, loc.lat])
        .addTo(map);

      const box = document.createElement("div");
      box.className = "location-info-box";

      const arrival = new Date(loc.arrival_date);
      const next = i < previousLocations.length - 1 ? new Date(previousLocations[i + 1].arrival_date) : null;

      const arrivalStr = arrival.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      let rangeStr = `Arrived: ${arrivalStr}`;
      if (next) {
        const depart = new Date(next.getTime() - 86400000);
        const departStr = depart.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        rangeStr += `<br>Departed: ${departStr}`;
      }

      box.innerHTML = `<strong>${loc.place}</strong><br>${rangeStr}`;
      document.body.appendChild(box);

      function positionGrayBox() {
        const pt = map.project([loc.lng, loc.lat]);
        box.style.left = `${pt.x + 20}px`;
        box.style.top = `${pt.y - 20}px`;
      }

      map.on("load", positionGrayBox);
      map.on("move", positionGrayBox);
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
};

if (document.getElementById("map").offsetParent !== null) {
  window.initMapWithPhotos();
}
