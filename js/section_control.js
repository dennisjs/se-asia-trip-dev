function showSection(id) {
  const allSections = document.querySelectorAll(".section");
  const newSection = document.getElementById(id);
  const currentSection = Array.from(allSections).find(sec => sec.classList.contains("active"));

  if (newSection === currentSection) return;

  // Hide all location boxes if leaving map
  if (id !== "map-section") {
    document.querySelectorAll(".location-info-box").forEach(el => el.remove());
  }

  // Animate current section out
  if (currentSection) {
    currentSection.classList.remove("active");
    currentSection.style.transition = "transform 0.4s ease-out";
    currentSection.style.transform = "translateY(100%)";
    setTimeout(() => {
      currentSection.style.display = "none";
      currentSection.style.transform = "";
    }, 400);
  }

  // Animate new section in
  newSection.style.display = "block";
  newSection.style.transform = "translateY(100%)";
  newSection.style.transition = "transform 0.4s ease-out";
  requestAnimationFrame(() => {
    newSection.classList.add("active");
    newSection.style.transform = "translateY(0%)";
  });

  // Re-initialize map if returning
  if (id === "map-section" && typeof initMapWithPhotos === "function") {
    initMapWithPhotos();
  }
}
