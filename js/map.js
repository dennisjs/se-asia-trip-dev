
function initMapWithPhotos() {
  fetch("location.json").then(r => r.json()).then(loc => {
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [loc.lng, loc.lat],
      zoom: 12
    });

    new mapboxgl.Marker({ color: "red" }).setLngLat([loc.lng, loc.lat]).addTo(map);

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
          el.onclick = () => showOverlay(photo.id, photo.caption);
          new mapboxgl.Marker(el).setLngLat([photo.lng, photo.lat]).addTo(map);
        });
      });
    });
  });
}
