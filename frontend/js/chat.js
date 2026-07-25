"use strict";

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

            const res = await fetch("http://localhost:8080/api/chat", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    message: userPrompt || "Hello",
                    conversationId: window.activeConversationId || null,
                    model: selectedModel
                })
            });

            if (res.ok) {
                const data = await res.json();
                responseText = data.reply;
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
            responseText = `## AshAI Assistant Response\n\nI received your query: **"${userPrompt}"**.\n\nAshAI is currently running in local workspace mode. Make sure the backend Spring Boot app is running at \`http://localhost:8080\`.`;
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

    const loadRecentChats = async () => {
        const historyContainer = document.getElementById("chatHistory");
        if (!historyContainer) return;

        try {
            const token = localStorage.getItem("ashai_access_token") || sessionStorage.getItem("ashai_access_token");
            if (!token) return;

            const res = await fetch("http://localhost:8080/api/chat/history", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) return;
            const summaries = await res.json();

            // Clear static placeholders except section heading
            const heading = historyContainer.querySelector(".sidebar-section-heading");
            historyContainer.innerHTML = "";
            if (heading) historyContainer.appendChild(heading);

            summaries.forEach((item) => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = `recent-chat-item ${item.conversationId === window.activeConversationId ? "active" : ""}`;
                btn.innerHTML = `
                    <span class="recent-chat-icon" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path>
                        </svg>
                    </span>
                    <span class="recent-chat-text">${item.title || "Chat"}</span>
                `;
                btn.addEventListener("click", () => loadConversation(item.conversationId));
                historyContainer.appendChild(btn);
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
        }
        const area = createConversationArea();

        try {
            const token = localStorage.getItem("ashai_access_token") || sessionStorage.getItem("ashai_access_token");
            const res = await fetch(`http://localhost:8080/api/chat/history/${conversationId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

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

    if (attachFileBtn && fileAttachInput) {
        attachFileBtn.addEventListener("click", () => {
            fileAttachInput.click();
        });

        fileAttachInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target.result;
                promptInput.value += `\n\n[Attached File: ${file.name}]\n\`\`\`\n${content}\n\`\`\`\n`;
                resizeTextarea();
                updateSendButton();
                promptInput.focus();
            };
            reader.readAsText(file);
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

        try {
            const token = localStorage.getItem("ashai_access_token") || sessionStorage.getItem("ashai_access_token");
            if (!token) return;

            const res = await fetch("http://localhost:8080/api/profile", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const user = await res.json();
                if (userNameEl) userNameEl.textContent = user.fullName || "User Account";
                if (userAvatarEl) userAvatarEl.textContent = (user.fullName || "A").charAt(0).toUpperCase();
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

    const filesLink = document.getElementById("filesSidebarLink");
    filesLink?.addEventListener("click", (e) => {
        e.preventDefault();
        createInteractiveModal("Workspace Files & Attachments", `
            <p style="margin-top:0; opacity:0.8; font-size:14px;">Manage uploaded files, documents, and code attachments in your AshAI workspace.</p>
            <div style="border:2px dashed var(--border-color, #334155); border-radius:12px; padding:32px; text-align:center; margin-bottom:20px;">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:8px; opacity:0.7;"><path d="M21.4 11.6l-8.9 8.9a6 6 0 0 1-8.5-8.5l9.6-9.6a4 4 0 0 1 5.7 5.7l-9.6 9.6a2 2 0 1 1-2.8-2.8l8.9-8.9"></path></svg>
                <p style="margin:0 0 12px 0; font-weight:600;">Upload new document or code file</p>
                <button type="button" id="modalUploadBtn" style="background:linear-gradient(135deg, #6366f1, #4f46e5); color:#fff; border:none; padding:8px 18px; border-radius:8px; font-weight:600; cursor:pointer;">Choose File</button>
            </div>
            <h4 style="margin:0 0 12px 0; font-size:15px;">Workspace Attachments</h4>
            <ul style="list-style:none; padding:0; margin:0;">
                <li style="padding:12px; background:var(--bg-main, #0f172a); border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="font-size:14px;">architecture.md</strong>
                        <div style="font-size:12px; opacity:0.6;">Markdown Document • System Design</div>
                    </div>
                    <span style="font-size:12px; background:#10b98122; color:#10b981; padding:4px 8px; border-radius:4px; font-weight:600;">Active</span>
                </li>
                <li style="padding:12px; background:var(--bg-main, #0f172a); border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="font-size:14px;">api-design.md</strong>
                        <div style="font-size:12px; opacity:0.6;">API Specification • Backend Routes</div>
                    </div>
                    <span style="font-size:12px; background:#10b98122; color:#10b981; padding:4px 8px; border-radius:4px; font-weight:600;">Active</span>
                </li>
            </ul>
        `);

        document.getElementById("modalUploadBtn")?.addEventListener("click", () => {
            fileAttachInput?.click();
            document.getElementById("ashaiInteractiveModal")?.remove();
        });
    });

    const savedLink = document.getElementById("savedSidebarLink");
    savedLink?.addEventListener("click", (e) => {
        e.preventDefault();
        createInteractiveModal("Saved Items & Code Snippets", `
            <p style="margin-top:0; opacity:0.8; font-size:14px;">Your saved AI responses, code blocks, and bookmarked notes.</p>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <div style="padding:16px; background:var(--bg-main, #0f172a); border-radius:12px; border:1px solid var(--border-color, #334155);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="font-size:12px; font-weight:700; color:#6366f1;">JAVA COMPONENT</span>
                        <span style="font-size:12px; opacity:0.6;">Saved today</span>
                    </div>
                    <pre style="margin:0; font-family:monospace; font-size:13px; background:rgba(0,0,0,0.3); padding:10px; border-radius:6px;">public class SecurityConfig { ... }</pre>
                </div>
                <div style="padding:16px; background:var(--bg-main, #0f172a); border-radius:12px; border:1px solid var(--border-color, #334155);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="font-size:12px; font-weight:700; color:#10b981;">AI SUMMARY</span>
                        <span style="font-size:12px; opacity:0.6;">Saved today</span>
                    </div>
                    <p style="margin:0; font-size:13px; opacity:0.9;">System Architecture: Decoupled Spring Boot REST API & Vanilla Web Client.</p>
                </div>
            </div>
        `);
    });

    const viewAllChatsBtn = document.querySelector(".sidebar-small-button");
    viewAllChatsBtn?.addEventListener("click", async () => {
        try {
            const token = localStorage.getItem("ashai_access_token") || sessionStorage.getItem("ashai_access_token");
            const res = await fetch("http://localhost:8080/api/chat/history", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const summaries = res.ok ? await res.json() : [];

            let listHtml = summaries.map((item, idx) => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--bg-main, #0f172a); border-radius:8px; margin-bottom:8px;">
                    <div style="cursor:pointer; flex:1;" onclick="window.selectModalChat('${item.conversationId}')">
                        <strong style="font-size:14px; display:block;">${item.title || 'Conversation ' + (idx + 1)}</strong>
                        <span style="font-size:11px; opacity:0.6;">ID: ${item.conversationId.substring(0, 8)}...</span>
                    </div>
                    <button type="button" style="background:#ef444422; color:#ef4444; border:none; padding:6px 12px; border-radius:6px; font-weight:600; cursor:pointer;" onclick="window.deleteModalChat('${item.conversationId}')">Delete</button>
                </div>
            `).join("");

            if (!summaries.length) {
                listHtml = `<p style="text-align:center; opacity:0.7;">No active conversations found.</p>`;
            }

            createInteractiveModal("All Recent Conversations", listHtml);

            window.selectModalChat = (id) => {
                loadConversation(id);
                document.getElementById("ashaiInteractiveModal")?.remove();
            };

            window.deleteModalChat = async (id) => {
                await fetch(`http://localhost:8080/api/chat/history/${id}`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${token}` }
                });
                document.getElementById("ashaiInteractiveModal")?.remove();
                loadRecentChats();
            };
        } catch (err) {
            console.error("Failed to fetch all chats:", err);
        }
    });

    resizeTextarea();
    updateGeneratingState();
});
