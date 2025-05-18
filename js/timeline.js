
function loadTimeline() {
  fetch("timeline.json")
    .then(r => r.json())
    .then(data => {
      const container = document.getElementById("timeline-content");
      container.innerHTML = "";

      data.forEach(day => {
        const section = document.createElement("section");
        const weather = day.weather || "";
        const photos = day.photos || [];

        const photoHTML = photos.map((photo, i) => 
          '<figure>' +
            '<img src="images/' + photo.id + '.jpg" alt="' + photo.caption + '" data-photo-index="' + i + '" class="photo-thumb">' +
            '<figcaption>' + photo.caption + '</figcaption>' +
          '</figure>'
        ).join("");

        section.innerHTML = 
          '<h3>' + day.day + ' – ' + day.date + '</h3>' +
          (weather ? '<div class="weather-info">🌦 ' + weather + '</div>' : '') +
          '<div class="photos">' + photoHTML + '</div>';

        container.appendChild(section);

        const thumbs = section.querySelectorAll(".photo-thumb");
        thumbs.forEach((thumb, i) => {
          thumb.onclick = () => initLightbox(photos, i, day.day + " – " + day.date);
        });
      });
    })
    .catch(err => {
      document.getElementById("timeline-content").textContent = "Error loading timeline: " + err;
    });
}
