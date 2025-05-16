
function showOverlay(id, caption) {
  document.getElementById("overlay-img").src = `images/${id}.jpg`;
  document.getElementById("overlay-caption").textContent = caption || "";
  document.getElementById("photo-overlay").style.display = "block";
}
function hideOverlay() {
  document.getElementById("photo-overlay").style.display = "none";
}
