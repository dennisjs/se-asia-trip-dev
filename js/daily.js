window.addEventListener("DOMContentLoaded", async () => {
  await loadDailyThing(); // wait for daily content to load
  initFirebaseComments(); // then load comments system
});

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

    if (!entry) return;

    // Set description with line breaks
    descContainer.innerHTML = (entry.description || "No description provided.").replace(/\\n/g, "<br>");

    // Set formatted date
    const parts = latestDate.split("-");
    const localDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const formatted = localDate.toLocaleDateString(undefined, {
      year: "numeric", month: "long", day: "numeric"
    });
    dateContainer.textContent = "Last entry: " + formatted;

    // Set media
    let html = "";
    if (entry.type === "audio") {
      html = `<audio controls><source src="${entry.src}" type="audio/mpeg"></audio>`;
    } else if (entry.type === "image") {
      html = `<img src="${entry.src}" style="max-width: 100%; height: auto;" />`;
    } else if (entry.type === "video") {
      html = `<video controls style="max-width: 100%;"><source src="${entry.src}" type="video/mp4"></video>`;
    } else if (entry.type === "map") {
      html = `<iframe src="${entry.mapSrc}" style="width:100%; height:500px; border:none;" allowfullscreen></iframe>`;
    } else {
      html = "<p>Unsupported media type.</p>";
    }

    container.innerHTML = html + (entry.caption ? `<p>${entry.caption}</p>` : "");

    // store for comment system
    window.latestDailyKey = latestDate;

  } catch (err) {
    console.error("Failed to load daily.json:", err);
  }
}

function initFirebaseComments() {
  const app = firebase.initializeApp(window.CONFIG.FIREBASE_CONFIG);
  const db = firebase.database(app);

  const form = document.getElementById("daily-comment-form");
  const nameInput = document.getElementById("commentName");
  const textInput = document.getElementById("commentText");
  const container = document.getElementById("dailyCommentsContainer");

  const refForDate = (key) => db.ref("daily-comments/" + key);

  // load comments
  function loadComments(dateKey) {
    container.innerHTML = "";
    refForDate(dateKey).off(); // clear previous listener
    refForDate(dateKey).on("value", snap => {
      container.innerHTML = "";
      const data = snap.val();
      if (!data) return;
      Object.values(data).forEach(entry => {
        const div = document.createElement("div");
        div.style.marginBottom = "1rem";
        div.innerHTML = `<strong>${entry.name}</strong><br>${entry.text}`;
        container.appendChild(div);
      });
    });
  }

  // submit comment
  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const text = textInput.value.trim();
    if (!name || !text) return;
    const dateKey = window.latestDailyKey;
    refForDate(dateKey).push({ name, text });
    form.reset();
  });

  // load existing comments
  if (window.latestDailyKey) {
    loadComments(window.latestDailyKey);
  }
}
