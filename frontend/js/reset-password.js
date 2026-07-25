"use strict";

/* =========================================================
   RESET PASSWORD PAGE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const resetPasswordForm = document.getElementById(
        "resetPasswordForm"
    );

    if (!resetPasswordForm) {
        return;
    }

    const resetPasswordView = document.getElementById(
        "resetPasswordView"
    );

    const passwordSuccessView = document.getElementById(
        "passwordSuccessView"
    );

    const newPasswordInput = document.getElementById(
        "newPassword"
    );

    const confirmPasswordInput = document.getElementById(
        "confirmPassword"
    );

    const newPasswordError = document.getElementById(
        "newPasswordError"
    );

    const confirmPasswordError = document.getElementById(
        "confirmPasswordError"
    );

    const passwordMatchMessage = document.getElementById(
        "passwordMatchMessage"
    );

    const toggleNewPassword = document.getElementById(
        "toggleNewPassword"
    );

    const toggleConfirmPassword = document.getElementById(
        "toggleConfirmPassword"
    );

    const resetPasswordButton = document.getElementById(
        "resetPasswordButton"
    );

    const formMessage = document.getElementById(
        "formMessage"
    );

    const strengthLabel = document.getElementById(
        "strengthLabel"
    );

    const strengthBar = document.getElementById(
        "strengthBar"
    );

    const requirementElements = {
        length: document.getElementById(
            "lengthRequirement"
        ),

        uppercase: document.getElementById(
            "uppercaseRequirement"
        ),

        lowercase: document.getElementById(
            "lowercaseRequirement"
        ),

        number: document.getElementById(
            "numberRequirement"
        ),

        special: document.getElementById(
            "specialRequirement"
        )
    };

    /* =====================================================
       PASSWORD REQUIREMENTS
    ===================================================== */

    const getPasswordRequirements = (password) => {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };
    };

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
            icon.textContent = isComplete ? "✓" : "○";
        }
    };

    const updateRequirements = (password) => {
        const requirements =
            getPasswordRequirements(password);

        Object.entries(requirements).forEach(
            ([requirement, isComplete]) => {
                updateRequirementItem(
                    requirementElements[requirement],
                    isComplete
                );
            }
        );

        return requirements;
    };

    const areAllRequirementsMet = (password) => {
        const requirements =
            getPasswordRequirements(password);

        return Object.values(requirements).every(Boolean);
    };

    /* =====================================================
       PASSWORD STRENGTH
    ===================================================== */

    const calculatePasswordStrength = (password) => {
        if (!password) {
            return {
                score: 0,
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
                score: 1,
                label: "Weak",
                className: "weak"
            };
        }

        if (score <= 4) {
            return {
                score: 2,
                label: "Medium",
                className: "medium"
            };
        }

        return {
            score: 3,
            label: "Strong",
            className: "strong"
        };
    };

    const updatePasswordStrength = (password) => {
        const strength =
            calculatePasswordStrength(password);

        strengthLabel.textContent = strength.label;

        strengthBar.className = "strength-bar";

        if (strength.className) {
            strengthBar.classList.add(
                strength.className
            );
        }
    };

    /* =====================================================
       ERROR HANDLING
    ===================================================== */

    const clearInputError = (input, errorElement) => {
        errorElement.textContent = "";

        input.classList.remove("input-error");

        input.removeAttribute("aria-invalid");
    };

    const showInputError = (
        input,
        errorElement,
        message
    ) => {
        errorElement.textContent = message;

        input.classList.add("input-error");

        input.setAttribute(
            "aria-invalid",
            "true"
        );
    };

    const hideFormMessage = () => {
        formMessage.hidden = true;
        formMessage.textContent = "";

        formMessage.classList.remove(
            "success",
            "error"
        );
    };

    const showFormMessage = (message, type) => {
        formMessage.textContent = message;
        formMessage.hidden = false;

        formMessage.classList.remove(
            "success",
            "error"
        );

        formMessage.classList.add(type);
    };

    /* =====================================================
       VALIDATION
    ===================================================== */

    const validateNewPassword = () => {
        const password = newPasswordInput.value;

        clearInputError(
            newPasswordInput,
            newPasswordError
        );

        if (!password) {
            showInputError(
                newPasswordInput,
                newPasswordError,
                "New password is required."
            );

            return false;
        }

        if (!areAllRequirementsMet(password)) {
            showInputError(
                newPasswordInput,
                newPasswordError,
                "Your password must meet all the requirements."
            );

            return false;
        }

        return true;
    };

    const validateConfirmPassword = () => {
        const password = newPasswordInput.value;
        const confirmedPassword =
            confirmPasswordInput.value;

        clearInputError(
            confirmPasswordInput,
            confirmPasswordError
        );

        passwordMatchMessage.textContent = "";

        passwordMatchMessage.classList.remove(
            "success",
            "error"
        );

        if (!confirmedPassword) {
            showInputError(
                confirmPasswordInput,
                confirmPasswordError,
                "Please confirm your new password."
            );

            return false;
        }

        if (password !== confirmedPassword) {
            showInputError(
                confirmPasswordInput,
                confirmPasswordError,
                "Passwords do not match."
            );

            passwordMatchMessage.textContent =
                "Passwords do not match.";

            passwordMatchMessage.classList.add(
                "error"
            );

            return false;
        }

        passwordMatchMessage.textContent =
            "Passwords match.";

        passwordMatchMessage.classList.add(
            "success"
        );

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
        button.addEventListener("click", () => {
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

            const toggleText = button.querySelector(
                ".password-toggle-text"
            );

            if (toggleText) {
                toggleText.textContent =
                    isHidden ? "Hide" : "Show";
            }

            input.focus();
        });
    };

    configurePasswordToggle(
        toggleNewPassword,
        newPasswordInput,
        "new password"
    );

    configurePasswordToggle(
        toggleConfirmPassword,
        confirmPasswordInput,
        "confirmed password"
    );

    /* =====================================================
       LOADING STATE
    ===================================================== */

    const setSubmitLoading = (isLoading) => {
        resetPasswordButton.disabled = isLoading;

        resetPasswordButton.classList.toggle(
            "is-loading",
            isLoading
        );

        resetPasswordButton.setAttribute(
            "aria-busy",
            String(isLoading)
        );
    };

    /* =====================================================
       INPUT EVENTS
    ===================================================== */

    newPasswordInput.addEventListener(
        "input",
        () => {
            const password = newPasswordInput.value;

            hideFormMessage();

            clearInputError(
                newPasswordInput,
                newPasswordError
            );

            updateRequirements(password);
            updatePasswordStrength(password);

            if (confirmPasswordInput.value) {
                validateConfirmPassword();
            }
        }
    );

    newPasswordInput.addEventListener(
        "blur",
        () => {
            if (newPasswordInput.value) {
                validateNewPassword();
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

            passwordMatchMessage.textContent = "";

            if (confirmPasswordInput.value) {
                validateConfirmPassword();
            }
        }
    );

    /* =====================================================
       FORM SUBMISSION
    ===================================================== */

    resetPasswordForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            hideFormMessage();

            const isNewPasswordValid =
                validateNewPassword();

            const isConfirmPasswordValid =
                validateConfirmPassword();

            if (
                !isNewPasswordValid ||
                !isConfirmPasswordValid
            ) {
                if (!isNewPasswordValid) {
                    newPasswordInput.focus();
                } else {
                    confirmPasswordInput.focus();
                }

                return;
            }

            const newPassword =
                newPasswordInput.value;

            setSubmitLoading(true);

            try {
                const token = new URLSearchParams(
                    window.location.search
                ).get("token");

                const response = await fetch("http://localhost:8080/api/auth/reset-password", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        token,
                        newPassword
                    })
                });

                if (!response.ok) {
                    throw new Error("Password reset failed");
                }

                resetPasswordView.hidden = true;
                passwordSuccessView.hidden = false;

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            } catch (error) {
                console.error(
                    "Password reset failed:",
                    error
                );

                showFormMessage(
                    "We couldn't reset your password. The link may have expired.",
                    "error"
                );
            } finally {
                setSubmitLoading(false);
            }
        }
    );

    /* =====================================================
       INITIAL STATE
    ===================================================== */

    updateRequirements("");
    updatePasswordStrength("");
});