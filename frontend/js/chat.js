"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const composer = document.querySelector(".chat-composer");
    const promptInput = document.getElementById("chatPrompt");
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
        return;
    }

    const promptTexts = [
        "Summarize this document and list the key points.",
        "Generate code for the following problem:",
        "Explain this concept step by step:",
        "Search my workspace for information about:"
    ];

    let conversationArea = null;

    const resizeTextarea = () => {
        promptInput.style.height = "auto";

        const nextHeight = Math.min(
            promptInput.scrollHeight,
            180
        );

        promptInput.style.height = `${nextHeight}px`;
    };

    const updateSendButton = () => {
        const hasMessage =
            promptInput.value.trim().length > 0;

        sendButton.disabled = !hasMessage;
        sendButton.classList.toggle(
            "is-disabled",
            !hasMessage
        );
    };

    const createConversationArea = () => {
        if (conversationArea) {
            return conversationArea;
        }

        conversationArea = document.createElement("section");
        conversationArea.className = "conversation-area";
        conversationArea.setAttribute(
            "aria-label",
            "Conversation"
        );

        workspace.insertBefore(
            conversationArea,
            document.querySelector(".chat-composer-section")
        );

        return conversationArea;
    };

    const createMessage = (type, text) => {
        const message = document.createElement("article");

        message.className = `chat-message ${type}`;

        const avatar = document.createElement("div");
        avatar.className = "chat-message-avatar";
        avatar.textContent = type === "user" ? "AM" : "A";
        avatar.setAttribute("aria-hidden", "true");

        const content = document.createElement("div");
        content.className = "chat-message-content";

        const label = document.createElement("strong");
        label.textContent =
            type === "user" ? "You" : "AshAI";

        const paragraph = document.createElement("p");
        paragraph.textContent = text;

        content.append(label, paragraph);
        message.append(avatar, content);

        return message;
    };

    const showTemporaryResponse = () => {
        const area = createConversationArea();

        const typingMessage = createMessage(
            "assistant",
            "AshAI is preparing a response..."
        );

        typingMessage.classList.add("is-typing");
        area.appendChild(typingMessage);

        window.setTimeout(() => {
            const paragraph = typingMessage.querySelector("p");

            paragraph.textContent =
                "This is a temporary frontend response. The real AI answer will appear after the backend and AI service are connected.";

            typingMessage.classList.remove("is-typing");
        }, 900);
    };

    const sendMessage = () => {
        const text = promptInput.value.trim();

        if (!text) {
            promptInput.focus();
            return;
        }

        welcomeSection.hidden = true;

        const area = createConversationArea();
        area.appendChild(createMessage("user", text));

        promptInput.value = "";
        resizeTextarea();
        updateSendButton();

        showTemporaryResponse();

        window.requestAnimationFrame(() => {
            area.lastElementChild?.scrollIntoView({
                behavior: "smooth",
                block: "end"
            });
        });
    };

    promptInput.addEventListener("input", () => {
        resizeTextarea();
        updateSendButton();
    });

    promptInput.addEventListener("keydown", (event) => {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();
            sendMessage();
        }
    });

    composer.addEventListener("submit", (event) => {
        event.preventDefault();
        sendMessage();
    });

    promptCards.forEach((card, index) => {
        card.addEventListener("click", () => {
            promptInput.value =
                promptTexts[index] ?? "";

            resizeTextarea();
            updateSendButton();

            promptInput.focus();

            promptInput.setSelectionRange(
                promptInput.value.length,
                promptInput.value.length
            );
        });
    });

    newChatButton?.addEventListener("click", () => {
        conversationArea?.remove();
        conversationArea = null;

        welcomeSection.hidden = false;

        promptInput.value = "";
        resizeTextarea();
        updateSendButton();

        promptInput.focus();
    });

    resizeTextarea();
    updateSendButton();
});