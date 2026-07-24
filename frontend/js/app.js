"use strict";

const mobileMenuButton = document.getElementById("mobileMenuButton");
const navigationMenu = document.getElementById("navigationMenu");
const currentYearElement = document.getElementById("currentYear");
const navigationLinks = document.querySelectorAll(".navigation-link");

function toggleMobileMenu() {
    const menuIsOpen = navigationMenu.classList.toggle("open");

    mobileMenuButton.classList.toggle("active", menuIsOpen);
    mobileMenuButton.setAttribute("aria-expanded", String(menuIsOpen));

    document.body.classList.toggle("menu-open", menuIsOpen);
}

function closeMobileMenu() {
    navigationMenu.classList.remove("open");
    mobileMenuButton.classList.remove("active");
    mobileMenuButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
}

mobileMenuButton.addEventListener("click", toggleMobileMenu);

navigationLinks.forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
});

window.addEventListener("resize", () => {
    if (window.innerWidth > 820) {
        closeMobileMenu();
    }
});
if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
}