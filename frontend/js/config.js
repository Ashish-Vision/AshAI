"use strict";

/*
 * Keep the frontend and API on the same origin. In local Docker mode,
 * Nginx forwards /api and OAuth routes to the backend container.
 */
window.ASHAI_API_ORIGIN = window.location.origin;
