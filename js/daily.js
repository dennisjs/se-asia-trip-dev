
async function loadDailyThing() {
  const container = document.getElementById("dailyContainer");

  try {
    const res = await fetch("daily.json");
    const data = await res.json();

    const today = new Date().toISOString().split("T")[0];
    const entry = data[today] || getMostRecentEntry(data, today);

    if (!entry) {
      container.innerHTML = "";
      return;
    }

    let html = "";

    if (entry.type === "audio") {
      html = `
        <audio controls>
          <source src="${entry.src}" type="audio/mpeg">
          Your browser does not support the audio element.
        </audio>
      `;
    } else if (entry.type === "image") {
      html = `
        <img src="${entry.src}" alt="${entry.caption || ''}" style="max-width: 100%; height: auto;" />
      `;
    } else if (entry.type === "video") {
      html = `
        <video controls style="max-width: 100%;">
          <source src="${entry.src}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      `;
    } else {
      html = "<p>Unsupported media type.</p>";
    }

    container.innerHTML = html + (entry.caption ? `<p>${entry.caption}</p>` : "");

  } catch (err) {
    console.error("Failed to load daily.json:", err);
    container.innerHTML = "<p>Error loading content.</p>";
  }
}

function getMostRecentEntry(data, today) {
  const availableDates = Object.keys(data)
    .filter(date => date <= today)
    .sort()
    .reverse();

  return availableDates.length ? data[availableDates[0]] : null;
}

window.addEventListener("DOMContentLoaded", loadDailyThing);
