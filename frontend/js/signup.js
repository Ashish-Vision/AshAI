"use strict";

import {
    getOAuthLoginUrl,
    getOAuthProviders,
    registerUser,
    resendVerificationEmail
} from "./api.js";

/* =========================================================
   SIGNUP PAGE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");

    if (!signupForm) {
        return;
    }

    const fullNameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("signupEmail");

    const passwordInput = document.getElementById(
        "signupPassword"
    );

    const confirmPasswordInput = document.getElementById(
        "signupConfirmPassword"
    );

    const termsInput = document.getElementById("acceptTerms");

    const fullNameError = document.getElementById(
        "fullNameError"
    );

    const emailError = document.getElementById(
        "signupEmailError"
    );

    const passwordError = document.getElementById(
        "signupPasswordError"
    );

    const confirmPasswordError = document.getElementById(
        "signupConfirmPasswordError"
    );

    const termsError = document.getElementById("termsError");

    const matchMessage = document.getElementById(
        "signupMatchMessage"
    );

    const strengthLabel = document.getElementById(
        "signupStrengthLabel"
    );

    const strengthBar = document.getElementById(
        "signupStrengthBar"
    );

    const signupButton = document.getElementById(
        "signupButton"
    );

    const togglePasswordButton = document.getElementById(
        "toggleSignupPassword"
    );

    const toggleConfirmButton = document.getElementById(
        "toggleSignupConfirmPassword"
    );

    const formMessage = document.getElementById(
        "formMessage"
    );

    const signupView = document.getElementById("signupView");
    const signupSuccessView = document.getElementById("signupSuccessView");
    const submittedEmail = document.getElementById("signupSubmittedEmail");
    const resendButton = document.getElementById("signupResendButton");
    const resendMessage = document.getElementById("signupResendMessage");
    let registeredEmail = "";

    const googleButton = document.getElementById(
        "signupGoogleButton"
    );

    const githubButton = document.getElementById(
        "signupGithubButton"
    );

    const requirementElements = {
        length: document.getElementById(
            "signupLengthRequirement"
        ),

        uppercase: document.getElementById(
            "signupUppercaseRequirement"
        ),

        lowercase: document.getElementById(
            "signupLowercaseRequirement"
        ),

        number: document.getElementById(
            "signupNumberRequirement"
        ),

        special: document.getElementById(
            "signupSpecialRequirement"
        )
    };

    /* =====================================================
       GENERAL HELPERS
    ===================================================== */

    const normalizeName = (name) => {
        return name
            .trim()
            .replace(/\s+/g, " ");
    };

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    };

    const getPasswordRequirements = (password) => {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };
    };

    const areAllRequirementsMet = (password) => {
        return Object.values(
            getPasswordRequirements(password)
        ).every(Boolean);
    };

    const clearInputError = (
        input,
        errorElement
    ) => {
        if (!input || !errorElement) {
            return;
        }

        errorElement.textContent = "";
        input.classList.remove("input-error");
        input.removeAttribute("aria-invalid");
    };

    const showInputError = (
        input,
        errorElement,
        message
    ) => {
        if (!input || !errorElement) {
            return;
        }

        errorElement.textContent = message;
        input.classList.add("input-error");

        input.setAttribute(
            "aria-invalid",
            "true"
        );
    };

    const hideFormMessage = () => {
        if (!formMessage) {
            return;
        }

        formMessage.hidden = true;
        formMessage.textContent = "";

        formMessage.classList.remove(
            "success",
            "error"
        );
    };

    const showFormMessage = (
        message,
        type
    ) => {
        if (!formMessage) {
            return;
        }

        formMessage.textContent = message;
        formMessage.hidden = false;

        formMessage.classList.remove(
            "success",
            "error"
        );

        formMessage.classList.add(type);
    };

    /* =====================================================
       NAME VALIDATION
    ===================================================== */

    const validateFullName = () => {
        const name = normalizeName(
            fullNameInput.value
        );

        clearInputError(
            fullNameInput,
            fullNameError
        );

        if (!name) {
            showInputError(
                fullNameInput,
                fullNameError,
                "Full name is required."
            );

            return false;
        }

        if (name.length < 2) {
            showInputError(
                fullNameInput,
                fullNameError,
                "Full name must contain at least 2 characters."
            );

            return false;
        }

        if (name.length > 60) {
            showInputError(
                fullNameInput,
                fullNameError,
                "Full name cannot exceed 60 characters."
            );

            return false;
        }

        if (!/^[\p{L}\p{M}' -]+$/u.test(name)) {
            showInputError(
                fullNameInput,
                fullNameError,
                "Full name can contain letters, spaces, apostrophes and hyphens only."
            );

            return false;
        }

        fullNameInput.value = name;

        return true;
    };

    /* =====================================================
       EMAIL VALIDATION
    ===================================================== */

    const validateEmail = () => {
        const email = emailInput.value
            .trim()
            .toLowerCase();

        clearInputError(
            emailInput,
            emailError
        );

        if (!email) {
            showInputError(
                emailInput,
                emailError,
                "Email address is required."
            );

            return false;
        }

        if (!isValidEmail(email)) {
            showInputError(
                emailInput,
                emailError,
                "Enter a valid email address."
            );

            return false;
        }

        emailInput.value = email;

        return true;
    };

    /* =====================================================
       PASSWORD REQUIREMENTS
    ===================================================== */

    const updateRequirementItem = (
        element,
        isComplete
    ) => {
        if (!element) {
            return;
        }

        const icon = element.querySelector(
            ".requirement-icon"
        );

        element.classList.toggle(
            "completed",
            isComplete
        );

        if (icon) {
            icon.textContent = isComplete
                ? "✓"
                : "○";
        }
    };

    const updateRequirements = (password) => {
        const requirements =
            getPasswordRequirements(password);

        Object.entries(requirements).forEach(
            ([name, completed]) => {
                updateRequirementItem(
                    requirementElements[name],
                    completed
                );
            }
        );
    };

    /* =====================================================
       PASSWORD STRENGTH
    ===================================================== */

    const calculateStrength = (password) => {
        if (!password) {
            return {
                label: "Not entered",
                className: ""
            };
        }

        const requirements =
            getPasswordRequirements(password);

        let score = Object.values(requirements)
            .filter(Boolean)
            .length;

        if (password.length >= 12) {
            score += 1;
        }

        if (score <= 2) {
            return {
                label: "Weak",
                className: "weak"
            };
        }

        if (score <= 4) {
            return {
                label: "Medium",
                className: "medium"
            };
        }

        return {
            label: "Strong",
            className: "strong"
        };
    };

    const updateStrength = (password) => {
        if (!strengthLabel || !strengthBar) {
            return;
        }

        const strength =
            calculateStrength(password);

        strengthLabel.textContent =
            strength.label;

        strengthLabel.className = "";
        strengthBar.className = "strength-bar";

        if (strength.className) {
            strengthLabel.classList.add(
                strength.className
            );

            strengthBar.classList.add(
                strength.className
            );
        }
    };

    const validatePassword = () => {
        const password = passwordInput.value;

        clearInputError(
            passwordInput,
            passwordError
        );

        if (!password) {
            showInputError(
                passwordInput,
                passwordError,
                "Password is required."
            );

            return false;
        }

        if (!areAllRequirementsMet(password)) {
            showInputError(
                passwordInput,
                passwordError,
                "Your password must meet all requirements."
            );

            return false;
        }

        return true;
    };

    /* =====================================================
       CONFIRM PASSWORD VALIDATION
    ===================================================== */

    const validateConfirmPassword = () => {
        const password = passwordInput.value;

        const confirmedPassword =
            confirmPasswordInput.value;

        clearInputError(
            confirmPasswordInput,
            confirmPasswordError
        );

        if (matchMessage) {
            matchMessage.textContent = "";

            matchMessage.classList.remove(
                "success",
                "error"
            );
        }

        if (!confirmedPassword) {
            showInputError(
                confirmPasswordInput,
                confirmPasswordError,
                "Please confirm your password."
            );

            return false;
        }

        if (password !== confirmedPassword) {
            showInputError(
                confirmPasswordInput,
                confirmPasswordError,
                "Passwords do not match."
            );

            if (matchMessage) {
                matchMessage.textContent =
                    "Passwords do not match.";

                matchMessage.classList.add(
                    "error"
                );
            }

            return false;
        }

        if (matchMessage) {
            matchMessage.textContent =
                "Passwords match.";

            matchMessage.classList.add(
                "success"
            );
        }

        return true;
    };

    /* =====================================================
       TERMS VALIDATION
    ===================================================== */

    const validateTerms = () => {
        if (termsError) {
            termsError.textContent = "";
        }

        if (!termsInput.checked) {
            if (termsError) {
                termsError.textContent =
                    "Please accept the Terms of Service and Privacy Policy.";
            }

            return false;
        }

        return true;
    };

    /* =====================================================
       PASSWORD VISIBILITY
    ===================================================== */

    const configurePasswordToggle = (
        button,
        input,
        description
    ) => {
        if (!button || !input) {
            return;
        }

        button.addEventListener(
            "click",
            () => {
                const isHidden =
                    input.type === "password";

                input.type = isHidden
                    ? "text"
                    : "password";

                button.setAttribute(
                    "aria-pressed",
                    String(isHidden)
                );

                button.setAttribute(
                    "aria-label",
                    `${isHidden ? "Hide" : "Show"} ${description}`
                );

                const text = button.querySelector(
                    ".password-toggle-text"
                );

                if (text) {
                    text.textContent = isHidden
                        ? "Hide"
                        : "Show";
                }

                input.focus();
            }
        );
    };

    configurePasswordToggle(
        togglePasswordButton,
        passwordInput,
        "password"
    );

    configurePasswordToggle(
        toggleConfirmButton,
        confirmPasswordInput,
        "confirmed password"
    );

    /* =====================================================
       LOADING STATE
    ===================================================== */

    const setSignupLoading = (loading) => {
        signupButton.disabled = loading;

        signupButton.classList.toggle(
            "is-loading",
            loading
        );

        signupButton.setAttribute(
            "aria-busy",
            String(loading)
        );
    };

    /* =====================================================
       INPUT EVENTS
    ===================================================== */

    fullNameInput.addEventListener(
        "input",
        () => {
            hideFormMessage();

            if (fullNameError.textContent) {
                clearInputError(
                    fullNameInput,
                    fullNameError
                );
            }
        }
    );

    fullNameInput.addEventListener(
        "blur",
        () => {
            if (fullNameInput.value.trim()) {
                validateFullName();
            }
        }
    );

    emailInput.addEventListener(
        "input",
        () => {
            hideFormMessage();

            if (emailError.textContent) {
                clearInputError(
                    emailInput,
                    emailError
                );
            }
        }
    );

    emailInput.addEventListener(
        "blur",
        () => {
            if (emailInput.value.trim()) {
                validateEmail();
            }
        }
    );

    passwordInput.addEventListener(
        "input",
        () => {
            const password =
                passwordInput.value;

            hideFormMessage();

            clearInputError(
                passwordInput,
                passwordError
            );

            updateRequirements(password);
            updateStrength(password);

            if (confirmPasswordInput.value) {
                validateConfirmPassword();
            }
        }
    );

    passwordInput.addEventListener(
        "blur",
        () => {
            if (passwordInput.value) {
                validatePassword();
            }
        }
    );

    confirmPasswordInput.addEventListener(
        "input",
        () => {
            hideFormMessage();

            clearInputError(
                confirmPasswordInput,
                confirmPasswordError
            );

            if (matchMessage) {
                matchMessage.textContent = "";

                matchMessage.classList.remove(
                    "success",
                    "error"
                );
            }

            if (confirmPasswordInput.value) {
                validateConfirmPassword();
            }
        }
    );

    termsInput.addEventListener(
        "change",
        () => {
            if (termsError) {
                termsError.textContent = "";
            }
        }
    );

    /* =====================================================
       FORM SUBMISSION
    ===================================================== */

    signupForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            hideFormMessage();

            const nameValid =
                validateFullName();

            const emailValid =
                validateEmail();

            const passwordValid =
                validatePassword();

            const confirmationValid =
                validateConfirmPassword();

            const termsValid =
                validateTerms();

            if (
                !nameValid ||
                !emailValid ||
                !passwordValid ||
                !confirmationValid ||
                !termsValid
            ) {
                const firstInvalidInput =
                    signupForm.querySelector(
                        '[aria-invalid="true"]'
                    );

                if (firstInvalidInput) {
                    firstInvalidInput.focus();
                } else if (!termsValid) {
                    termsInput.focus();
                }

                return;
            }

            const signupData = {
                fullName: normalizeName(
                    fullNameInput.value
                ),

                email: emailInput.value
                    .trim()
                    .toLowerCase(),

                password: passwordInput.value
            };

            setSignupLoading(true);

            try {
                const registeredUser = await registerUser(signupData);
                registeredEmail = signupData.email;

                passwordInput.value = "";
                confirmPasswordInput.value = "";

                updateRequirements("");
                updateStrength("");

                if (matchMessage) {
                    matchMessage.textContent = "";
                    matchMessage.className = "";
                }

                if (registeredUser?.verified) {
                    showFormMessage(
                        "Personal account created. Redirecting to sign in...",
                        "success"
                    );
                    window.setTimeout(() => {
                        window.location.replace("./login.html");
                    }, 900);
                } else {
                    if (submittedEmail) submittedEmail.textContent = registeredEmail;
                    if (signupView) signupView.hidden = true;
                    if (signupSuccessView) {
                        signupSuccessView.hidden = false;
                        signupSuccessView.focus();
                    }
                }
            } catch (error) {
                console.error(
                    "Signup request failed:",
                    error
                );

                if (error.status === 409) {
                    showInputError(
                        emailInput,
                        emailError,
                        "An account with this email address already exists."
                    );

                    emailInput.focus();
                }

                showFormMessage(
                    error.message ||
                    "We couldn't create your account. Please try again.",
                    "error"
                );
            } finally {
                setSignupLoading(false);
            }
        }
    );

    resendButton?.addEventListener("click", async () => {
        if (!registeredEmail) return;

        resendButton.disabled = true;
        resendButton.classList.add("is-loading");
        if (resendMessage) {
            resendMessage.textContent = "";
            resendMessage.className = "resend-message";
        }

        try {
            await resendVerificationEmail(registeredEmail);
            if (resendMessage) {
                resendMessage.textContent = "A new verification email has been sent.";
                resendMessage.classList.add("success");
            }
        } catch (error) {
            if (resendMessage) {
                resendMessage.textContent = error.message || "Unable to resend the email.";
                resendMessage.classList.add("error");
            }
        } finally {
            resendButton.disabled = false;
            resendButton.classList.remove("is-loading");
        }
    });

    /* =====================================================
       SOCIAL SIGNUP
    ===================================================== */

    let oauthProviders = { google: false, github: false };

    const startSocialLogin = (provider) => {
        if (!oauthProviders[provider]) {
            showFormMessage(
                `${provider === "google" ? "Google" : "GitHub"} sign-up is not configured yet. Add the provider credentials to the backend and restart it.`,
                "error"
            );
            return;
        }
        window.location.assign(getOAuthLoginUrl(provider));
    };

    if (googleButton) {
        googleButton.addEventListener(
            "click",
            () => startSocialLogin("google")
        );
    }

    if (githubButton) {
        githubButton.addEventListener(
            "click",
            () => startSocialLogin("github")
        );
    }

    getOAuthProviders()
        .then((providers) => {
            oauthProviders = providers;
            [
                [googleButton, "google"],
                [githubButton, "github"]
            ].forEach(([button, provider]) => {
                if (!button) return;
                const available = Boolean(providers[provider]);
                button.setAttribute("aria-disabled", String(!available));
                button.title = available
                    ? `Continue with ${provider}`
                    : `${provider} sign-up requires backend OAuth credentials`;
                button.classList.toggle("is-unavailable", !available);
            });
        })
        .catch((error) => {
            console.warn("Could not check OAuth availability:", error);
        });

    /* =====================================================
       INITIAL STATE
    ===================================================== */

    updateRequirements("");
    updateStrength("");
});
