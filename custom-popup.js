
document.addEventListener("DOMContentLoaded", function () {
    const section = document.getElementById("custom-request");

    if (!section) {
        console.error("Custom cake request section was not found.");
        return;
    }

    // Create popup
    const overlay = document.createElement("div");
    overlay.id = "customCakePopup";
    overlay.className = "custom-popup-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Custom cake order");

    const box = document.createElement("div");
    box.className = "custom-popup-box";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "custom-popup-close";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Close custom cake order");

    // Move the EXISTING form; do not duplicate its IDs.
    box.appendChild(closeButton);
    box.appendChild(section);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    let lastFocusedElement = null;

    function openPopup(event) {
        if (event) {
            event.preventDefault();
        }

        lastFocusedElement = document.activeElement;
        overlay.classList.add("active");
        document.body.classList.add("custom-popup-open");
        closeButton.focus();
    }

    function closePopup() {
        overlay.classList.remove("active");
        document.body.classList.remove("custom-popup-open");

        if (
            lastFocusedElement &&
            typeof lastFocusedElement.focus === "function"
        ) {
            lastFocusedElement.focus();
        }
    }

    // Navigation link and collection button
    document.querySelectorAll("[data-open-custom-cake]").forEach(function (button) {
        button.addEventListener("click", openPopup);
    });

    // Close button
    closeButton.addEventListener("click", closePopup);

    // Close when clicking the dark background
    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
            closePopup();
        }
    });

    // Close with Escape key
    document.addEventListener("keydown", function (event) {
        if (
            event.key === "Escape" &&
            overlay.classList.contains("active")
        ) {
            closePopup();
        }
    });
});
