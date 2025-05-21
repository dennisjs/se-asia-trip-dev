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
          "line-color": "#555",
          "line-width": 2,
          "line-dasharray": [2, 4]
        }
      });
    });

    // Red pin for current location
    new mapboxgl.Marker({ color: "red" }).setLngLat([lng, lat]).addTo(map);

    // Floating weather box
    const infoBox = document.createElement('div');
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

    fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&units=imperial&appid=${window.CONFIG.OPENWEATHER_KEY}`)
      .then(res => res.json())
      .then(weather => {
        const weatherStr = Math.round(weather.main.temp) + "°F, " + weather.weather[0].description;
        window.latestWeather = "⛅ " + weatherStr;
        infoBox.innerHTML = "<strong>My Current Location:</strong><br>" + place + "<br>" + window.latestWeather;
      })


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

            const el = document.createElement("div");
            el.className = "map-thumb";
            el.style.width = "32px";
            el.style.height = "32px";
            el.style.borderRadius = "4px";
            el.style.backgroundSize = "cover";
            el.style.backgroundPosition = "center";
            el.style.boxShadow = "0 0 4px rgba(0,0,0,0.5)";
            el.style.backgroundImage = "url(images/" + photo.id + ".jpg)";
            el.style.cursor = "pointer";
            el.onclick = () => showOverlay("images/" + photo.id + ".jpg", photo.caption);

            const marker = new mapboxgl.Marker(el).setLngLat([photo.lng, photo.lat]).addTo(map);
            photoMarkers.push(marker);
          });
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

if (document.getElementById("map")?.offsetParent !== null) {
  window.initMapWithPhotos();
}
