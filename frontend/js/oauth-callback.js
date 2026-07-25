"use strict";

import { saveToken } from "./api.js";

const title = document.getElementById("oauthTitle");
const message = document.getElementById("oauthMessage");
const loginLink = document.getElementById("loginLink");
const params = new URLSearchParams(
    window.location.hash.slice(1)
);
const token = params.get("token");
const error = params.get("error");

window.history.replaceState(
    null,
    "",
    window.location.pathname
);

if (token) {
    try {
        saveToken(token, false);
        window.location.replace("./dashboard.html");
    } catch (saveError) {
        showFailure("AshAI could not save your login session.");
    }
} else {
    showFailure(
        error
            ? "Google or GitHub sign-in was not completed. Please try again."
            : "The sign-in response was invalid. Please try again."
    );
}

function showFailure(errorMessage) {
    title.textContent = "Sign-in unsuccessful";
    message.textContent = errorMessage;
    loginLink.hidden = false;
}
