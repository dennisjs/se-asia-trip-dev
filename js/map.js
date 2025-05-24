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

window.initMapWithPhotos = function () {
  document.querySelectorAll(".location-info-box").forEach(el => el.remove());

  fetchLatestLocation().then(locations => {
    if (locations.length === 0) return;

    const current = locations[locations.length - 1];
    const { lat, lng, place } = current;

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 12
    });

    // Route line
    const coordinates = locations.map(loc => [loc.lng, loc.lat]);
    map.on("load", () => {
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
          "line-color": "#66aadd",  // light blue matching section titles
          "line-width": 2.5,
          "line-opacity": 0.8,
          "line-dasharray": [3, 5]
        }
      });
    });

    // Red pin for current location
    new mapboxgl.Marker({ color: "red" }).setLngLat([lng, lat]).addTo(map);

    // Floating weather box
    const infoBox = document.createElement('div');
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

    // Prior grey pins
    const previousLocations = locations.slice(0, -1);
    previousLocations.forEach(loc => {
      if (!loc.lat || !loc.lng) return;

      new mapboxgl.Marker({ color: "gray" }).setLngLat([loc.lng, loc.lat]).addTo(map);

      const box = document.createElement("div");
      box.className = "location-info-box";

      const arrival = loc.arrival_date || "?";
      const departure = loc.departure_date || "?";

      let rangeStr = "Arrived: " + arrival;
      if (departure) {
        rangeStr += "<br>Departed: " + departure;
      }

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

    // Thumbnails from timeline.json
    let photoMarkers = [];

    fetch("timeline.json")
      .then(r => r.json())
      .then(timeline => {
        timeline.forEach(day => {
          (day.photos || []).forEach(photo => {
            if (!photo.lat || !photo.lng) return;

            );
        });

        // Toggle button
        const toggleBtn = document.getElementById("toggle-thumbs");
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
};



            );
        });

        // Toggle button
        const toggleBtn = document.getElementById("toggle-thumbs");
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
};



document.addEventListener("DOMContentLoaded", () => {
  const infoBtn = document.getElementById("map-info-btn");
  const infoBox = document.getElementById("map-info-box");

  console.log("✅ DOM loaded");

  if (!infoBtn) {
    console.warn("❌ map-info-btn not found");
  }
  if (!infoBox) {
    console.warn("❌ map-info-box not found");
  }

  if (infoBtn && infoBox) {
    console.log("✅ Map Info elements found — wiring up toggle");

    infoBtn.addEventListener("click", () => {
      console.log("🟦 Map Info button clicked");
      infoBox.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!infoBox.contains(e.target) && e.target !== infoBtn) {
        infoBox.classList.remove("active");
        console.log("🟥 Outside click — hiding Map Info box");
      }
    });
  }
});


if (document.getElementById("map")?.offsetParent !== null) {
  window.initMapWithPhotos();
}


document.addEventListener("DOMContentLoaded", () => {
  const infoBtn = document.getElementById("map-info-btn");
  const infoBox = document.getElementById("map-info-box");

  console.log("✅ DOM loaded");

  if (!infoBtn) {
    console.warn("❌ map-info-btn not found");
  }
  if (!infoBox) {
    console.warn("❌ map-info-box not found");
  }

  if (infoBtn && infoBox) {
    console.log("✅ Map Info elements found — wiring up toggle");

    infoBtn.addEventListener("click", () => {
      console.log("🟦 Map Info button clicked");
      infoBox.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!infoBox.contains(e.target) && e.target !== infoBtn) {
        infoBox.classList.remove("active");
        console.log("🟥 Outside click — hiding Map Info box");
      }
    });
  }
});
