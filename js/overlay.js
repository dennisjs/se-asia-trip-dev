function showOverlay(src, caption) {
  const overlay = document.getElementById("photo-overlay");
  const img = document.getElementById("overlay-img");
  const cap = document.getElementById("overlay-caption");

  img.src = src;
  cap.textContent = caption || "";
  overlay.style.display = "block";

  if (window.innerWidth <= 768) {
    makePhotoOverlayDraggable();
  }
}


function hideOverlay() {
  document.getElementById("photo-overlay").style.display = "none";
}

function makePhotoOverlayDraggable() {
  const overlay = document.getElementById("photo-overlay");
  if (!overlay) return;

  let isDragging = false;
  let offsetY = 0;

  overlay.addEventListener('touchstart', (e) => {
    isDragging = true;
    offsetY = e.touches[0].clientY - overlay.getBoundingClientRect().top;
  });

  overlay.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const y = e.touches[0].clientY - offsetY;
    overlay.style.top = `${y}px`;
    overlay.style.position = "fixed";  // ensure it moves with finger
  });

  overlay.addEventListener('touchend', () => {
    isDragging = false;
  });
}

