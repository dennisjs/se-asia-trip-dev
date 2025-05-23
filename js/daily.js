
console.log("✅ daily.js loaded");

async function loadDailyThing() {
  const container = document.getElementById("dailyContainer");

  try {
    const res = await fetch("daily.json");
    const data = await res.json();
    console.log("✅ daily.json loaded:", data);

    const today = new Date().toISOString().split("T")[0];
    const entry = data[today] || getMostRecentEntry(data, today);
    console.log("📅 entry for today:", entry);

    if (!entry) {
      container.innerHTML = "<p>No daily content available yet.</p>";
      return;
    }

    const { type, src, caption } = entry;

    if (type === "image") {
      container.innerHTML = `
        <div class="daily-box">
          <img src="${src}" alt="${caption || ''}" class="daily-media" />
          ${caption ? `<div class="caption">${caption}</div>` : ""}
        </div>
      `;
    } else if (type === "video") {
      container.innerHTML = `
        <div class="daily-box">
          <video controls class="daily-media">
            <source src="${src}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
          ${caption ? `<div class="caption">${caption}</div>` : ""}
        </div>
      `;
    } else if (type === "audio") {
      container.innerHTML = `
        <div class="daily-box">
          <audio controls class="daily-media">
            <source src="${src}" type="audio/mpeg">
            Your browser does not support the audio element.
          </audio>
          ${caption ? `<div class="caption">${caption}</div>` : ""}
        </div>
      `;
    } else {
      container.innerHTML = "<p>Unsupported media type.</p>";
    }

  } catch (err) {
    console.error("Failed to load daily thing:", err);
    container.innerHTML = "<p>Error loading daily content.</p>";
  }
}

function getMostRecentEntry(data, today) {
  const availableDates = Object.keys(data).filter(date => date <= today).sort().reverse();
  return availableDates.length ? data[availableDates[0]] : null;
}

window.addEventListener("DOMContentLoaded", loadDailyThing);
