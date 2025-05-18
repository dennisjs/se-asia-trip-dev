
window.initLightbox = function(photoList, startIndex = 0, dayLabel = "") {
  const overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";

  const content = document.createElement("div");
  content.className = "lightbox-content";

  content.innerHTML = 
    '<span class="lightbox-close">&times;</span>' +
    '<div class="lightbox-main">' +
      '<img id="lightbox-main-img" src="" alt="">' +
      '<div class="lightbox-caption"></div>' +
    '</div>' +
    '<div class="lightbox-nav">' +
      '<button id="lightbox-prev">&#10094;</button>' +
      '<div class="lightbox-thumbnails"></div>' +
      '<button id="lightbox-next">&#10095;</button>' +
    '</div>';

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  const mainImg = overlay.querySelector("#lightbox-main-img");
  const caption = overlay.querySelector(".lightbox-caption");
  const thumbContainer = overlay.querySelector(".lightbox-thumbnails");
  let currentIndex = startIndex;

  function updateViewer(index) {
    const photo = photoList[index];
    currentIndex = index;
    mainImg.src = "images/" + photo.id + ".jpg";
    caption.textContent = photo.caption || "";
    thumbContainer.querySelectorAll("img").forEach((img, i) => {
      img.classList.toggle("active-thumb", i === index);
    });

  function handleKeydown(e) {
  if (!document.body.contains(overlay)) return;
  switch (e.key) {
    case "ArrowLeft":
      if (currentIndex > 0) updateViewer(currentIndex - 1);
      break;
    case "ArrowRight":
      if (currentIndex < photoList.length - 1) updateViewer(currentIndex + 1);
      break;
    case "Escape":
      overlay.remove();
      break;
    }
  }

  document.addEventListener("keydown", handleKeydown);

  // Clean up when lightbox closes
  overlay.querySelector(".lightbox-close").onclick = () => {
    overlay.remove();
    document.removeEventListener("keydown", handleKeydown);
  };

  }

  photoList.forEach((photo, i) => {
    const thumb = document.createElement("img");
    thumb.src = "images/" + photo.id + ".jpg";
    thumb.alt = photo.caption || "";
    thumb.onclick = () => updateViewer(i);
    thumbContainer.appendChild(thumb);
  });

  overlay.querySelector("#lightbox-prev").onclick = () => {
    if (currentIndex > 0) updateViewer(currentIndex - 1);
  };
  overlay.querySelector("#lightbox-next").onclick = () => {
    if (currentIndex < photoList.length - 1) updateViewer(currentIndex + 1);
  };
  overlay.querySelector(".lightbox-close").onclick = () => {
    overlay.remove();
  };
  overlay.onclick = e => {
    if (e.target === overlay) overlay.remove();
  };

  updateViewer(currentIndex);
};
