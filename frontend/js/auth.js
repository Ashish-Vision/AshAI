"use strict";

import {
    hasToken,
    loginUser
} from "./api.js";

/* ==========================================================
   AUTH ELEMENTS
========================================================== */

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberMeInput = document.getElementById("rememberMe");

const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const formMessage = document.getElementById("formMessage");

const togglePasswordButton =
    document.getElementById("togglePassword");

const loginButton = document.getElementById("loginButton");

const buttonText =
    loginButton?.querySelector(".button-text");

const socialButtons =
    document.querySelectorAll(".social-button");

/* ==========================================================
   PAGE CONFIGURATION
========================================================== */

const DASHBOARD_URL = "./dashboard.html";

/* ==========================================================
   HELPERS
========================================================== */

function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(email.trim());
}

function setFieldError(input, errorElement, message) {
    if (!input || !errorElement) {
        return;
    }

    input.setAttribute("aria-invalid", "true");
    input.classList.add("input-error");

    errorElement.textContent = message;
}

function clearFieldError(input, errorElement) {
    if (!input || !errorElement) {
        return;
    }

    input.removeAttribute("aria-invalid");
    input.classList.remove("input-error");

    errorElement.textContent = "";
}

function showFormMessage(message, type = "error") {
    if (!formMessage) {
        return;
    }

    formMessage.hidden = false;
    formMessage.textContent = message;

    formMessage.classList.remove(
        "form-message-error",
        "form-message-success"
    );

    formMessage.classList.add(
        type === "success"
            ? "form-message-success"
            : "form-message-error"
    );
}

function hideFormMessage() {
    if (!formMessage) {
        return;
    }

    formMessage.hidden = true;
    formMessage.textContent = "";

    formMessage.classList.remove(
        "form-message-error",
        "form-message-success"
    );
}

function redirectToDashboard() {
    /*
     * replace() prevents returning to the login page
     * by pressing the browser Back button.
     */
    window.location.replace(DASHBOARD_URL);
}

/* ==========================================================
   PASSWORD VISIBILITY
========================================================== */

function togglePasswordVisibility() {
    if (!passwordInput || !togglePasswordButton) {
        return;
    }

    const passwordIsHidden =
        passwordInput.type === "password";

    passwordInput.type =
        passwordIsHidden ? "text" : "password";

    togglePasswordButton.setAttribute(
        "aria-label",
        passwordIsHidden
            ? "Hide password"
            : "Show password"
    );

    togglePasswordButton.setAttribute(
        "aria-pressed",
        String(passwordIsHidden)
    );

    const toggleText =
        togglePasswordButton.querySelector(
            ".password-toggle-text"
        );

    if (toggleText) {
        toggleText.textContent =
            passwordIsHidden ? "Hide" : "Show";
    }

    passwordInput.focus();
}

/* ==========================================================
   VALIDATION
========================================================== */

function validateEmail() {
    if (!emailInput || !emailError) {
        return false;
    }

    const email = emailInput.value.trim();

    if (email === "") {
        setFieldError(
            emailInput,
            emailError,
            "Email address is required."
        );

        return false;
    }

    if (!isValidEmail(email)) {
        setFieldError(
            emailInput,
            emailError,
            "Enter a valid email address."
        );

        return false;
    }

    clearFieldError(emailInput, emailError);

    return true;
}

function validatePassword() {
    if (!passwordInput || !passwordError) {
        return false;
    }

    const password = passwordInput.value;

    if (password.trim() === "") {
        setFieldError(
            passwordInput,
            passwordError,
            "Password is required."
        );

        return false;
    }

    if (password.length < 8) {
        setFieldError(
            passwordInput,
            passwordError,
            "Password must contain at least 8 characters."
        );

        return false;
    }

    clearFieldError(passwordInput, passwordError);

    return true;
}

function validateLoginForm() {
    const emailIsValid = validateEmail();
    const passwordIsValid = validatePassword();

    return emailIsValid && passwordIsValid;
}

/* ==========================================================
   LOADING STATE
========================================================== */

function setLoadingState(isLoading) {
    if (!loginButton) {
        return;
    }

    loginButton.disabled = isLoading;

    loginButton.classList.toggle(
        "is-loading",
        isLoading
    );

    loginButton.setAttribute(
        "aria-busy",
        String(isLoading)
    );

    if (buttonText) {
        buttonText.textContent =
            isLoading
                ? "Signing in..."
                : "Continue";
    }

    if (emailInput) {
        emailInput.disabled = isLoading;
    }

    if (passwordInput) {
        passwordInput.disabled = isLoading;
    }

    if (rememberMeInput) {
        rememberMeInput.disabled = isLoading;
    }

    if (togglePasswordButton) {
        togglePasswordButton.disabled = isLoading;
    }

    socialButtons.forEach((button) => {
        button.disabled = isLoading;
    });
}

/* ==========================================================
   LOGIN FORM
========================================================== */

async function handleLoginSubmit(event) {
    event.preventDefault();

    hideFormMessage();

    if (!validateLoginForm()) {
        const firstInvalidField =
            document.querySelector(
                '.auth-form input[aria-invalid="true"]'
            );

        firstInvalidField?.focus();

        return;
    }

    const loginData = {
        email: emailInput.value.trim(),
        password: passwordInput.value,
        rememberMe: Boolean(rememberMeInput?.checked)
    };

    setLoadingState(true);

    try {
        await loginUser(loginData);

        /*
         * Remove the password from the form immediately
         * after successful authentication.
         */
        passwordInput.value = "";

        showFormMessage(
            "Login successful. Opening your workspace...",
            "success"
        );

        window.setTimeout(
            redirectToDashboard,
            700
        );
    } catch (error) {
        console.error("Login error:", error);

        if (error.status === 401) {
            setFieldError(
                passwordInput,
                passwordError,
                "The email address or password is incorrect."
            );

            passwordInput.focus();
        }

        showFormMessage(
            error.message ||
            "Unable to sign in. Please try again."
        );
    } finally {
        /*
         * Do not reset the button during a successful redirect.
         * The page will change after 700 milliseconds.
         */
        if (!hasToken()) {
            setLoadingState(false);
        }
    }
}

/* ==========================================================
   SOCIAL LOGIN
========================================================== */

function handleSocialLogin(event) {
    const provider = event.currentTarget.dataset.provider;

    if (!provider) {
        return;
    }

    const providerName =
        provider.charAt(0).toUpperCase() +
        provider.slice(1);

    showFormMessage(
        `${providerName} authentication is not available yet.`
    );
}

/* ==========================================================
   EXISTING SESSION
========================================================== */

function handleExistingSession() {
    if (hasToken()) {
        redirectToDashboard();
    }
}

/* ==========================================================
   EVENT LISTENERS
========================================================== */

togglePasswordButton?.addEventListener(
    "click",
    togglePasswordVisibility
);

emailInput?.addEventListener(
    "blur",
    validateEmail
);

passwordInput?.addEventListener(
    "blur",
    validatePassword
);

emailInput?.addEventListener("input", () => {
    hideFormMessage();

    if (emailInput.hasAttribute("aria-invalid")) {
        validateEmail();
    }
});

passwordInput?.addEventListener("input", () => {
    hideFormMessage();

    if (passwordInput.hasAttribute("aria-invalid")) {
        validatePassword();
    }
});

loginForm?.addEventListener(
    "submit",
    handleLoginSubmit
);

socialButtons.forEach((button) => {
    button.addEventListener(
        "click",
        handleSocialLogin
    );
});

/* ==========================================================
   INITIALIZATION
========================================================== */

handleExistingSession();