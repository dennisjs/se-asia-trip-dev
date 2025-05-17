
mapboxgl.accessToken = 'pk.eyJ1IjoiZGVubmlzanMiLCJhIjoiY21hbzF2bHN4MDJkeDJpcHdrdGw1ZmVhNyJ9.T4AQXpyEQ9Bmsmz31jVJMw';

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

    new mapboxgl.Marker({ color: "red" })
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup().setText(`My Current Location: ${place}`))
      .addTo(map);

    if (window.updateWeatherBox) {
      updateWeatherBox(lat, lng, place);
    }

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
