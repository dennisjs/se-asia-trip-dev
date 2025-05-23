
async function loadDailyThing() {
  const container = document.getElementById("dailyContainer");

  try {
    const res = await fetch("daily.json");
    const data = await res.json();

    if (data.type === "audio") {
      container.innerHTML = `
        <audio controls>
          <source src="${data.src}" type="audio/mpeg">
          Your browser does not support the audio element.
        </audio>
        ${data.caption ? `<p>${data.caption}</p>` : ""}
      `;
    } else {
      container.innerHTML = "<p>Unsupported type in daily.json</p>";
    }

  } catch (err) {
    console.error("Failed to load daily.json:", err);
    container.innerHTML = "<p>Error loading audio content.</p>";
  }
}

window.addEventListener("DOMContentLoaded", loadDailyThing);
