async function loadTimeline() {
  const res = await fetch("timeline.json");
  const timeline = await res.json();
  const container = document.getElementById("timeline-content");
  container.innerHTML = "";

  timeline.forEach(day => {
    const entry = document.createElement("div");
    entry.className = "timeline-entry";

    const photoCol = document.createElement("div");
    photoCol.className = "photo-column";

    const photos = day.photos || [];
    const maxThumbs = 3;

    photos.slice(0, maxThumbs).forEach((photo, index) => {
      const img = document.createElement("img");
      img.className = "thumb";
      img.src = `images/${photo.id}.jpg`;
      img.alt = photo.caption;
      img.onclick = () => initLightbox(photos, index);
      photoCol.appendChild(img);
    });

    if (photos.length > maxThumbs) {
      const more = document.createElement("div");
      more.className = "more-count";
      more.textContent = `+${photos.length - maxThumbs} more`;
      photoCol.appendChild(more);
    }

    const content = document.createElement("div");
    content.className = "content-box";

    const title = document.createElement("h3");
    title.textContent = `${day.day} – ${day.date}`;

    const date = document.createElement("p");
    date.className = "date";
    date.textContent = day.date;

    const desc = document.createElement("p");
    desc.className = "timeline-description";
    desc.textContent = day.description;

    const weather = document.createElement("div");
    weather.className = "weather";
    weather.textContent = `🌤 ${day.weather}`;

    content.appendChild(title);
    //content.appendChild(date);
    content.appendChild(desc);
    content.appendChild(weather);

    entry.appendChild(photoCol);
    entry.appendChild(content);
    container.appendChild(entry);
  });
}

