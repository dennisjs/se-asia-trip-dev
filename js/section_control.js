function showSection(id) {
  // Hide all content sections
  document.querySelectorAll(".section").forEach(el => el.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  // 🧼 Remove floating info box when leaving the map
  if (id !== "map-section") {
    document.querySelectorAll(".location-info-box").forEach(el => el.remove());
  }

  // 🔁 Re-initialize map if returning
  if (id === "map-section" && typeof initMapWithPhotos === "function") {
    initMapWithPhotos();
  }
}
