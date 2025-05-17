
window.showSection = function(id) {
  const allSections = document.querySelectorAll('.section');
  const newSection = document.getElementById(id);
  const currentSection = Array.from(allSections).find(sec => sec.classList.contains('active'));

  if (newSection === currentSection) return;

  if (currentSection) {
    currentSection.classList.remove('show-up');
    currentSection.classList.add('hide-down');

    setTimeout(() => {
      currentSection.classList.remove('active', 'hide-down');
      newSection.classList.add('slide-up', 'active');
      setTimeout(() => {
        newSection.classList.remove('slide-up');
        newSection.classList.add('show-up');
      }, 10);
    }, 500);
  } else {
    newSection.classList.add('slide-up', 'active');
    setTimeout(() => {
      newSection.classList.remove('slide-up');
      newSection.classList.add('show-up');
    }, 10);
  }
};
