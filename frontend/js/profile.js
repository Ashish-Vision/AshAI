"use strict";

import { apiRequest, hasToken } from "./api.js";
import "./theme.js";

const loginUrl = "./login.html";
const byId = (id) => document.getElementById(id);

function setStatus(element, message, type = "") {
    element.textContent = message;
    element.className = `form-status ${type}`.trim();
}

function redirectIfUnauthorized(error) {
    if (error.status === 401 || error.status === 403) {
        window.location.replace(loginUrl);
        return true;
    }
    return false;
}

function renderAvatar(name, avatarUrl) {
    const avatar = byId("avatarBadge");
    avatar.replaceChildren();
    if (avatarUrl) {
        const image = new Image();
        image.alt = "";
        image.src = avatarUrl;
        image.addEventListener("error", () => {
            avatar.textContent = (name || "A").trim().charAt(0).toUpperCase();
        }, { once: true });
        avatar.append(image);
    } else {
        avatar.textContent = (name || "A").trim().charAt(0).toUpperCase();
    }
}

function renderProfile(user) {
    byId("profileName").textContent = user.fullName || "AshAI user";
    byId("profileEmail").textContent = user.email || "";
    byId("fullName").value = user.fullName || "";
    byId("email").value = user.email || "";
    byId("bio").value = user.bio || "";
    byId("avatarUrl").value = user.avatarUrl || "";
    byId("bioCount").textContent = String((user.bio || "").length);
    byId("accountRole").textContent = String(user.role || "User").replaceAll("_", " ");
    byId("accountId").textContent = user.id ? `#${user.id}` : "—";
    byId("memberSince").textContent = user.createdAt
        ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(user.createdAt))
        : "—";
    const verification = byId("verificationStatus");
    verification.textContent = user.verified ? "● Email verified" : "● Email not verified";
    verification.classList.toggle("unverified", !user.verified);
    renderAvatar(user.fullName, user.avatarUrl);
}

async function loadProfile() {
    try {
        renderProfile(await apiRequest("/profile"));
    } catch (error) {
        if (!redirectIfUnauthorized(error)) {
            byId("profileName").textContent = "Unable to load profile";
            setStatus(byId("profileStatus"), error.message, "error");
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (!hasToken()) {
        window.location.replace(loginUrl);
        return;
    }

    const bio = byId("bio");
    bio.addEventListener("input", () => {
        byId("bioCount").textContent = String(bio.value.length);
    });

    byId("profileForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = byId("saveProfileButton");
        const status = byId("profileStatus");
        const fullName = byId("fullName").value.trim().replace(/\s+/g, " ");
        const avatarUrl = byId("avatarUrl").value.trim();

        if (fullName.length < 2) {
            setStatus(status, "Enter a name with at least 2 characters.", "error");
            byId("fullName").focus();
            return;
        }

        button.disabled = true;
        setStatus(status, "Saving…");
        try {
            const user = await apiRequest("/profile", {
                method: "PUT",
                body: JSON.stringify({ fullName, bio: bio.value.trim(), avatarUrl })
            });
            renderProfile(user);
            setStatus(status, "Profile saved.", "success");
        } catch (error) {
            if (!redirectIfUnauthorized(error)) setStatus(status, error.message, "error");
        } finally {
            button.disabled = false;
        }
    });

    byId("passwordForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = byId("changePasswordButton");
        const status = byId("passwordStatus");
        const currentPassword = byId("currentPassword").value;
        const newPassword = byId("newPassword").value;

        if (newPassword.length < 8) {
            setStatus(status, "The new password must contain at least 8 characters.", "error");
            return;
        }
        if (newPassword !== byId("confirmPassword").value) {
            setStatus(status, "The new passwords do not match.", "error");
            return;
        }
        if (newPassword === currentPassword) {
            setStatus(status, "Choose a password different from your current password.", "error");
            return;
        }

        button.disabled = true;
        setStatus(status, "Updating…");
        try {
            await apiRequest("/profile/password", {
                method: "PUT",
                body: JSON.stringify({ currentPassword, newPassword })
            });
            event.currentTarget.reset();
            setStatus(status, "Password updated successfully.", "success");
        } catch (error) {
            if (!redirectIfUnauthorized(error)) setStatus(status, error.message, "error");
        } finally {
            button.disabled = false;
        }
    });

    loadProfile();
});
