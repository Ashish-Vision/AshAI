"use strict";

const ASHAI_API_BASE_URL =
    (window.ASHAI_API_ORIGIN ||
        (["localhost", "127.0.0.1"].includes(window.location.hostname)
            ? `http://${window.location.hostname}:8080`
            : window.location.origin)) + "/api";

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
            if (!token) {
                throw new Error("No token provided");
            }

            const response = await fetch(
                `${ASHAI_API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`
            );

            if (!response.ok) {
                throw new Error("Verification failed");
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
                if (!token) {
                    throw new Error("No token provided");
                }

                const response = await fetch(
                    `${ASHAI_API_BASE_URL}/auth/resend-verification?token=${encodeURIComponent(token)}`,
                    {
                        method: "POST"
                    }
                );

                if (!response.ok) {
                    throw new Error("Verification resend failed");
                }

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
