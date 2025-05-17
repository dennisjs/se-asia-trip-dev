function showOverlay(src, caption) {
  const overlay = document.getElementById("photo-overlay");
  const img = document.getElementById("overlay-img");
  const cap = document.getElementById("overlay-caption");

  img.src = src;
  cap.textContent = caption || "";
  overlay.style.display = "block";
}

function hideOverlay() {
  document.getElementById("photo-overlay").style.display = "none";
}
