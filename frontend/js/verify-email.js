"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const loadingView = document.getElementById(
        "verificationLoadingView"
    );

    const successView = document.getElementById(
        "verificationSuccessView"
    );

    const errorView = document.getElementById(
        "verificationErrorView"
    );

    const resendButton = document.getElementById(
        "resendVerificationButton"
    );

    const verificationMessage = document.getElementById(
        "verificationMessage"
    );

    const verificationContent = document.getElementById(
        "verificationContent"
    );

    const params = new URLSearchParams(
        window.location.search
    );

    const token = params.get("token");

    const showView = (view) => {
        loadingView.hidden = true;
        successView.hidden = true;
        errorView.hidden = true;

        view.hidden = false;

        verificationContent.focus();
    };

    const setResendLoading = (loading) => {
        resendButton.disabled = loading;

        resendButton.classList.toggle(
            "is-loading",
            loading
        );

        resendButton.setAttribute(
            "aria-busy",
            String(loading)
        );
    };

    const verifyEmail = async () => {
        try {
            /*
             * Temporary frontend simulation.
             *
             * Later replace with:
             *
             * const response = await fetch(
             *     `/api/auth/verify-email?token=${encodeURIComponent(token)}`
             * );
             *
             * if (!response.ok) {
             *     throw new Error("Verification failed");
             * }
             */

            await new Promise((resolve) => {
                window.setTimeout(resolve, 1400);
            });

            if (!token || token === "invalid") {
                throw new Error(
                    "Invalid verification token"
                );
            }

            showView(successView);
        } catch (error) {
            console.error(
                "Email verification failed:",
                error
            );

            showView(errorView);
        }
    };

    resendButton.addEventListener(
        "click",
        async () => {
            verificationMessage.textContent = "";
            verificationMessage.classList.remove(
                "success",
                "error"
            );

            setResendLoading(true);

            try {
                await new Promise((resolve) => {
                    window.setTimeout(resolve, 1000);
                });

                verificationMessage.textContent =
                    "A new verification email has been sent.";

                verificationMessage.classList.add(
                    "success"
                );
            } catch (error) {
                console.error(
                    "Verification resend failed:",
                    error
                );

                verificationMessage.textContent =
                    "Unable to resend the email. Please try again.";

                verificationMessage.classList.add(
                    "error"
                );
            } finally {
                setResendLoading(false);
            }
        }
    );

    verifyEmail();
});