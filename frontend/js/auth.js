"use strict";

/* ==========================================================
   AUTH ELEMENTS
========================================================== */

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const formMessage = document.getElementById("formMessage");

const togglePasswordButton = document.getElementById("togglePassword");
const loginButton = document.getElementById("loginButton");

const buttonText = loginButton?.querySelector(".button-text");
const socialButtons = document.querySelectorAll(".social-button");

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

/* ==========================================================
   PASSWORD VISIBILITY
========================================================== */

function togglePasswordVisibility() {
    if (!passwordInput || !togglePasswordButton) {
        return;
    }

    const passwordIsHidden = passwordInput.type === "password";

    passwordInput.type = passwordIsHidden ? "text" : "password";

    togglePasswordButton.setAttribute(
        "aria-label",
        passwordIsHidden ? "Hide password" : "Show password"
    );

    togglePasswordButton.setAttribute(
        "aria-pressed",
        String(passwordIsHidden)
    );

    const toggleText = togglePasswordButton.querySelector(
        ".password-toggle-text"
    );

    if (toggleText) {
        toggleText.textContent = passwordIsHidden ? "Hide" : "Show";
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
    loginButton.classList.toggle("is-loading", isLoading);

    loginButton.setAttribute(
        "aria-busy",
        String(isLoading)
    );

    if (buttonText) {
        buttonText.textContent = isLoading
            ? "Signing in..."
            : "Continue";
    }

    if (emailInput) {
        emailInput.disabled = isLoading;
    }

    if (passwordInput) {
        passwordInput.disabled = isLoading;
    }

    if (togglePasswordButton) {
        togglePasswordButton.disabled = isLoading;
    }
}

/* ==========================================================
   LOGIN FORM
========================================================== */

async function handleLoginSubmit(event) {
    event.preventDefault();

    hideFormMessage();

    if (!validateLoginForm()) {
        const firstInvalidField = document.querySelector(
            '.auth-form input[aria-invalid="true"]'
        );

        firstInvalidField?.focus();

        return;
    }

    setLoadingState(true);

    const loginData = {
        email: emailInput.value.trim(),
        password: passwordInput.value,
        rememberMe: Boolean(
            document.getElementById("rememberMe")?.checked
        )
    };

    try {
        /*
         * Temporary frontend-only behaviour.
         *
         * Later this section will call the Spring Boot API:
         *
         * const response = await fetch(
         *     "http://localhost:8080/api/auth/login",
         *     {
         *         method: "POST",
         *         headers: {
         *             "Content-Type": "application/json"
         *         },
         *         body: JSON.stringify(loginData)
         *     }
         * );
         */

        await new Promise((resolve) => {
            window.setTimeout(resolve, 1200);
        });

        console.log("Login data:", {
            email: loginData.email,
            rememberMe: loginData.rememberMe
        });

        showFormMessage(
            "Login form validated successfully. Backend connection will be added later.",
            "success"
        );
    } catch (error) {
        console.error("Login error:", error);

        showFormMessage(
            "Unable to sign in. Please try again."
        );
    } finally {
        setLoadingState(false);
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
        provider.charAt(0).toUpperCase() + provider.slice(1);

    showFormMessage(
        `${providerName} login will be connected later.`,
        "success"
    );
}

/* ==========================================================
   EVENT LISTENERS
========================================================== */

togglePasswordButton?.addEventListener(
    "click",
    togglePasswordVisibility
);

emailInput?.addEventListener("blur", validateEmail);
passwordInput?.addEventListener("blur", validatePassword);

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
