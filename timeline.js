
async function loadTimeline() {
  try {
    const res = await fetch("timeline.json");
    const timeline = await res.json();
    const container = document.getElementById("timeline-content");
    container.innerHTML = "";

    for (const day of timeline) {
      const photos = day.photos || [];
      if (photos.length === 0) continue;

      const weather = photos.find(p => p.weather)?.weather;

      const section = document.createElement("div");
      section.className = "day-section";

      section.innerHTML = `
        <h3>${day.day} – ${day.date}</h3>
        ${weather ? `<div class="weather-info">🌦 ${weather}</div>` : ""}
        <div class="photos">
          ${photos.map(photo => `
            <figure>
              <img src="images/${photo.id}.jpg" alt="${photo.caption}" onclick="showOverlay('images/${photo.id}.jpg', \`${photo.caption}\`)">
              <figcaption>${photo.caption}</figcaption>
            </figure>
          `).join("")}
        </div>
      `;

      container.appendChild(section);
    }
  } catch (err) {
    console.error("Error loading timeline:", err);
    document.getElementById("timeline-content").textContent = "Failed to load timeline.";
  }
}
