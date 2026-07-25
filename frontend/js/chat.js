"use strict";

const ASHAI_BACKEND_ORIGIN =
    window.ASHAI_API_ORIGIN ||
    (["localhost", "127.0.0.1"].includes(window.location.hostname)
        ? `http://${window.location.hostname}:8080`
        : window.location.origin);
const ASHAI_API_BASE_URL = `${ASHAI_BACKEND_ORIGIN}/api`;

document.addEventListener("DOMContentLoaded", () => {
    const getAccessToken = () => {
        return (
            localStorage.getItem("ashai_access_token") ||
            sessionStorage.getItem("ashai_access_token")
        );
    };

    const redirectToLogin = () => {
        localStorage.removeItem("ashai_access_token");
        sessionStorage.removeItem("ashai_access_token");
        window.location.replace("./login.html");
    };

    if (!getAccessToken()) {
        redirectToLogin();
        return;
    }

    /*
    =========================================================
    ELEMENTS
    =========================================================
    */

    const composer = document.querySelector(".chat-composer");

    const promptInput = document.getElementById(
        "chatPrompt"
    );

    const sendButton = document.querySelector(
        ".send-message-button"
    );

    const newChatButton = document.querySelector(
        ".new-chat-button"
    );

    const welcomeSection = document.querySelector(
        ".welcome-section"
    );

    const workspace = document.getElementById(
        "mainWorkspace"
    );

    const promptCards = document.querySelectorAll(
        ".prompt-card"
    );

    if (
        !composer ||
        !promptInput ||
        !sendButton ||
        !welcomeSection ||
        !workspace
    ) {
        console.error(
            "AshAI chat could not start because required elements are missing."
        );

        return;
    }

    /*
    =========================================================
    PROMPT CARD TEXT
    =========================================================
    */

    const promptTexts = [
        "Summarize this document and list the key points.",
        "Generate code for the following problem:",
        "Explain this concept step by step:",
        "Search my workspace for information about:"
    ];

    /*
    =========================================================
    CHAT STATE
    =========================================================
    */

    let conversationArea = null;
    let activeStreamTimer = null;
    let isGenerating = false;

    /*
    =========================================================
    SEND AND STOP ICONS
    =========================================================
    */

    const sendIcon = `
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            <path d="M22 2L11 13"></path>
            <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
        </svg>
    `;

    const stopIcon = `
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >
            <rect
                x="7"
                y="7"
                width="10"
                height="10"
                rx="2"
            ></rect>
        </svg>
    `;

    /*
    =========================================================
    TEXTAREA RESIZE
    =========================================================
    */

    const resizeTextarea = () => {
        promptInput.style.height = "auto";

        const nextHeight = Math.min(
            promptInput.scrollHeight,
            180
        );

        promptInput.style.height = `${nextHeight}px`;
    };

    /*
    =========================================================
    SEND BUTTON STATE
    =========================================================
    */

    const updateSendButton = () => {
        /*
         * While generating, the button must remain enabled
         * so the user can click it to stop the response.
         */
        if (isGenerating) {
            sendButton.disabled = false;

            sendButton.classList.remove(
                "is-disabled"
            );

            return;
        }

        const hasMessage =
            promptInput.value.trim().length > 0;

        sendButton.disabled = !hasMessage;

        sendButton.classList.toggle(
            "is-disabled",
            !hasMessage
        );
    };

    /*
    =========================================================
    GENERATING STATE
    =========================================================
    */

    const updateGeneratingState = () => {
        sendButton.classList.toggle(
            "is-generating",
            isGenerating
        );

        sendButton.setAttribute(
            "aria-label",
            isGenerating
                ? "Stop generating"
                : "Send message"
        );

        sendButton.setAttribute(
            "title",
            isGenerating
                ? "Stop generating"
                : "Send message"
        );

        sendButton.innerHTML = isGenerating
            ? stopIcon
            : sendIcon;

        updateSendButton();
    };

    /*
    =========================================================
    CONVERSATION AREA
    =========================================================
    */

    const createConversationArea = () => {
        if (conversationArea) {
            return conversationArea;
        }

        conversationArea =
            document.createElement("section");

        conversationArea.className =
            "conversation-area";

        conversationArea.setAttribute(
            "aria-label",
            "Conversation"
        );

        conversationArea.setAttribute(
            "aria-live",
            "polite"
        );

        const composerSection =
            document.querySelector(
                ".chat-composer-section"
            );

        if (composerSection) {
            workspace.insertBefore(
                conversationArea,
                composerSection
            );
        } else {
            workspace.appendChild(
                conversationArea
            );
        }

        return conversationArea;
    };

    /*
    =========================================================
    CREATE MESSAGE
    =========================================================
    */
    /*
 =========================================================
 MARKDOWN RENDERING
 =========================================================
 */

    const decorateCodeBlocks = (container) => {
        if (!container) {
            return;
        }

        if (localStorage.getItem("ashai_code_formatting") === "false") {
            return;
        }

        container.querySelectorAll("pre").forEach((pre) => {
            if (
                pre.parentElement?.classList.contains(
                    "code-block-wrapper"
                )
            ) {
                return;
            }

            const code = pre.querySelector("code");

            const languageClass = [
                ...(code?.classList ?? [])
            ].find((className) =>
                className.startsWith("language-")
            );

            const language = languageClass
                ? languageClass.replace("language-", "")
                : "code";

            const wrapper =
                document.createElement("div");

            wrapper.className =
                "code-block-wrapper";

            const toolbar =
                document.createElement("div");

            toolbar.className =
                "code-block-toolbar";

            const languageLabel =
                document.createElement("span");

            languageLabel.className =
                "code-block-language";

            languageLabel.textContent =
                language;

            const copyCodeButton =
                document.createElement("button");

            copyCodeButton.type = "button";

            copyCodeButton.className =
                "copy-code-button";

            copyCodeButton.setAttribute(
                "aria-label",
                "Copy code"
            );

            copyCodeButton.innerHTML = `
                <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    <rect
                        x="9"
                        y="9"
                        width="11"
                        height="11"
                        rx="2"
                    ></rect>

                    <path
                        d="M5 15H4a2 2 0 0 1-2-2V4
                           a2 2 0 0 1 2-2h9
                           a2 2 0 0 1 2 2v1"
                    ></path>
                </svg>

                <span>Copy code</span>
            `;

            toolbar.append(
                languageLabel,
                copyCodeButton
            );

            pre.parentNode.insertBefore(
                wrapper,
                pre
            );

            wrapper.append(
                toolbar,
                pre
            );
        });
    };

    const renderMarkdown = (
        element,
        markdownText
    ) => {
        if (!element) {
            return;
        }

        if (
            typeof window.marked === "undefined" ||
            typeof window.DOMPurify === "undefined"
        ) {
            element.textContent = markdownText;
            return;
        }

        const html = window.marked.parse(
            markdownText,
            {
                breaks: true,
                gfm: true
            }
        );

        element.innerHTML =
            window.DOMPurify.sanitize(html);

        decorateCodeBlocks(element);
    };

    const createMessage = (type, text) => {
        const message =
            document.createElement("article");

        message.className =
            `chat-message ${type} message-enter`;

        const avatar =
            document.createElement("div");

        avatar.className =
            "chat-message-avatar";

        avatar.setAttribute(
            "aria-hidden",
            "true"
        );

        if (type === "user") {
            avatar.textContent = "AM";
        } else {
            avatar.innerHTML = `
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z"
                        fill="currentColor"
                    ></path>
                </svg>
            `;
        }

        const content =
            document.createElement("div");

        content.className =
            "chat-message-content";

        const header =
            document.createElement("div");

        header.className =
            "message-header";

        const label =
            document.createElement("strong");

        label.textContent =
            type === "user"
                ? "You"
                : "AshAI";

        const time =
            document.createElement("span");

        time.className =
            "message-time";

        time.textContent =
            new Date().toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        const paragraph =
            document.createElement("p");

        paragraph.textContent = text;

        header.append(
            label,
            time
        );

        content.append(
            header,
            paragraph
        );

        /*
         * Only assistant messages receive
         * the Copy action button.
         */
        if (type === "assistant") {
            const actions =
                document.createElement("div");

            actions.className =
                "message-actions";

            const copyButton =
                document.createElement("button");

            copyButton.type = "button";

            copyButton.className =
                "message-action-button";

            copyButton.setAttribute(
                "aria-label",
                "Copy AshAI response"
            );

            copyButton.innerHTML = `
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                >
                    <rect
                        x="9"
                        y="9"
                        width="11"
                        height="11"
                        rx="2"
                    ></rect>

                    <path
                        d="M5 15H4a2 2 0 0 1-2-2V4
                           a2 2 0 0 1 2-2h9
                           a2 2 0 0 1 2 2v1"
                    ></path>
                </svg>

                <span>Copy</span>
            `;

            actions.appendChild(
                copyButton
            );

            const saveButton =
                document.createElement("button");

            saveButton.type = "button";
            saveButton.className =
                "message-action-button save-response-button";
            saveButton.setAttribute(
                "aria-label",
                "Save AshAI response"
            );
            saveButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" aria-hidden="true">
                    <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"></path>
                </svg>
                <span>Save</span>
            `;
            actions.appendChild(saveButton);

            content.appendChild(
                actions
            );
        }

        message.append(
            avatar,
            content
        );

        return message;
    };

    /*
    =========================================================
    SCROLL TO LATEST MESSAGE
    =========================================================
    */

    const scrollToLatestMessage = () => {
        window.requestAnimationFrame(() => {
            conversationArea
                ?.lastElementChild
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "end"
                });
        });
    };

    /*
    =========================================================
    STOP GENERATING
    =========================================================
    */

    const stopGenerating = () => {
        if (!isGenerating) {
            return;
        }

        isGenerating = false;

        if (activeStreamTimer !== null) {
            window.clearTimeout(
                activeStreamTimer
            );

            activeStreamTimer = null;
        }

        const activeMessage =
            conversationArea?.querySelector(
                ".chat-message.is-streaming, .chat-message.is-typing"
            );

        if (activeMessage) {
            activeMessage.classList.remove(
                "is-streaming",
                "is-typing"
            );

            const paragraph =
                activeMessage.querySelector("p");

            /*
             * This happens when the response is stopped
             * while only the typing dots are visible.
             */
            if (
                paragraph &&
                !paragraph.textContent.trim()
            ) {
                paragraph.textContent =
                    "Response stopped.";
            }
        }

        updateGeneratingState();
        scrollToLatestMessage();
    };

    /*
    =========================================================
    TEMPORARY STREAMING RESPONSE
    =========================================================
    */

    const showTemporaryResponse = async (userPrompt = "") => {
        const area =
            createConversationArea();

        const typingMessage =
            createMessage(
                "assistant",
                ""
            );

        const paragraph =
            typingMessage.querySelector("p");

        if (!paragraph) {
            return;
        }

        paragraph.innerHTML = `
            <span
                class="typing-indicator"
                aria-label="AshAI is typing"
            >
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </span>
        `;

        typingMessage.classList.add(
            "is-typing"
        );

        area.appendChild(
            typingMessage
        );

        isGenerating = true;

        updateGeneratingState();
        scrollToLatestMessage();

        let responseText = "";

        try {
            const token = localStorage.getItem("ashai_access_token") || sessionStorage.getItem("ashai_access_token");
            const headers = { "Content-Type": "application/json" };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const modelSelectorBtn = document.querySelector(".model-selector");
            const selectedModel = modelSelectorBtn ? modelSelectorBtn.textContent.trim() : "AshAI Standard";

            const res = await fetch(`${ASHAI_API_BASE_URL}/chat`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    message: userPrompt || "Hello",
                    conversationId: window.activeConversationId || null,
                    model: selectedModel,
                    attachmentName: pendingAttachment?.name || null,
                    attachmentMimeType: pendingAttachment?.mimeType || null,
                    attachmentData: pendingAttachment?.data || null
                })
            });

            if (res.ok) {
                const data = await res.json();
                responseText = data.reply;
                pendingAttachment = null;
                if (fileAttachInput) fileAttachInput.value = "";
                if (cameraCaptureInput) cameraCaptureInput.value = "";
                if (attachmentStatus) attachmentStatus.textContent = "";
                if (data.conversationId) {
                    window.activeConversationId = data.conversationId;
                }
            } else if (res.status === 401 || res.status === 403) {
                redirectToLogin();
                return;
            } else {
                responseText = "Sorry, I encountered an issue reaching the backend server. Please ensure you are logged in and the server is running.";
            }
        } catch (err) {
            console.warn("Could not connect to backend AI server, using client fallback:", err);
            responseText = "AshAI could not reach the AI service. Check your connection and try again.";
        }

        if (!isGenerating) {
            return;
        }

        typingMessage.classList.remove(
            "is-typing"
        );

        typingMessage.classList.add(
            "is-streaming"
        );

        paragraph.textContent = "";

        let currentIndex = 0;

        const streamResponse = () => {
            if (!isGenerating) {
                typingMessage.classList.remove(
                    "is-streaming"
                );

                activeStreamTimer = null;

                updateGeneratingState();

                return;
            }

            if (
                currentIndex >=
                responseText.length
            ) {
                typingMessage.classList.remove(
                    "is-streaming"
                );

                renderMarkdown(
                    paragraph,
                    responseText
                );

                isGenerating = false;
                activeStreamTimer = null;

                updateGeneratingState();
                scrollToLatestMessage();
                loadRecentChats();

                return;
            }

            paragraph.textContent +=
                responseText[currentIndex];

            currentIndex += 1;

            scrollToLatestMessage();

            activeStreamTimer =
                window.setTimeout(
                    streamResponse,
                    20
                );
        };

        streamResponse();
    };

    /*
    =========================================================
    SEND MESSAGE
    =========================================================
    */

    const sendMessage = () => {
        /*
         * Prevent another message while AshAI
         * is still generating a response.
         */
        if (isGenerating) {
            return;
        }

        const text =
            promptInput.value.trim();

        if (!text) {
            promptInput.focus();
            return;
        }

        welcomeSection.hidden = true;

        const area =
            createConversationArea();

        const userMessage =
            createMessage(
                "user",
                text
            );

        area.appendChild(
            userMessage
        );

        promptInput.value = "";

        resizeTextarea();
        updateSendButton();
        scrollToLatestMessage();

        showTemporaryResponse(text);

        promptInput.focus();
    };

    /*
    =========================================================
    INPUT EVENT
    =========================================================
    */

    promptInput.addEventListener(
        "input",
        () => {
            resizeTextarea();
            updateSendButton();
        }
    );

    /*
    =========================================================
    ENTER KEY
    =========================================================
    */

    promptInput.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {
                event.preventDefault();

                /*
                 * Enter does not stop generation.
                 * Stop using the stop button.
                 */
                if (isGenerating) {
                    return;
                }

                sendMessage();
            }
        }
    );

    /*
    =========================================================
    FORM SUBMIT
    =========================================================
    */

    composer.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            /*
             * The same button works as:
             *
             * Normal state  -> Send
             * Generating    -> Stop
             */
            if (isGenerating) {
                stopGenerating();
                return;
            }

            sendMessage();
        }
    );

    /*
    =========================================================
    PROMPT CARDS
    =========================================================
    */

    promptCards.forEach(
        (card, index) => {
            card.addEventListener(
                "click",
                () => {
                    if (isGenerating) {
                        return;
                    }

                    promptInput.value =
                        promptTexts[index] ?? "";

                    resizeTextarea();
                    updateSendButton();
                    sendMessage();
                }
            );
        }
    );

    /*
    =========================================================
    NEW CHAT & CONVERSATION HISTORY
    =========================================================
    */

    const pinnedChatsKey = "ashai_pinned_conversations";

    const getPinnedChats = () => {
        try {
            const stored = JSON.parse(
                localStorage.getItem(pinnedChatsKey) || "[]"
            );
            return new Set(Array.isArray(stored) ? stored : []);
        } catch {
            localStorage.removeItem(pinnedChatsKey);
            return new Set();
        }
    };

    const savePinnedChats = (pinnedChats) => {
        localStorage.setItem(
            pinnedChatsKey,
            JSON.stringify([...pinnedChats])
        );
    };

    const loadRecentChats = async () => {
        const historyContainer = document.getElementById("chatHistory");
        if (!historyContainer) return;

        try {
            const token = localStorage.getItem("ashai_access_token") || sessionStorage.getItem("ashai_access_token");
            if (!token) return;

            const res = await fetch(`${ASHAI_API_BASE_URL}/chat/history`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) return;
            const summaries = await res.json();
            const pinnedChats = getPinnedChats();
            const validConversationIds = new Set(
                summaries.map((item) => item.conversationId)
            );

            [...pinnedChats].forEach((conversationId) => {
                if (!validConversationIds.has(conversationId)) {
                    pinnedChats.delete(conversationId);
                }
            });
            savePinnedChats(pinnedChats);

            summaries.sort((first, second) => {
                const firstPinned = pinnedChats.has(first.conversationId);
                const secondPinned = pinnedChats.has(second.conversationId);
                return Number(secondPinned) - Number(firstPinned);
            });

            // Clear static placeholders except section heading
            const heading = historyContainer.querySelector(".sidebar-section-heading");
            historyContainer.innerHTML = "";
            if (heading) historyContainer.appendChild(heading);

            if (!summaries.length) {
                const emptyState = document.createElement("p");
                emptyState.className = "recent-chats-empty";
                emptyState.textContent = "No recent chats yet";
                historyContainer.appendChild(emptyState);
                return;
            }

            summaries.forEach((item) => {
                const row = document.createElement("div");
                row.className = "recent-chat-row";

                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = `recent-chat-item ${item.conversationId === window.activeConversationId ? "active" : ""}`;
                btn.innerHTML = `
                    <span class="recent-chat-icon" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path>
                        </svg>
                    </span>
                    <span class="recent-chat-text">${escapeHtml(item.title || "Chat")}</span>
                `;
                btn.addEventListener("click", () => loadConversation(item.conversationId));

                const pinButton = document.createElement("button");
                const isPinned = pinnedChats.has(item.conversationId);
                pinButton.type = "button";
                pinButton.className = `recent-chat-pin ${isPinned ? "is-pinned" : ""}`;
                pinButton.setAttribute(
                    "aria-label",
                    `${isPinned ? "Unpin" : "Pin"} ${item.title || "conversation"}`
                );
                pinButton.title = isPinned ? "Unpin conversation" : "Pin conversation";
                pinButton.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M12 17v5"></path>
                        <path d="M5 17h14"></path>
                        <path d="M7 3h10l-1 8 3 3H5l3-3-1-8z"></path>
                    </svg>
                `;
                pinButton.addEventListener("click", () => {
                    const currentPins = getPinnedChats();
                    if (currentPins.has(item.conversationId)) {
                        currentPins.delete(item.conversationId);
                    } else {
                        currentPins.add(item.conversationId);
                    }
                    savePinnedChats(currentPins);
                    loadRecentChats();
                });

                row.append(btn, pinButton);
                historyContainer.appendChild(row);
            });
        } catch (e) {
            console.warn("Could not load recent chats:", e);
        }
    };

    const loadConversation = async (conversationId) => {
        stopGenerating();
        window.activeConversationId = conversationId;
        welcomeSection.hidden = true;

        if (conversationArea) {
            conversationArea.remove();
            conversationArea = null;
        }
        const area = createConversationArea();

        try {
            const token = localStorage.getItem("ashai_access_token") || sessionStorage.getItem("ashai_access_token");
            const res = await fetch(
                `${ASHAI_API_BASE_URL}/chat/history/${encodeURIComponent(conversationId)}`,
                {
                headers: { "Authorization": `Bearer ${token}` }
                }
            );

            if (res.ok) {
                const messages = await res.json();
                messages.forEach(msg => {
                    const msgElement = createMessage(msg.sender, "");
                    const p = msgElement.querySelector("p");
                    if (p) {
                        if (msg.sender === "assistant") {
                            renderMarkdown(p, msg.content);
                        } else {
                            p.textContent = msg.content;
                        }
                    }
                    area.appendChild(msgElement);
                });
                scrollToLatestMessage();
            }
        } catch (err) {
            console.error("Failed to load conversation history:", err);
        }

        loadRecentChats();
    };

    newChatButton?.addEventListener(
        "click",
        () => {
            stopGenerating();
            window.activeConversationId = null;

            conversationArea?.remove();
            conversationArea = null;

            welcomeSection.hidden = false;

            promptInput.value = "";

            resizeTextarea();
            updateSendButton();

            promptInput.focus();
            loadRecentChats();
        }
    );

    loadRecentChats();

    /*
    =========================================================
    MODEL SELECTOR DROPDOWN
    =========================================================
    */

    const modelSelectorBtn = document.getElementById("modelSelectorBtn");
    const modelDropdownMenu = document.getElementById("modelDropdownMenu");
    const selectedModelLabel = document.getElementById("selectedModelLabel");

    if (modelSelectorBtn && modelDropdownMenu) {
        const preferredModel =
            localStorage.getItem("ashai_default_model") ||
            "AshAI Standard";
        const preferredOption = modelDropdownMenu.querySelector(
            `.model-option-btn[data-model="${CSS.escape(preferredModel)}"]`
        );
        if (preferredOption && selectedModelLabel) {
            selectedModelLabel.textContent = preferredModel;
        }

        modelSelectorBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            modelDropdownMenu.hidden = !modelDropdownMenu.hidden;
        });

        document.addEventListener("click", () => {
            if (modelDropdownMenu) modelDropdownMenu.hidden = true;
        });

        const optionBtns = modelDropdownMenu.querySelectorAll(".model-option-btn");
        optionBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const modelName = btn.getAttribute("data-model");
                if (selectedModelLabel) selectedModelLabel.textContent = modelName;
                localStorage.setItem("ashai_default_model", modelName);
                modelDropdownMenu.hidden = true;
            });
        });
    }

    /*
    =========================================================
    FILE ATTACHMENT
    =========================================================
    */

    const attachFileBtn = document.getElementById("attachFileBtn");
    const fileAttachInput = document.getElementById("fileAttachInput");
    const cameraCaptureBtn = document.getElementById("cameraCaptureBtn");
    const cameraCaptureInput = document.getElementById("cameraCaptureInput");
    const attachmentStatus = document.getElementById("attachmentStatus");
    const MAX_TEXT_ATTACHMENT_BYTES = 100_000;
    const MAX_IMAGE_ATTACHMENT_BYTES = 3_000_000;
    let pendingAttachment = null;

    const showAttachmentStatus = (message, isError = false) => {
        if (!attachmentStatus) return;
        attachmentStatus.textContent = message;
        attachmentStatus.classList.toggle("is-error", isError);
    };

    const readAttachment = (file, input) => {
        if (!file) return;
        const isImage = file.type.startsWith("image/");
        const limit = isImage ? MAX_IMAGE_ATTACHMENT_BYTES : MAX_TEXT_ATTACHMENT_BYTES;

        if (file.size > limit) {
            showAttachmentStatus(
                    isImage ? "Image must be under 3 MB" : "File must be under 100 KB",
                    true
            );
            input.value = "";
            return;
        }

        const supportedTextTypes = new Set([
            "text/plain", "text/markdown", "application/json", "application/xml", "text/xml"
        ]);
        const mimeType = file.type || "text/plain";
        if (!isImage && !supportedTextTypes.has(mimeType)) {
            showAttachmentStatus("Unsupported file type", true);
            input.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = String(event.target.result);
            pendingAttachment = {
                name: file.name || (isImage ? "camera-photo.jpg" : "attachment.txt"),
                mimeType: mimeType === "text/xml" ? "application/xml" : mimeType,
                size: file.size,
                data: dataUrl.slice(dataUrl.indexOf(",") + 1)
            };
            showAttachmentStatus(`${pendingAttachment.name} ready`);
            updateSendButton();
            promptInput.focus();
        };
        reader.onerror = () => {
            showAttachmentStatus("Could not read file", true);
            input.value = "";
        };
        reader.readAsDataURL(file);
    };

    if (attachFileBtn && fileAttachInput) {
        attachFileBtn.addEventListener("click", () => fileAttachInput.click());
        fileAttachInput.addEventListener("change", (event) => {
            readAttachment(event.target.files[0], fileAttachInput);
        });
    }

    if (cameraCaptureBtn && cameraCaptureInput) {
        cameraCaptureBtn.addEventListener("click", () => cameraCaptureInput.click());
        cameraCaptureInput.addEventListener("change", (event) => {
            readAttachment(event.target.files[0], cameraCaptureInput);
        });
    }

    /*
    =========================================================
    SIDEBAR USER PROFILE SYNC
    =========================================================
    */

    const loadUserProfile = async () => {
        const userNameEl = document.getElementById("sidebarUserName");
        const userAvatarEl = document.getElementById("sidebarUserAvatar");
        const headerNameEl = document.getElementById("headerProfileName");
        const headerAvatarEl = document.getElementById("headerProfileAvatar");
        const menuNameEl = document.getElementById("menuProfileName");
        const menuEmailEl = document.getElementById("menuProfileEmail");
        const menuAvatarEl = document.getElementById("menuProfileAvatar");

        try {
            const token = localStorage.getItem("ashai_access_token") || sessionStorage.getItem("ashai_access_token");
            if (!token) return;

            const res = await fetch(`${ASHAI_API_BASE_URL}/profile`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const user = await res.json();
                const displayName = user.fullName || "User Account";
                const initials = displayName
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part.charAt(0).toUpperCase())
                    .join("") || "A";

                if (userNameEl) userNameEl.textContent = displayName;
                if (userAvatarEl) userAvatarEl.textContent = initials;
                if (headerNameEl) headerNameEl.textContent = displayName.split(/\s+/)[0];
                if (headerAvatarEl) headerAvatarEl.textContent = initials;
                if (menuNameEl) menuNameEl.textContent = displayName;
                if (menuEmailEl) menuEmailEl.textContent = user.email || "AshAI account";
                if (menuAvatarEl) menuAvatarEl.textContent = initials;
            }
        } catch (err) {
            console.warn("Could not load sidebar profile:", err);
        }
    };

    loadUserProfile();

    /*
    =========================================================
    COPY ASHAI RESPONSE
    =========================================================
    */

    workspace.addEventListener(
        "click",
        async (event) => {
            const target = event.target;

            if (!(target instanceof Element)) {
                return;
            }

            const copyCodeButton =
                target.closest(
                    ".copy-code-button"
                );

            if (copyCodeButton) {
                const wrapper =
                    copyCodeButton.closest(
                        ".code-block-wrapper"
                    );

                const code =
                    wrapper?.querySelector("code");

                const codeText =
                    code?.textContent ?? "";

                if (!codeText.trim()) {
                    return;
                }

                try {
                    await navigator.clipboard.writeText(
                        codeText
                    );

                    const label =
                        copyCodeButton.querySelector(
                            "span"
                        );

                    copyCodeButton.classList.add(
                        "copied"
                    );

                    copyCodeButton.setAttribute(
                        "aria-label",
                        "Code copied"
                    );

                    if (label) {
                        label.textContent =
                            "Copied";
                    }

                    window.setTimeout(() => {
                        copyCodeButton.classList.remove(
                            "copied"
                        );

                        copyCodeButton.setAttribute(
                            "aria-label",
                            "Copy code"
                        );

                        if (label) {
                            label.textContent =
                                "Copy code";
                        }
                    }, 1600);
                } catch (error) {
                    console.error(
                        "Unable to copy code:",
                        error
                    );
                }

                return;
            }

            const saveButton =
                target.closest(".save-response-button");

            if (saveButton) {
                const message = saveButton.closest(".chat-message");
                if (
                    message?.classList.contains("is-typing") ||
                    message?.classList.contains("is-streaming")
                ) {
                    return;
                }

                const responseText = message
                    ?.querySelector(".chat-message-content > p")
                    ?.textContent.trim();
                if (!responseText) return;

                saveButton.disabled = true;
                const label = saveButton.querySelector("span");
                if (label) label.textContent = "Saving…";

                try {
                    const response = await fetch(`${ASHAI_API_BASE_URL}/saved`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${getAccessToken()}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            content: responseText,
                            conversationId: window.activeConversationId || null
                        })
                    });
                    if (!response.ok) throw new Error("Unable to save this response.");
                    saveButton.classList.add("copied");
                    saveButton.setAttribute("aria-label", "Response saved");
                    if (label) label.textContent = "Saved";
                } catch (error) {
                    saveButton.disabled = false;
                    if (label) label.textContent = "Save";
                    console.error("Unable to save response:", error);
                }
                return;
            }

            const copyButton =
                target.closest(
                    ".message-action-button"
                );

            if (!copyButton) {
                return;
            }

            const message =
                copyButton.closest(
                    ".chat-message"
                );

            /*
             * Do not copy an incomplete response.
             */
            if (
                message?.classList.contains(
                    "is-typing"
                ) ||
                message?.classList.contains(
                    "is-streaming"
                )
            ) {
                return;
            }

            const paragraph =
                message?.querySelector(
                    ".chat-message-content > p"
                );

            const text =
                paragraph?.textContent.trim();

            if (!text) {
                return;
            }

            try {
                await navigator.clipboard.writeText(
                    text
                );

                const buttonText =
                    copyButton.querySelector(
                        "span"
                    );

                copyButton.classList.add(
                    "copied"
                );

                copyButton.setAttribute(
                    "aria-label",
                    "Response copied"
                );

                if (buttonText) {
                    buttonText.textContent =
                        "Copied";
                }

                window.setTimeout(() => {
                    copyButton.classList.remove(
                        "copied"
                    );

                    copyButton.setAttribute(
                        "aria-label",
                        "Copy AshAI response"
                    );

                    if (buttonText) {
                        buttonText.textContent =
                            "Copy";
                    }
                }, 1600);
            } catch (error) {
                console.error(
                    "Unable to copy message:",
                    error
                );
            }
        }
    );

    /*
    =========================================================
    INITIAL SETUP
    =========================================================
    */

    sendButton.innerHTML = sendIcon;

    /*
    =========================================================
    FILES, SAVED & CHATS INTERACTIVE VIEWS
    =========================================================
    */

    const createInteractiveModal = (title, contentHtml) => {
        let existingModal = document.getElementById("ashaiInteractiveModal");
        if (existingModal) existingModal.remove();

        const modal = document.createElement("div");
        modal.id = "ashaiInteractiveModal";
        modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(4px);";
        modal.innerHTML = `
            <div style="background:var(--bg-card, #1e293b); color:inherit; width:90%; max-width:640px; max-height:85vh; border-radius:16px; border:1px solid var(--border-color, #334155); box-shadow:0 20px 50px rgba(0,0,0,0.5); display:flex; flex-direction:column; overflow:hidden;">
                <div style="display:flex; justify-content:space-between; align-items:center; padding:20px 24px; border-bottom:1px solid var(--border-color, #334155);">
                    <h3 style="margin:0; font-size:18px; font-weight:700;">${title}</h3>
                    <button type="button" id="closeInteractiveModalBtn" style="background:transparent; border:none; color:inherit; font-size:24px; cursor:pointer; padding:0 8px;">&times;</button>
                </div>
                <div style="padding:24px; overflow-y:auto; flex:1;">
                    ${contentHtml}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector("#closeInteractiveModalBtn").addEventListener("click", () => modal.remove());
        modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
    };

    /*
    =========================================================
    HEADER SEARCH, NOTIFICATIONS & ACCOUNT MENU
    =========================================================
    */

    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const searchButton = document.getElementById("dashboardSearchButton");
    const notificationButton = document.getElementById("notificationButton");
    const notificationPopover = document.getElementById("notificationPopover");
    const notificationList = document.getElementById("notificationList");
    const profileButton = document.getElementById("headerProfileButton");
    const profilePopover = document.getElementById("profilePopover");
    const notificationStorageKey = "ashai_notifications_read";

    const closeHeaderPopovers = (except = null) => {
        [
            [notificationPopover, notificationButton],
            [profilePopover, profileButton]
        ].forEach(([popover, button]) => {
            if (!popover || popover === except) return;
            popover.hidden = true;
            button?.setAttribute("aria-expanded", "false");
        });
    };

    const notifications = [
        {
            title: "Gemini is connected",
            message: "AshAI is using the latest Gemini Flash model."
        },
        {
            title: "Social login is ready",
            message: "Google and GitHub authentication are configured."
        },
        {
            title: "Welcome to your workspace",
            message: "Your conversations are saved automatically."
        }
    ];

    const renderNotifications = () => {
        if (!notificationList) return;
        const allRead = localStorage.getItem(notificationStorageKey) === "true";
        notificationList.innerHTML = notifications.map((item) => `
            <div class="notification-item ${allRead ? "read" : ""}">
                <span class="notification-item-dot" aria-hidden="true"></span>
                <div>
                    <strong>${escapeHtml(item.title)}</strong>
                    <span>${escapeHtml(item.message)}</span>
                </div>
            </div>
        `).join("");
        document.querySelector(".notification-dot")?.toggleAttribute("hidden", allRead);
    };

    notificationButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        const willOpen = notificationPopover?.hidden;
        closeHeaderPopovers(notificationPopover);
        if (notificationPopover) notificationPopover.hidden = !willOpen;
        notificationButton.setAttribute("aria-expanded", String(Boolean(willOpen)));
    });

    document.getElementById("markNotificationsRead")?.addEventListener("click", () => {
        localStorage.setItem(notificationStorageKey, "true");
        renderNotifications();
    });

    profileButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        const willOpen = profilePopover?.hidden;
        closeHeaderPopovers(profilePopover);
        if (profilePopover) profilePopover.hidden = !willOpen;
        profileButton.setAttribute("aria-expanded", String(Boolean(willOpen)));
    });

    const logoutToHome = () => {
        localStorage.removeItem("ashai_access_token");
        sessionStorage.removeItem("ashai_access_token");
        localStorage.removeItem(pinnedChatsKey);
        window.location.replace("../index.html");
    };

    document.getElementById("dashboardLogoutButton")?.addEventListener("click", logoutToHome);
    document.getElementById("sidebarLogoutButton")?.addEventListener("click", logoutToHome);

    document.getElementById("planDetailsButton")?.addEventListener("click", () => {
        closeHeaderPopovers();
        createInteractiveModal("AshAI Free Plan", `
            <div style="display:grid; gap:16px;">
                <div style="padding:18px; border:1px solid var(--border-color, #334155); border-radius:12px; background:var(--bg-main, #0f172a);">
                    <strong style="display:block; margin-bottom:7px;">Free Plan</strong>
                    <span style="font-size:13px; opacity:.75; line-height:1.6;">Local workspace access, conversation history, profile preferences, file attachments and Gemini-powered chat are enabled.</span>
                </div>
                <p style="margin:0; font-size:13px; opacity:.7;">Paid billing and subscription management are not configured for this local development build.</p>
            </div>
        `);
    });

    searchButton?.addEventListener("click", async () => {
        closeHeaderPopovers();
        createInteractiveModal("Search conversations", `
            <label for="conversationSearchInput" style="display:block; margin-bottom:8px; font-size:13px; font-weight:700;">Search by conversation title</label>
            <input id="conversationSearchInput" type="search" placeholder="Type to search…" autocomplete="off"
                style="width:100%; padding:12px 14px; color:inherit; background:var(--bg-main, #0f172a); border:1px solid var(--border-color, #334155); border-radius:9px; outline:none;">
            <div id="conversationSearchResults" style="display:grid; gap:8px; margin-top:16px;"><span style="opacity:.7;">Loading conversations…</span></div>
        `);

        const input = document.getElementById("conversationSearchInput");
        const results = document.getElementById("conversationSearchResults");
        input?.focus();

        try {
            const response = await fetch(`${ASHAI_API_BASE_URL}/chat/history`, {
                headers: { Authorization: `Bearer ${getAccessToken()}` }
            });
            if (!response.ok) throw new Error("Unable to load conversations.");
            const conversations = await response.json();

            const drawResults = (query = "") => {
                const normalized = query.trim().toLowerCase();
                const matches = conversations.filter((item) =>
                    (item.title || "").toLowerCase().includes(normalized)
                );
                if (!results) return;
                results.innerHTML = matches.length
                    ? matches.map((item) => `
                        <button type="button" class="conversation-search-result" data-conversation-id="${escapeHtml(item.conversationId)}"
                            style="padding:12px; text-align:left; color:inherit; background:var(--bg-main, #0f172a); border:1px solid var(--border-color, #334155); border-radius:9px; cursor:pointer;">
                            <strong>${escapeHtml(item.title || "Untitled conversation")}</strong>
                        </button>
                    `).join("")
                    : `<span style="opacity:.7;">No matching conversations.</span>`;
            };

            drawResults();
            input?.addEventListener("input", () => drawResults(input.value));
            results?.addEventListener("click", (event) => {
                const result = event.target.closest(".conversation-search-result");
                if (!result) return;
                loadConversation(result.dataset.conversationId);
                document.getElementById("ashaiInteractiveModal")?.remove();
            });
        } catch (error) {
            if (results) results.innerHTML = `<span style="color:#fb7185;">${escapeHtml(error.message)}</span>`;
        }
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".dashboard-header-actions")) {
            closeHeaderPopovers();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeHeaderPopovers();
    });

    renderNotifications();

    const filesLink = document.getElementById("filesSidebarLink");
    filesLink?.addEventListener("click", (e) => {
        e.preventDefault();
        const attachmentList = pendingAttachment
            ? `
                <li style="padding:12px; background:var(--bg-main, #0f172a); border-radius:8px; display:flex; gap:12px; justify-content:space-between; align-items:center;">
                    <div style="min-width:0;">
                        <strong style="display:block; overflow:hidden; font-size:14px; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(pendingAttachment.name)}</strong>
                        <div style="font-size:12px; opacity:0.6;">${escapeHtml(pendingAttachment.mimeType)} • ${Math.max(1, Math.ceil(pendingAttachment.size / 1024))} KB</div>
                    </div>
                    <button type="button" id="removeWorkspaceAttachment" style="flex:0 0 auto; color:#fb7185; background:#fb71851a; border:none; padding:6px 9px; border-radius:6px; font-weight:600; cursor:pointer;">Remove</button>
                </li>
            `
            : `
                <li style="padding:28px 16px; text-align:center; border:1px dashed var(--border-color, #334155); border-radius:10px;">
                    <strong style="display:block; margin-bottom:6px;">No files attached</strong>
                    <span style="font-size:13px; opacity:.65;">Choose a file to attach it to your next message.</span>
                </li>
            `;

        createInteractiveModal("Workspace Files & Attachments", `
            <p style="margin-top:0; opacity:0.8; font-size:14px;">Manage the file attached to your next AshAI message.</p>
            <div style="border:2px dashed var(--border-color, #334155); border-radius:12px; padding:32px; text-align:center; margin-bottom:20px;">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:8px; opacity:0.7;"><path d="M21.4 11.6l-8.9 8.9a6 6 0 0 1-8.5-8.5l9.6-9.6a4 4 0 0 1 5.7 5.7l-9.6 9.6a2 2 0 1 1-2.8-2.8l8.9-8.9"></path></svg>
                <p style="margin:0 0 12px 0; font-weight:600;">Upload new document or code file</p>
                <button type="button" id="modalUploadBtn" style="background:linear-gradient(135deg, #6366f1, #4f46e5); color:#fff; border:none; padding:8px 18px; border-radius:8px; font-weight:600; cursor:pointer;">Choose File</button>
            </div>
            <h4 style="margin:0 0 12px 0; font-size:15px;">Current Attachment</h4>
            <ul style="list-style:none; padding:0; margin:0;">
                ${attachmentList}
            </ul>
        `);

        document.getElementById("modalUploadBtn")?.addEventListener("click", () => {
            fileAttachInput?.click();
            document.getElementById("ashaiInteractiveModal")?.remove();
        });

        document.getElementById("removeWorkspaceAttachment")?.addEventListener("click", () => {
            pendingAttachment = null;
            if (fileAttachInput) fileAttachInput.value = "";
            if (cameraCaptureInput) cameraCaptureInput.value = "";
            showAttachmentStatus("");
            document.getElementById("ashaiInteractiveModal")?.remove();
            filesLink.click();
        });
    });

    const savedLink = document.getElementById("savedSidebarLink");
    savedLink?.addEventListener("click", async (e) => {
        e.preventDefault();
        createInteractiveModal("Saved Items & Code Snippets", `
            <p style="margin-top:0; opacity:0.8; font-size:14px;">Your saved AI responses, code blocks, and bookmarked notes.</p>
            <div id="savedItemsList" style="display:flex; flex-direction:column; gap:12px;">
                <p style="opacity:.7;">Loading saved items…</p>
            </div>
        `);

        const list = document.getElementById("savedItemsList");
        const token = getAccessToken();

        const loadSavedItems = async () => {
            try {
                const response = await fetch(`${ASHAI_API_BASE_URL}/saved`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) throw new Error("Unable to load saved items.");
                const items = await response.json();
                if (!list) return;

                if (!items.length) {
                    list.innerHTML = `
                        <div style="padding:28px; text-align:center; border:1px dashed var(--border-color, #334155); border-radius:12px;">
                            <strong style="display:block; margin-bottom:7px;">Nothing saved yet</strong>
                            <span style="font-size:13px; opacity:.7;">Use the Save button below an AshAI response.</span>
                        </div>
                    `;
                    return;
                }

                list.innerHTML = items.map((item) => `
                    <article style="padding:16px; background:var(--bg-main, #0f172a); border-radius:12px; border:1px solid var(--border-color, #334155);">
                        <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:10px;">
                            <strong style="font-size:13px; color:#7797ff;">${escapeHtml(item.title)}</strong>
                            <button type="button" class="delete-saved-item" data-saved-id="${item.id}"
                                style="flex:0 0 auto; color:#fb7185; background:transparent; border:0; cursor:pointer;">Delete</button>
                        </div>
                        <p style="max-height:150px; overflow:auto; margin:0; white-space:pre-wrap; font-size:13px; line-height:1.6;">${escapeHtml(item.content)}</p>
                        <span style="display:block; margin-top:10px; font-size:11px; opacity:.55;">${new Date(item.createdAt).toLocaleString()}</span>
                    </article>
                `).join("");
            } catch (error) {
                if (list) list.innerHTML = `<p style="color:#fb7185;">${escapeHtml(error.message)}</p>`;
            }
        };

        list?.addEventListener("click", async (event) => {
            const button = event.target.closest(".delete-saved-item");
            if (!button) return;
            button.disabled = true;
            const response = await fetch(
                `${ASHAI_API_BASE_URL}/saved/${encodeURIComponent(button.dataset.savedId)}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            if (response.ok) await loadSavedItems();
            else button.disabled = false;
        });

        await loadSavedItems();
    });

    const viewAllChatsBtn = document.querySelector(".sidebar-small-button");
    viewAllChatsBtn?.addEventListener("click", async () => {
        try {
            const token = localStorage.getItem("ashai_access_token") || sessionStorage.getItem("ashai_access_token");
            const res = await fetch(`${ASHAI_API_BASE_URL}/chat/history`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const summaries = res.ok ? await res.json() : [];

            let listHtml = summaries.map((item, idx) => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--bg-main, #0f172a); border-radius:8px; margin-bottom:8px;">
                    <button type="button" class="open-modal-chat"
                        data-conversation-id="${escapeHtml(item.conversationId)}"
                        style="cursor:pointer; flex:1; color:inherit; text-align:left; background:transparent; border:0;">
                        <strong style="font-size:14px; display:block;">${escapeHtml(item.title || `Conversation ${idx + 1}`)}</strong>
                        <span style="font-size:11px; opacity:0.6;">ID: ${escapeHtml(item.conversationId.substring(0, 8))}...</span>
                    </button>
                    <button type="button" class="delete-modal-chat"
                        data-conversation-id="${escapeHtml(item.conversationId)}"
                        style="background:#ef444422; color:#ef4444; border:none; padding:6px 12px; border-radius:6px; font-weight:600; cursor:pointer;">Delete</button>
                </div>
            `).join("");

            if (!summaries.length) {
                listHtml = `<p style="text-align:center; opacity:0.7;">No active conversations found.</p>`;
            }

            createInteractiveModal("All Recent Conversations", listHtml);

            const modal = document.getElementById("ashaiInteractiveModal");
            modal?.addEventListener("click", async (event) => {
                const openButton = event.target.closest(".open-modal-chat");
                if (openButton) {
                    loadConversation(openButton.dataset.conversationId);
                    modal.remove();
                    return;
                }

                const deleteButton = event.target.closest(".delete-modal-chat");
                if (!deleteButton) return;
                deleteButton.disabled = true;
                const response = await fetch(
                    `${ASHAI_API_BASE_URL}/chat/history/${encodeURIComponent(deleteButton.dataset.conversationId)}`,
                    {
                        method: "DELETE",
                        headers: { "Authorization": `Bearer ${token}` }
                    }
                );
                if (response.ok) {
                    modal.remove();
                    loadRecentChats();
                } else {
                    deleteButton.disabled = false;
                }
            });
        } catch (err) {
            console.error("Failed to fetch all chats:", err);
        }
    });

    resizeTextarea();
    updateGeneratingState();
});
