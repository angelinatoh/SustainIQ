/* =========================
   SustainIQ – main.js
   - Mobile nav toggle
   - Auto year in footer
   ========================= */

(function () {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");

  // Mobile nav toggle
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
    });

    // Close menu when clicking a link (mobile)
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      const isClickInside = nav.contains(e.target) || toggle.contains(e.target);
      if (!isClickInside) nav.classList.remove("open");
    });
  }

  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
