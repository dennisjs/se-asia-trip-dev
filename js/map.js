mapboxgl.accessToken = window.CONFIG.MAPBOX_TOKEN;

async function fetchLatestLocation() {
  try {
    const res = await fetch("location.json");
    const locations = await res.json();
    if (!Array.isArray(locations)) return [locations];
    return locations;
  } catch (e) {
    console.error("Location fetch error:", e);
    return [];
  }
}

let currentMapStyle = 'mapbox://styles/mapbox/streets-v12';
let map, photoMarkers = [], infoBox;

function buildMap(locations) {
  if (!locations.length) return;

  const current = locations[locations.length - 1];
  const { lat, lng, place } = current;

  map = new mapboxgl.Map({
    container: 'map',
    style: currentMapStyle,
    center: [lng, lat],
    zoom: 12
  });

  map.on("load", () => {
    const coordinates = locations.map(loc => [loc.lng, loc.lat]);

    map.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: coordinates
        }
      }
    });

    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round"
      },
      paint: {
        "line-color": "#66aadd",
        "line-width": 2.5,
        "line-opacity": 0.8,
        "line-dasharray": [3, 5]
      }
    });

    // Current location red pin
    new mapboxgl.Marker({ color: "red" }).setLngLat([lng, lat]).addTo(map);

    // Weather box
    infoBox = document.createElement('div');
    infoBox.id = 'location-box';
    infoBox.className = 'location-info-box';
    infoBox.innerHTML = "<strong>My Current Location:</strong><br>" + place + "<br>Loading weather...";
    document.body.appendChild(infoBox);

    function positionBox() {
      const pos = map.project([lng, lat]);
      infoBox.style.left = (pos.x + 20) + "px";
      infoBox.style.top = (pos.y - 20) + "px";
    }
    map.on('move', positionBox);
    positionBox();
    updateWeatherBox(lat, lng, place, infoBox);

    // Previous locations
    locations.slice(0, -1).forEach(loc => {
      if (!loc.lat || !loc.lng) return;
      new mapboxgl.Marker({ color: "gray" }).setLngLat([loc.lng, loc.lat]).addTo(map);

      const box = document.createElement("div");
      box.className = "location-info-box";
      const arrival = loc.arrival_date || "?";
      const departure = loc.departure_date || "?";
      let rangeStr = "Arrived: " + arrival;
      if (departure) rangeStr += "<br>Departed: " + departure;
      box.innerHTML = "<strong>" + loc.place + "</strong><br>" + rangeStr;
      document.body.appendChild(box);

      function positionGrayBox() {
        const pt = map.project([loc.lng, loc.lat]);
        box.style.left = (pt.x + 20) + "px";
        box.style.top = (pt.y - 20) + "px";
      }
      map.on("move", positionGrayBox);
      positionGrayBox();
    });

    // Thumbnails
    photoMarkers = [];
    fetch("timeline.json")
      .then(r => r.json())
      .then(timeline => {
        timeline.forEach(day => {
          (day.photos || []).forEach(photo => {
            if (!photo.lat || !photo.lng) return;

            const el = document.createElement("div");
            el.className = "map-thumb";
            el.style.cssText = `
              width: 32px; height: 32px; border-radius: 4px;
              background-size: cover; background-position: center;
              box-shadow: 0 0 4px rgba(0,0,0,0.5);
              background-image: url(images/${photo.id}.jpg);
              cursor: pointer;
            `;
            el.onclick = () => showOverlay("images/" + photo.id + ".jpg", photo.caption);
            const marker = new mapboxgl.Marker(el).setLngLat([photo.lng, photo.lat]).addTo(map);
            photoMarkers.push(marker);
          });
        });

        // Toggle thumbnails
        const toggleBtn = document.getElementById("toggle-thumbnails");
        if (toggleBtn) {
          toggleBtn.addEventListener("click", () => {
            photoMarkers.forEach(marker => {
              const el = marker.getElement();
              el.style.display = el.style.display === "none" ? "block" : "none";
            });
          });
        }
      });
  });
}

window.initMapWithPhotos = function () {
  document.querySelectorAll(".location-info-box").forEach(el => el.remove());
  fetchLatestLocation().then(locations => buildMap(locations));
};

if (document.getElementById("map")?.offsetParent !== null) {
  window.initMapWithPhotos();
}

// Satellite toggle
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggle-satellite");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      currentMapStyle = currentMapStyle === 'mapbox://styles/mapbox/streets-v12'
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/streets-v12';
      window.initMapWithPhotos();  // Reload map with new style
    });
  }

  const infoBtn = document.getElementById("map-info-btn");
  const infoBox = document.getElementById("map-info-box");
  if (infoBtn && infoBox) {
    infoBtn.addEventListener("click", () => {
      infoBox.classList.toggle("active");
    });
    document.addEventListener("click", (e) => {
      if (!infoBox.contains(e.target) && e.target !== infoBtn) {
        infoBox.classList.remove("active");
      }
    });
  }
});
