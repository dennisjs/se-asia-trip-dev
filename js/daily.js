
async function loadDailyThing() {
  const container = document.getElementById("dailyContainer");

  try {
    const res = await fetch("daily.json");
    const data = await res.json();

    let html = "";

    if (data.type === "audio") {
      html = \`
        <audio controls>
          <source src="\${data.src}" type="audio/mpeg">
          Your browser does not support the audio element.
        </audio>
      \`;
    } else if (data.type === "image") {
      html = \`
        <img src="\${data.src}" alt="\${data.caption || ''}" style="max-width: 100%; height: auto;" />
      \`;
    } else if (data.type === "video") {
      html = \`
        <video controls style="max-width: 100%;">
          <source src="\${data.src}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      \`;
    } else {
      html = "<p>Unsupported type in daily.json</p>";
    }

    container.innerHTML = html + (data.caption ? \`<p>\${data.caption}</p>\` : "");

  } catch (err) {
    console.error("Failed to load daily.json:", err);
    container.innerHTML = "<p>Error loading content.</p>";
  }
}

window.addEventListener("DOMContentLoaded", loadDailyThing);
