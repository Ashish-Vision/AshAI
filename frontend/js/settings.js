"use strict";

import { getCurrentUser, hasToken } from "./api.js";
import { getPreferredTheme, setTheme } from "./theme.js";

export const MODEL_PREFERENCE_KEY = "ashai_default_model";
export const CODE_FORMATTING_KEY = "ashai_code_formatting";

const byId = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", async () => {
    if (!hasToken()) {
        window.location.replace("./login.html");
        return;
    }

    try {
        await getCurrentUser();
    } catch (error) {
        if (error.status === 401 || error.status === 403) {
            window.location.replace("./login.html");
            return;
        }
        const status = byId("settingsStatus");
        status.textContent = error.message;
        status.classList.add("error");
    }

    const theme = byId("themeSelect");
    const model = byId("modelSelect");
    const codeFormatting = byId("codeSyntaxToggle");
    theme.value = getPreferredTheme();
    model.value = localStorage.getItem(MODEL_PREFERENCE_KEY) || "AshAI Standard";
    if (!model.value) model.value = "AshAI Standard";
    codeFormatting.checked = localStorage.getItem(CODE_FORMATTING_KEY) !== "false";

    theme.addEventListener("change", () => setTheme(theme.value));

    byId("settingsForm").addEventListener("submit", (event) => {
        event.preventDefault();
        setTheme(theme.value);
        localStorage.setItem(MODEL_PREFERENCE_KEY, model.value);
        localStorage.setItem(CODE_FORMATTING_KEY, String(codeFormatting.checked));

        const status = byId("settingsStatus");
        status.textContent = "Preferences saved.";
        status.className = "form-status success";
        window.setTimeout(() => {
            status.textContent = "";
            status.className = "form-status";
        }, 3000);
    });
});
