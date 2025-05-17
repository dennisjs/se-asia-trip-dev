
function loadTimeline() {
  fetch("timeline.json")
    .then(res => res.json())
    .then(timeline => {
      const container = document.getElementById("timeline-content");
      container.innerHTML = "";
      timeline.forEach(day => {
        const daySection = document.createElement("div");
        daySection.innerHTML = `
          <h3>${day.day}: ${day.title}</h3>
          <p><em>${day.date}</em></p>
          <p>${day.description}</p>
          <div class="photos">
            ${day.photos.map(photo => `
              <img src="images/${photo.id}.jpg" alt="${photo.caption}" onclick="showOverlay('${photo.id}', \`${photo.caption}\`)"/>
            `).join('')}
          </div>
        `;
        container.appendChild(daySection);
      });
    })
    .catch(err => {
      document.getElementById("timeline-content").textContent = "Failed to load timeline.";
      console.error("Timeline error:", err);
    });
}
