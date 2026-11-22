const menu = document.querySelector(".mobile-menu");
const menuToggle = menu.querySelector("summary");

menu.addEventListener("click", (event) => {
  const link = event.target.closest("a[href^='#']");
  if (!link) return;

  menu.open = false;
  const destination = document.querySelector(link.hash);
  destination?.focus({ preventScroll: true });
});

menu.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !menu.open) return;

  menu.open = false;
  menuToggle.focus();
});
