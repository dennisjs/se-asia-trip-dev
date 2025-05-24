

async function loadDailyThing() {
  const container = document.getElementById("dailyContainer");
  const descContainer = document.getElementById("descriptionContainer");
  const dateContainer = document.getElementById("entryDate");

  try {
    const res = await fetch("daily.json");
    const data = await res.json();

    const availableDates = Object.keys(data).sort().reverse();
    const latestDate = availableDates[0];
    const entry = data[latestDate];

    if (!entry) {
      container.innerHTML = "";
      descContainer.innerHTML = "";
      dateContainer.innerHTML = "";
      return;
    }

    // Set description text
    descContainer.textContent = entry.description || "No description provided.";

    // Set formatted date
    const parts = latestDate.split("-");
    const localDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const formatted = localDate.toLocaleDateString(undefined, {
      year: "numeric", month: "long", day: "numeric"
    });

    dateContainer.textContent = "Last entry: " + formatted;

    // Set media content
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
    descContainer.innerHTML = "";
    dateContainer.innerHTML = "";
  }
}

window.addEventListener("DOMContentLoaded", loadDailyThing);
