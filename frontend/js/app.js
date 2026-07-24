"use strict";

const MOBILE_BREAKPOINT = 820;

const mobileMenuButton = document.getElementById("mobileMenuButton");
const navigationMenu = document.getElementById("navigationMenu");
const navigationLinks = document.querySelectorAll(".navigation-link");

const currentYearElement = document.getElementById("currentYear");
const pageLoader = document.getElementById("pageLoader");
const siteHeader = document.querySelector(".site-header");

const sections = document.querySelectorAll("main section[id]");

const revealElements = document.querySelectorAll(
    ".reveal-section, .reveal-item"
);

function isMobileViewport() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
}

function updateNavigationAccessibility() {
    if (!navigationMenu || !mobileMenuButton) {
        return;
    }

    if (!isMobileViewport()) {
        navigationMenu.removeAttribute("aria-hidden");
        mobileMenuButton.setAttribute("aria-expanded", "false");
        return;
    }

    const menuIsOpen = navigationMenu.classList.contains("open");

    navigationMenu.setAttribute("aria-hidden", String(!menuIsOpen));
    mobileMenuButton.setAttribute("aria-expanded", String(menuIsOpen));
}

function toggleMobileMenu() {
    if (!mobileMenuButton || !navigationMenu || !isMobileViewport()) {
        return;
    }

    const menuIsOpen = navigationMenu.classList.toggle("open");

    mobileMenuButton.classList.toggle("active", menuIsOpen);

    mobileMenuButton.setAttribute(
        "aria-expanded",
        String(menuIsOpen)
    );

    mobileMenuButton.setAttribute(
        "aria-label",
        menuIsOpen
            ? "Close navigation menu"
            : "Open navigation menu"
    );

    navigationMenu.setAttribute(
        "aria-hidden",
        String(!menuIsOpen)
    );

    document.body.classList.toggle("menu-open", menuIsOpen);
}

function closeMobileMenu({ returnFocus = false } = {}) {
    if (!mobileMenuButton || !navigationMenu) {
        return;
    }

    const menuWasOpen = navigationMenu.classList.contains("open");

    navigationMenu.classList.remove("open");
    mobileMenuButton.classList.remove("active");

    mobileMenuButton.setAttribute("aria-expanded", "false");
    mobileMenuButton.setAttribute(
        "aria-label",
        "Open navigation menu"
    );

    document.body.classList.remove("menu-open");

    if (isMobileViewport()) {
        navigationMenu.setAttribute("aria-hidden", "true");
    } else {
        navigationMenu.removeAttribute("aria-hidden");
    }

    if (returnFocus && menuWasOpen) {
        mobileMenuButton.focus();
    }
}

function updateCopyrightYear() {
    if (!currentYearElement) {
        return;
    }

    currentYearElement.textContent = String(
        new Date().getFullYear()
    );
}

function hidePageLoader() {
    if (!pageLoader) {
        return;
    }

    window.setTimeout(() => {
        pageLoader.classList.add("hidden");

        window.setTimeout(() => {
            pageLoader.remove();
        }, 500);
    }, 300);
}

function updateHeaderOnScroll() {
    if (!siteHeader) {
        return;
    }

    siteHeader.classList.toggle(
        "scrolled",
        window.scrollY > 20
    );
}

function initializeScrollReveal() {
    if (!revealElements.length) {
        return;
    }

    const reducedMotionIsEnabled = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (
        reducedMotionIsEnabled ||
        !("IntersectionObserver" in window)
    ) {
        revealElements.forEach((element) => {
            element.classList.add("visible");
        });

        return;
    }

    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            });
        },
        {
            threshold: 0.12,
            rootMargin: "0px 0px -40px 0px"
        }
    );

    revealElements.forEach((element) => {
        revealObserver.observe(element);
    });
}

function setActiveNavigationLink(sectionId) {
    navigationLinks.forEach((link) => {
        const linkTarget = link.getAttribute("href");

        link.classList.toggle(
            "active",
            linkTarget === `#${sectionId}`
        );
    });
}

function initializeActiveNavigation() {
    if (!sections.length || !navigationLinks.length) {
        return;
    }

    if (!("IntersectionObserver" in window)) {
        return;
    }

    const visibleSections = new Map();

    const sectionObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    visibleSections.set(
                        entry.target.id,
                        entry.intersectionRatio
                    );
                } else {
                    visibleSections.delete(entry.target.id);
                }
            });

            if (!visibleSections.size) {
                return;
            }

            const activeSection = [...visibleSections.entries()]
                .sort((first, second) => second[1] - first[1])[0];

            setActiveNavigationLink(activeSection[0]);
        },
        {
            threshold: [0.05, 0.15, 0.3, 0.5],
            rootMargin: "-20% 0px -55% 0px"
        }
    );

    sections.forEach((section) => {
        sectionObserver.observe(section);
    });
}

function initializeNavigation() {
    updateNavigationAccessibility();

    mobileMenuButton?.addEventListener(
        "click",
        toggleMobileMenu
    );

    navigationLinks.forEach((link) => {
        link.addEventListener("click", () => {
            if (isMobileViewport()) {
                closeMobileMenu();
            }
        });
    });

    window.addEventListener(
        "resize",
        () => {
            if (!isMobileViewport()) {
                closeMobileMenu();
            }

            updateNavigationAccessibility();
        },
        {
            passive: true
        }
    );

    document.addEventListener("keydown", (event) => {
        if (
            event.key === "Escape" &&
            navigationMenu?.classList.contains("open")
        ) {
            closeMobileMenu({
                returnFocus: true
            });
        }
    });

    document.addEventListener("click", (event) => {
        if (
            !navigationMenu ||
            !mobileMenuButton ||
            !isMobileViewport() ||
            !navigationMenu.classList.contains("open")
        ) {
            return;
        }

        const clickedInsideMenu = navigationMenu.contains(
            event.target
        );

        const clickedMenuButton = mobileMenuButton.contains(
            event.target
        );

        if (!clickedInsideMenu && !clickedMenuButton) {
            closeMobileMenu();
        }
    });
}

function initializePage() {
    initializeNavigation();
    initializeScrollReveal();
    initializeActiveNavigation();
    updateCopyrightYear();
    updateHeaderOnScroll();
}

window.addEventListener(
    "load",
    hidePageLoader,
    {
        once: true
    }
);

window.addEventListener(
    "scroll",
    updateHeaderOnScroll,
    {
        passive: true
    }
);

initializePage();