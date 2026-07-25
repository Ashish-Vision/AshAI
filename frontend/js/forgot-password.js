"use strict";

const ASHAI_API_BASE_URL =
    (window.ASHAI_API_ORIGIN ||
        (["localhost", "127.0.0.1"].includes(window.location.hostname)
            ? `http://${window.location.hostname}:8080`
            : window.location.origin)) + "/api";

/* =========================================================
   FORGOT PASSWORD PAGE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const forgotPasswordForm = document.getElementById(
        "forgotPasswordForm"
    );

    if (!forgotPasswordForm) {
        return;
    }

    const forgotPasswordView = document.getElementById(
        "forgotPasswordView"
    );

    const checkEmailView = document.getElementById(
        "checkEmailView"
    );

    const emailInput = document.getElementById("email");
    const emailError = document.getElementById("emailError");

    const formMessage = document.getElementById("formMessage");

    const submitButton = document.getElementById(
        "forgotPasswordButton"
    );

    const submittedEmail = document.getElementById(
        "submittedEmail"
    );

    const resendEmailButton = document.getElementById(
        "resendEmailButton"
    );

    const resendMessage = document.getElementById(
        "resendMessage"
    );

    const changeEmailButton = document.getElementById(
        "changeEmailButton"
    );

    let currentEmail = "";
    let resendTimer = null;

    /* =====================================================
       EMAIL VALIDATION
    ===================================================== */

    const isValidEmail = (email) => {
        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        return emailPattern.test(email);
    };

    const clearEmailError = () => {
        emailError.textContent = "";
        emailInput.classList.remove("input-error");
        emailInput.removeAttribute("aria-invalid");
    };

    const showEmailError = (message) => {
        emailError.textContent = message;
        emailInput.classList.add("input-error");

        emailInput.setAttribute(
            "aria-invalid",
            "true"
        );
    };

    const validateEmail = () => {
        const email = emailInput.value.trim();

        clearEmailError();

        if (!email) {
            showEmailError(
                "Email address is required."
            );

            return false;
        }

        if (!isValidEmail(email)) {
            showEmailError(
                "Enter a valid email address."
            );

            return false;
        }

        return true;
    };

    /* =====================================================
       FORM MESSAGE
    ===================================================== */

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
       BUTTON LOADING STATE
    ===================================================== */

    const setSubmitLoading = (isLoading) => {
        submitButton.disabled = isLoading;

        submitButton.classList.toggle(
            "is-loading",
            isLoading
        );

        submitButton.setAttribute(
            "aria-busy",
            String(isLoading)
        );
    };

    const setResendLoading = (isLoading) => {
        resendEmailButton.disabled = isLoading;

        resendEmailButton.classList.toggle(
            "is-loading",
            isLoading
        );

        resendEmailButton.setAttribute(
            "aria-busy",
            String(isLoading)
        );
    };

    /* =====================================================
       CHANGE PAGE VIEW
    ===================================================== */

    const showCheckEmailView = (email) => {
        currentEmail = email;

        submittedEmail.textContent = email;

        forgotPasswordView.hidden = true;
        checkEmailView.hidden = false;

        checkEmailView.focus?.();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const showForgotPasswordView = () => {
        checkEmailView.hidden = true;
        forgotPasswordView.hidden = false;

        resendMessage.textContent = "";

        if (resendTimer) {
            window.clearTimeout(resendTimer);
        }

        window.setTimeout(() => {
            emailInput.focus();
        }, 50);
    };

    /* =====================================================
       EMAIL INPUT EVENTS
    ===================================================== */

    emailInput.addEventListener("input", () => {
        hideFormMessage();

        if (emailError.textContent) {
            clearEmailError();
        }
    });

    emailInput.addEventListener("blur", () => {
        const email = emailInput.value.trim();

        /*
         * Do not show "required" validation when the page
         * first loads or when the untouched field is empty.
         */
        if (!email) {
            return;
        }

        validateEmail();
    });

    /* =====================================================
       FORGOT PASSWORD SUBMISSION
    ===================================================== */

    forgotPasswordForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            hideFormMessage();

            if (!validateEmail()) {
                emailInput.focus();
                return;
            }

            const email = emailInput.value
                .trim()
                .toLowerCase();

            setSubmitLoading(true);

            try {
                const response = await fetch(`${ASHAI_API_BASE_URL}/auth/forgot-password`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email })
                });

                if (!response.ok) {
                    throw new Error("Forgot password request failed");
                }

                showCheckEmailView(email);
            } catch (error) {
                console.error(
                    "Forgot-password request failed:",
                    error
                );

                showFormMessage(
                    "We couldn't send the reset link. Please try again.",
                    "error"
                );
            } finally {
                setSubmitLoading(false);
            }
        }
    );

    /* =====================================================
       RESEND EMAIL
    ===================================================== */

    resendEmailButton.addEventListener(
        "click",
        async () => {
            if (!currentEmail) {
                return;
            }

            resendMessage.textContent = "";
            resendMessage.classList.remove("error");

            setResendLoading(true);

            try {
                const response = await fetch(`${ASHAI_API_BASE_URL}/auth/forgot-password`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: currentEmail
                    })
                });

                if (!response.ok) {
                    throw new Error("Reset email resend failed");
                }

                resendMessage.textContent =
                    "A new reset link has been sent.";

                resendMessage.classList.add("success");

                resendEmailButton.disabled = true;

                if (resendTimer) {
                    window.clearTimeout(resendTimer);
                }

                resendTimer = window.setTimeout(() => {
                    resendEmailButton.disabled = false;
                    resendMessage.textContent = "";
                }, 5000);
            } catch (error) {
                console.error(
                    "Resend request failed:",
                    error
                );

                resendMessage.textContent =
                    "Unable to resend the email. Please try again.";

                resendMessage.classList.add("error");
            } finally {
                setResendLoading(false);
            }
        }
    );

    /* =====================================================
       CHANGE EMAIL
    ===================================================== */

    changeEmailButton.addEventListener(
        "click",
        () => {
            showForgotPasswordView();

            emailInput.select();
        }
    );
});
