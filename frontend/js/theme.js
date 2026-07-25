"use strict";

/* ==========================================================
   THEME MANAGEMENT SYSTEM
========================================================== */

const THEME_KEY = "ashai_theme_preference";

export function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) {
        return stored;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function setTheme(theme) {
    if (theme === "dark") {
        document.documentElement.classList.add("dark-theme");
        document.documentElement.classList.remove("light-theme");
    } else if (theme === "light") {
        document.documentElement.classList.add("light-theme");
        document.documentElement.classList.remove("dark-theme");
    } else {
        document.documentElement.classList.remove("dark-theme", "light-theme");
    }
    localStorage.setItem(THEME_KEY, theme);
}

document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = getPreferredTheme();
    setTheme(savedTheme);

    const themeToggles = document.querySelectorAll(".theme-toggle-btn");
    themeToggles.forEach((btn) => {
        btn.addEventListener("click", () => {
            const current = getPreferredTheme();
            const next = current === "dark" ? "light" : "dark";
            setTheme(next);
        });
    });
});
