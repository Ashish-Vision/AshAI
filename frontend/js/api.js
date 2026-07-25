"use strict";

/* ==========================================================
   API CONFIGURATION
========================================================== */

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
export const BACKEND_ORIGIN =
    window.ASHAI_API_ORIGIN ||
    (LOCAL_HOSTS.has(window.location.hostname)
        ? `http://${window.location.hostname}:8080`
        : window.location.origin);
export const API_BASE_URL = `${BACKEND_ORIGIN}/api`;

const TOKEN_KEY = "ashai_access_token";

const OAUTH_PROVIDERS = new Set(["google", "github"]);

/* ==========================================================
   TOKEN STORAGE
========================================================== */

/**
 * Stores the JWT.
 *
 * rememberMe = true:
 * Token remains after closing the browser.
 *
 * rememberMe = false:
 * Token is removed when the browser session ends.
 */
export function saveToken(token, rememberMe = false) {
    if (!token || typeof token !== "string") {
        throw new Error(
            "A valid authentication token was not received."
        );
    }

    removeToken();

    const storage = rememberMe
        ? window.localStorage
        : window.sessionStorage;

    storage.setItem(TOKEN_KEY, token);
}

/**
 * Returns the JWT from localStorage or sessionStorage.
 */
export function getToken() {
    return (
        window.localStorage.getItem(TOKEN_KEY) ||
        window.sessionStorage.getItem(TOKEN_KEY)
    );
}

/**
 * Removes the JWT from both storage locations.
 */
export function removeToken() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
}

/**
 * Checks whether a token currently exists.
 */
export function hasToken() {
    return Boolean(getToken());
}

export function getOAuthLoginUrl(provider) {
    const normalizedProvider = String(provider)
        .trim()
        .toLowerCase();

    if (!OAUTH_PROVIDERS.has(normalizedProvider)) {
        throw new Error("Unsupported OAuth provider.");
    }

    return `${BACKEND_ORIGIN}/oauth2/authorization/${normalizedProvider}`;
}

export async function getOAuthProviders() {
    return apiRequest("/auth/oauth/providers", {
        method: "GET",
        authenticated: false
    });
}

/* ==========================================================
   RESPONSE HANDLING
========================================================== */

/**
 * Safely reads a backend response.
 *
 * Some responses may contain JSON, while others may contain
 * plain text or no body at all.
 */
async function parseResponse(response) {
    const contentType =
        response.headers.get("content-type") || "";

    if (response.status === 204) {
        return null;
    }

    if (contentType.includes("application/json")) {
        return response.json();
    }

    const text = await response.text();

    return text
        ? { message: text }
        : null;
}

/**
 * Extracts a useful error message from different backend
 * error-response formats.
 */
function getErrorMessage(data, status) {
    if (typeof data === "string" && data.trim()) {
        return data;
    }

    if (data?.message) {
        return data.message;
    }

    if (data?.error) {
        return data.error;
    }

    if (typeof data?.details === "string") {
        return data.details;
    }

    if (
        data?.details &&
        typeof data.details === "object"
    ) {
        return Object.values(data.details)
            .filter((message) => {
                return (
                    typeof message === "string" &&
                    message.trim()
                );
            })
            .join(" ");
    }

    if (data?.errors && Array.isArray(data.errors)) {
        return data.errors
            .map((error) => {
                return (
                    error.message ||
                    error.defaultMessage
                );
            })
            .filter(Boolean)
            .join(" ");
    }

    switch (status) {
        case 400:
            return "The submitted information is invalid.";

        case 401:
            return "Invalid email address or password.";

        case 403:
            return "You do not have permission to perform this action.";

        case 404:
            return "The requested resource was not found.";

        case 409:
            return "An account with this information already exists.";

        case 429:
            return "Too many requests. Please wait and try again.";

        case 500:
            return "The server encountered an error. Please try again.";

        default:
            return "The request could not be completed.";
    }
}

/* ==========================================================
   API REQUEST
========================================================== */

/**
 * Sends an HTTP request to the Spring Boot backend.
 */
export async function apiRequest(
    endpoint,
    options = {}
) {
    const {
        authenticated = true,
        headers: customHeaders = {},
        ...fetchOptions
    } = options;

    const headers = new Headers(customHeaders);

    /*
     * Do not automatically set JSON content type for FormData.
     * The browser must set the multipart boundary itself.
     */
    if (
        fetchOptions.body &&
        !(fetchOptions.body instanceof FormData) &&
        !headers.has("Content-Type")
    ) {
        headers.set(
            "Content-Type",
            "application/json"
        );
    }

    if (authenticated) {
        const token = getToken();

        if (token) {
            headers.set(
                "Authorization",
                `Bearer ${token}`
            );
        }
    }

    let response;

    try {
        response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...fetchOptions,
                headers
            }
        );
    } catch (error) {
        console.error(
            "Network request failed:",
            error
        );

        throw new Error(
            "Unable to connect to the AshAI server. Make sure the backend is running."
        );
    }

    const data = await parseResponse(response);

    if (!response.ok) {
        /*
         * An expired or invalid token should not remain stored.
         */
        if (
            (response.status === 401 ||
                response.status === 403) &&
            authenticated
        ) {
            removeToken();
        }

        const error = new Error(
            getErrorMessage(
                data,
                response.status
            )
        );

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
}

/* ==========================================================
   AUTHENTICATION API
========================================================== */

/**
 * Registers a new AshAI user.
 */
export async function registerUser({
    fullName,
    email,
    password
}) {
    return apiRequest("/auth/register", {
        method: "POST",
        authenticated: false,
        body: JSON.stringify({
            fullName,
            email,
            password
        })
    });
}

/**
 * Logs in an existing AshAI user.
 */
export async function loginUser({
    email,
    password,
    rememberMe = false
}) {
    const response = await apiRequest(
        "/auth/login",
        {
            method: "POST",
            authenticated: false,
            body: JSON.stringify({
                email,
                password
            })
        }
    );

    /*
     * Supports common token field names.
     */
    const token =
        response?.token ||
        response?.accessToken ||
        response?.jwt;

    if (!token) {
        throw new Error(
            "Login succeeded, but the server did not return an authentication token."
        );
    }

    saveToken(token, rememberMe);

    return response;
}

/**
 * Loads the currently authenticated user.
 */
export async function getCurrentUser() {
    return apiRequest("/profile", {
        method: "GET"
    });
}

/**
 * Logs out the current user locally.
 */
export function logoutUser() {
    removeToken();
}
