"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.querySelector(".dashboard-sidebar");
    const sidebarOpenButton = document.getElementById(
        "sidebarOpenButton"
    );
    const sidebarCloseButton = document.getElementById(
        "sidebarCloseButton"
    );
    const sidebarOverlay = document.getElementById(
        "sidebarOverlay"
    );

    if (
        !sidebar ||
        !sidebarOpenButton ||
        !sidebarCloseButton ||
        !sidebarOverlay
    ) {
        return;
    }

    const openSidebar = () => {
        sidebar.classList.add("is-open");
        sidebarOverlay.hidden = false;

        sidebarOpenButton.setAttribute(
            "aria-expanded",
            "true"
        );

        document.body.classList.add("sidebar-open");

        window.setTimeout(() => {
            sidebarCloseButton.focus();
        }, 50);
    };

    const closeSidebar = () => {
        sidebar.classList.remove("is-open");
        sidebarOverlay.hidden = true;

        sidebarOpenButton.setAttribute(
            "aria-expanded",
            "false"
        );

        document.body.classList.remove("sidebar-open");

        if (window.innerWidth <= 980) {
            sidebarOpenButton.focus();
        }
    };

    sidebarOpenButton.setAttribute(
        "aria-controls",
        "dashboardSidebar"
    );

    sidebarOpenButton.setAttribute(
        "aria-expanded",
        "false"
    );

    sidebar.id = "dashboardSidebar";

    sidebarOpenButton.addEventListener(
        "click",
        openSidebar
    );

    sidebarCloseButton.addEventListener(
        "click",
        closeSidebar
    );

    sidebarOverlay.addEventListener(
        "click",
        closeSidebar
    );

    document.addEventListener("keydown", (event) => {
        if (
            event.key === "Escape" &&
            sidebar.classList.contains("is-open")
        ) {
            closeSidebar();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 980) {
            sidebar.classList.remove("is-open");
            sidebarOverlay.hidden = true;
            document.body.classList.remove("sidebar-open");
        }
    });
});