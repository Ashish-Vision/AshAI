"use strict";

document.addEventListener("DOMContentLoaded", () => {
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

    const showTemporaryResponse = () => {
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

        const responseText = `## AshAI response preview

Your upgraded frontend now supports:

- **Markdown formatting**
- Lists and headings
- Inline code such as \`System.out.println()\`
- Fenced code blocks
- A dedicated **Copy code** button
- Streaming and Stop Generating

\`\`\`java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from AshAI");
    }
}
\`\`\`

This is still a frontend demonstration. A real response will replace it after the Spring Boot AI endpoint is connected.`;

        /*
         * Initial typing-indicator delay.
         */
        activeStreamTimer =
            window.setTimeout(() => {
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
                    /*
                     * Stop streaming immediately when
                     * Stop Generating has been pressed.
                     */
                    if (!isGenerating) {
                        typingMessage.classList.remove(
                            "is-streaming"
                        );

                        activeStreamTimer = null;

                        updateGeneratingState();

                        return;
                    }

                    /*
                     * Response completed.
                     */
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

                        return;
                    }

                    paragraph.textContent +=
                        responseText[currentIndex];

                    currentIndex += 1;

                    scrollToLatestMessage();

                    activeStreamTimer =
                        window.setTimeout(
                            streamResponse,
                            100
                        );
                };

                streamResponse();
            }, 1500);
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

        showTemporaryResponse();

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

                    promptInput.focus();

                    promptInput.setSelectionRange(
                        promptInput.value.length,
                        promptInput.value.length
                    );
                }
            );
        }
    );

    /*
    =========================================================
    NEW CHAT
    =========================================================
    */

    newChatButton?.addEventListener(
        "click",
        () => {
            /*
             * Stop any active timer before removing
             * the current conversation.
             */
            stopGenerating();

            conversationArea?.remove();
            conversationArea = null;

            welcomeSection.hidden = false;

            promptInput.value = "";

            resizeTextarea();
            updateSendButton();

            promptInput.focus();
        }
    );

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

    resizeTextarea();
    updateGeneratingState();
});