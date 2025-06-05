// map.js
mapboxgl.accessToken = window.CONFIG.MAPBOX_TOKEN;

async function fetchLatestLocation() {
  try {
    const res = await fetch(`location.json?v=${Date.now()}`);
    const locations = await res.json();
    if (!Array.isArray(locations)) return [locations];
    locations.sort((a, b) => {
      const da = new Date(a.arrival_date), db = new Date(b.arrival_date);
      return da - db;
});
return locations;

  } catch (e) {
    console.error("Location fetch error:", e);
    return [];
  }
}

let currentMapStyle = 'mapbox://styles/mapbox/streets-v12';
let map, photoMarkers = [], infoBox;
let perspectiveEnabled = false;
let rememberViewToggle = false;
let rememberTerrainToggle = false;

let mapInfoBoxWasOpen = false; // NEW FLAG

function buildMap(locations, preserveCenter, preserveZoom) {
  if (!locations.length) return;

  const current = locations[locations.length - 1];
  const { lat, lng, place } = current;

  map = new mapboxgl.Map({
    container: 'map',
    style: currentMapStyle,
    center: preserveCenter ? [preserveCenter.lng, preserveCenter.lat] : [lng, lat],
    zoom: preserveZoom || 12,
    pitch: perspectiveEnabled ? 60 : 0,
    bearing: perspectiveEnabled ? -20 : 0,
    antialias: true
  });

  map.on("load", () => {
if (rememberViewToggle) {
      perspectiveEnabled = true;
      map.easeTo({ pitch: 60, bearing: -20 });
    } else {
      perspectiveEnabled = false;
    }

    if (rememberTerrainToggle && currentMapStyle.includes("satellite")) {
      const terrainToggle = document.getElementById("terrain-toggle");
      if (terrainToggle) {
        terrainToggle.checked = true;
        terrainToggle.dispatchEvent(new Event('change'));
      }
    }
    photoMarkers = [];
    fetch(`timeline.json?v=${Date.now()}`)
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
              background-image: url(images/${photo.id});
              cursor: pointer;
            `;
            el.onclick = () => showOverlay("images/" + photo.id, photo.caption);
            const marker = new mapboxgl.Marker(el).setLngLat([photo.lng, photo.lat]).addTo(map);
            photoMarkers.push(marker);
          });
        });

        const toggleBtn = document.getElementById("toggle-thumbnails");
        if (toggleBtn) {
          toggleBtn.onclick = null; // Clear any previous listener
          toggleBtn.onclick = () => {
            photoMarkers.forEach(marker => {
              const el = marker.getElement();
              el.style.display = el.style.display === "none" ? "block" : "none";
            });
          };
        }
      });
    const mapInfoBox = document.getElementById("map-info-box");
    if (mapInfoBox && !document.getElementById("view-toggle")) {
      const style = document.createElement('style');
      style.textContent = `
        .switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 22px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 34px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: #4caf50;
        }
        input:checked + .slider:before {
          transform: translateX(18px);
        }
      `;
      document.head.appendChild(style);

      const terrainControls = document.createElement("div");
      terrainControls.innerHTML = `
        <hr>
        <div style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between">
          <span>Perspective View:</span>
          <label class="switch">
            <input type="checkbox" id="view-toggle">
            <span class="slider"></span>
          </label>
        </div>
        <div style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between">
          <span>3D Terrain:</span>
          <label class="switch">
            <input type="checkbox" id="terrain-toggle">
            <span class="slider"></span>
          </label>
        </div>
      `;
      mapInfoBox.appendChild(terrainControls);

      const viewToggle = document.getElementById('view-toggle');
      viewToggle.addEventListener('change', (e) => {
        perspectiveEnabled = e.target.checked;
        map.easeTo({ pitch: e.target.checked ? 60 : 0, bearing: e.target.checked ? -20 : 0 });
      });

      const terrainToggle = document.getElementById('terrain-toggle');
      terrainToggle.addEventListener('change', (e) => {
        if (currentMapStyle.includes("satellite")) {
          if (e.target.checked) {
            if (!map.getSource('mapbox-dem')) {
              map.addSource('mapbox-dem', {
                type: 'raster-dem',
                url: 'mapbox://mapbox.terrain-rgb',
                tileSize: 512,
                maxzoom: 14
              });
            }
            map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.0 });
            if (!map.getLayer('hillshade')) {
              map.addLayer({
                id: 'hillshade',
                type: 'hillshade',
                source: 'mapbox-dem',
                layout: {},
                paint: {}
              });
            }
          } else {
            map.setTerrain(null);
            if (map.getLayer('hillshade')) map.removeLayer('hillshade');
          }
        }
      });
    }
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

    new mapboxgl.Marker({ color: "red" }).setLngLat([lng, lat]).addTo(map);

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

    if (mapInfoBoxWasOpen) {
      document.getElementById("map-info-box")?.classList.add("active");
    }
    mapInfoBoxWasOpen = false;
  });
}

window.initMapWithPhotos = function (preserveCenter = null, preserveZoom = null) {
  document.querySelectorAll(".location-info-box").forEach(el => el.remove());
  fetchLatestLocation().then(locations => buildMap(locations, preserveCenter, preserveZoom));
};

if (document.getElementById("map")?.offsetParent !== null) {
  window.initMapWithPhotos();
}

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggle-satellite");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
  const isSatellite = currentMapStyle === 'mapbox://styles/mapbox/satellite-streets-v12';
  currentMapStyle = isSatellite
    ? 'mapbox://styles/mapbox/streets-v12'
    : 'mapbox://styles/mapbox/satellite-streets-v12';
  toggleBtn.textContent = isSatellite ? 'Satellite View' : 'Map View';

  const center = map.getCenter();
  const zoom = map.getZoom();

  const infoBox = document.getElementById("map-info-box");
  mapInfoBoxWasOpen = infoBox?.classList.contains("active");

  rememberViewToggle = document.getElementById("view-toggle")?.checked;
  rememberTerrainToggle = document.getElementById("terrain-toggle")?.checked;

  window.initMapWithPhotos(center, zoom);
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
  //infoBox?.classList.add("active");
});
