console.log("✅ daily.js loaded");
async function loadDailyThing() {
  const container = document.getElementById("dailyContainer");

  try {
    const res = await fetch("daily.json");
    const data = await res.json();
    console.log("✅ daily.json loaded2:", data);


    const today = new Date().toISOString().split("T")[0];
    const entry = data[today] || getMostRecentEntry(data, today);
    console.log("📅 entry for today:", entry);


    if (!entry) {
      container.innerHTML = "<p>No daily content available yet.</p>";
      return;
    }

    const { type, src, caption } = entry;
    let mediaHtml = "";

    if (type === "image") {
      mediaHtml = `<img src="${src}" alt="${caption || ''}" class="daily-media" />`;
    } else if (type === "video") {
      mediaHtml = `<video controls class="daily-media"><source src="${src}" type="video/mp4">Your browser does not support the video tag.</video>`;
    } else if (type === "audio") {
      console.log("audio file:", src);
      mediaHtml = `
        <audio controls class="daily-media">
          <source src="${src}" type="audio/mpeg">
          Your browser does not support the audio element.
        </audio>
      `;
    } else {
      mediaHtml = "<p>Unsupported media type.</p>";
    }

    container.innerHTML = `
      ${mediaHtml}
      ${caption ? `<div class="caption">${caption}</div>` : ""}
    `;

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
