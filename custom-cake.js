```javascript
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("customCakeForm");
    if (!form) return;

    const photoInput = document.getElementById("customCakePhoto");
    const photoPreview = document.getElementById("customCakePreview");
    const submitButton = document.getElementById("customRequestSubmit");
    const messageBox = document.getElementById("customRequestMessage");
    const dateInput = document.getElementById("customRequiredDate");

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    // Rashi's WhatsApp number, Sri Lankan international format
    const WHATSAPP_NUMBER = "94768727152";

    let previewUrl = null;

    const today = new Date();
    const localToday = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    dateInput.min = localToday;

    function showMessage(text, type) {
        messageBox.textContent = text;
        messageBox.className = "custom-request-message " + type;
    }

    function clearMessage() {
        messageBox.textContent = "";
        messageBox.className = "custom-request-message";
    }

    function getSupabaseClient() {
        if (typeof supabaseClient === "undefined" || !supabaseClient) {
            throw new Error(
                "Supabase connect wela naha. Please check supabase-config.js."
            );
        }
        return supabaseClient;
    }

    // Preview selected cake photo
    photoInput.addEventListener("change", () => {
        clearMessage();

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrl = null;
        }

        photoPreview.removeAttribute("src");
        photoPreview.hidden = true;

        const file = photoInput.files && photoInput.files[0];
        if (!file) return;

        if (!allowedTypes.includes(file.type)) {
            photoInput.value = "";
            showMessage("Please select a JPG, PNG or WEBP image.", "error");
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            photoInput.value = "";
            showMessage("Photo eka 5 MB walata wada adu wenna one.", "error");
            return;
        }

        previewUrl = URL.createObjectURL(file);
        photoPreview.src = previewUrl;
        photoPreview.hidden = false;
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearMessage();

        const customerName =
            document.getElementById("customCustomerName").value.trim();

        const customerPhone =
            document.getElementById("customCustomerPhone").value.trim();

        const cakeWeight =
            document.getElementById("customCakeWeight").value;

        const requiredDate = dateInput.value;

        const requiredTime =
            document.getElementById("customRequiredTime").value;

        const cakeWriting =
            document.getElementById("customCakeWriting").value.trim();

        const deliveryDetails =
            document.getElementById("customDeliveryDetails").value.trim();

        const photoFile = photoInput.files && photoInput.files[0];

        if (
            !customerName ||
            !customerPhone ||
            !requiredDate ||
            !requiredTime ||
            !deliveryDetails ||
            !photoFile
        ) {
            showMessage(
                "Please complete all required fields and select a cake photo.",
                "error"
            );
            return;
        }

        if (customerName.length > 100) {
            showMessage("Name eka akuru 100ta adu karanna.", "error");
            return;
        }

        if (customerPhone.length < 7 || customerPhone.length > 20) {
            showMessage("Valid contact number ekak enter karanna.", "error");
            return;
        }

        if (deliveryDetails.length > 2000) {
            showMessage("Pickup / Delivery details tika adu karanna.", "error");
            return;
        }

        if (requiredDate < localToday) {
            showMessage(
                "Past date ekak select karanna ba. Aluth date ekak select karanna.",
                "error"
            );
            return;
        }

        if (!allowedTypes.includes(photoFile.type)) {
            showMessage("JPG, PNG or WEBP photo ekak select karanna.", "error");
            return;
        }

        if (photoFile.size > MAX_FILE_SIZE) {
            showMessage("Photo eka 5 MB walata wada adu wenna one.", "error");
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Uploading photo and preparing WhatsApp...";

        // Open a tab while still inside the user's click, to reduce popup blocking.
        // It will navigate to WhatsApp only after the upload and database save succeed.
        const whatsappWindow = window.open("about:blank", "_blank");

        let uploadedPath = null;

        try {
            const client = getSupabaseClient();

            const fileExtension = {
                "image/jpeg": "jpg",
                "image/png": "png",
                "image/webp": "webp"
            }[photoFile.type];

            const uniqueId =
                typeof crypto !== "undefined" &&
                typeof crypto.randomUUID === "function"
                    ? crypto.randomUUID()
                    : Date.now() + "-" + Math.random().toString(36).slice(2);

            const safeFileName =
                `${Date.now()}-${uniqueId}.${fileExtension}`;

            const storagePath = `requests/${safeFileName}`;

            // Upload the reference photo
            const { error: uploadError } = await client
                .storage
                .from("custom-cake-requests")
                .upload(storagePath, photoFile, {
                    contentType: photoFile.type,
                    upsert: false
                });

            if (uploadError) {
                throw new Error("Photo upload failed: " + uploadError.message);
            }

            uploadedPath = storagePath;

            // Public photo link
            const { data: imageData } = client
                .storage
                .from("custom-cake-requests")
                .getPublicUrl(storagePath);

            const imageUrl = imageData.publicUrl;

            // Save order details
            const { error: insertError } = await client
                .from("custom_cake_requests")
                .insert({
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    reference_image_url: imageUrl,
                    reference_image_path: storagePath,
                    cake_weight: cakeWeight,
                    required_date: requiredDate,
                    required_time: requiredTime,
                    cake_writing: cakeWriting,
                    delivery_details: deliveryDetails,
                    status: "Pending"
                });

            if (insertError) {
                throw new Error("Request save failed: " + insertError.message);
            }

            // Build WhatsApp message including the uploaded photo URL
            const whatsappMessage =
                "🎂 NEW CUSTOM CAKE ORDER - Rashi Elegant Cake\n\n" +
                "Customer: " + customerName + "\n" +
                "Phone: " + customerPhone + "\n" +
                "Cake Weight: " + cakeWeight + "\n" +
                "Required Date: " + requiredDate + "\n" +
                "Required Time: " + requiredTime + "\n" +
                "Cake Writing: " + (cakeWriting || "None") + "\n" +
                "Pickup / Delivery: " + deliveryDetails + "\n\n" +
                "Customer's Cake Design Photo:\n" + imageUrl + "\n\n" +
                "Please confirm the design and price.";

            const whatsappUrl =
                "https://wa.me/" + WHATSAPP_NUMBER +
                "?text=" + encodeURIComponent(whatsappMessage);

            showMessage(
                "Your custom cake request was saved. WhatsApp is opening with your order details and photo link. Please press Send in WhatsApp.",
                "success"
            );

            if (whatsappWindow && !whatsappWindow.closed) {
                whatsappWindow.location.href = whatsappUrl;
            } else {
                // Popup may be blocked by the browser. Show a clickable fallback.
                const fallbackLink = document.createElement("a");
                fallbackLink.href = whatsappUrl;
                fallbackLink.target = "_blank";
                fallbackLink.rel = "noopener noreferrer";
                fallbackLink.textContent = "Open WhatsApp to send your order";
                fallbackLink.style.display = "block";
                fallbackLink.style.marginTop = "10px";
                fallbackLink.style.fontWeight = "bold";
                messageBox.appendChild(document.createElement("br"));
                messageBox.appendChild(fallbackLink);
            }

            form.reset();
            dateInput.min = localToday;

            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                previewUrl = null;
            }

            photoPreview.removeAttribute("src");
            photoPreview.hidden = true;

        } catch (error) {
            console.error("Custom cake request error:", error);

            if (whatsappWindow && !whatsappWindow.closed) {
                whatsappWindow.close();
            }

            showMessage(
                error.message ||
                "Request eka submit karanna bari una. Please try again.",
                "error"
            );

            if (uploadedPath) {
                console.warn(
                    "Photo uploaded but request may not have saved. Storage path:",
                    uploadedPath
                );
            }
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "🎂 Send Custom Cake Request";
        }
    });
});
```
