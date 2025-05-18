
mapboxgl.accessToken = window.CONFIG.MAPBOX_TOKEN;

let map;

fetch("location.json")
  .then(r => r.json())
  .then(locations => {
    const current = locations[locations.length - 1];
    const mapCenter = [current.lng, current.lat];

    map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v12",
      center: mapCenter,
      zoom: 11
    });

    // Add markers for all locations
    locations.forEach((loc, i) => {
      const isCurrent = i === locations.length - 1;
      const color = isCurrent ? "red" : "gray";

      new mapboxgl.Marker({ color })
        .setLngLat([loc.lng, loc.lat])
        .addTo(map);
    });

    // Draw dotted lines between locations
    if (locations.length >= 2) {
      const coords = locations.map(loc => [loc.lng, loc.lat]);
      map.on("load", () => {
        map.addSource("travel-line", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: coords
            }
          }
        });
        map.addLayer({
          id: "travel-line",
          type: "line",
          source: "travel-line",
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "#33adff",
            "line-width": 2,
            "line-dasharray": [2, 4]
          }
        });
      });
    }

    // Add photo thumbnails from timeline
    fetch("timeline.json")
      .then(r => r.json())
      .then(timeline => {
        const photoMarkers = [];

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
