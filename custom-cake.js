
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("customCakeForm");
    if (!form) {
        console.error("Custom Cake form not found!");
        return;
    }

    const photoInput = document.getElementById("customCakePhoto");
    const photoPreview = document.getElementById("customCakePreview");
    const submitButton = document.getElementById("customRequestSubmit");
    const messageBox = document.getElementById("customRequestMessage");
    const dateInput = document.getElementById("customRequiredDate");

    const WHATSAPP_NUMBER = "94768727152";
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    function showMessage(message, type = "error") {
        messageBox.textContent = message;
        messageBox.className = "custom-request-message " + type;
    }

    function getClient() {
        if (typeof supabaseClient === "undefined" || !supabaseClient) {
            throw new Error("Supabase connection eka hariyata load wela naha.");
        }
        return supabaseClient;
    }

    if (!photoInput || !photoPreview || !submitButton || !messageBox || !dateInput) {
        console.error("Custom cake form fields missing.");
        return;
    }

    const now = new Date();
    const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");

    dateInput.min = today;

    photoInput.addEventListener("change", () => {
        messageBox.textContent = "";
        photoPreview.hidden = true;
        photoPreview.removeAttribute("src");

        const file = photoInput.files && photoInput.files[0];
        if (!file) return;

        if (!allowedTypes.includes(file.type)) {
            photoInput.value = "";
            showMessage("JPG, PNG or WEBP photo ekak select karanna.");
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            photoInput.value = "";
            showMessage("Photo eka 5 MB walata wada adu wenna one.");
            return;
        }

        photoPreview.src = URL.createObjectURL(file);
        photoPreview.hidden = false;
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const customerName = document.getElementById("customCustomerName").value.trim();
        const customerPhone = document.getElementById("customCustomerPhone").value.trim();
        const cakeWeight = document.getElementById("customCakeWeight").value;
        const requiredDate = dateInput.value;
        const requiredTime = document.getElementById("customRequiredTime").value;
        const cakeWriting = document.getElementById("customCakeWriting").value.trim();
        const deliveryDetails = document.getElementById("customDeliveryDetails").value.trim();
        const photoFile = photoInput.files && photoInput.files[0];

        if (!customerName || !customerPhone || !cakeWeight ||
            !requiredDate || !requiredTime || !deliveryDetails || !photoFile) {
            showMessage("Required details okkoma fill karala cake photo eka select karanna.");
            return;
        }

        if (requiredDate < today) {
            showMessage("Past date ekak select karanna ba.");
            return;
        }

        if (!allowedTypes.includes(photoFile.type) || photoFile.size > MAX_FILE_SIZE) {
            showMessage("JPG, PNG, WEBP photo ekak 5 MB walata aduwen select karanna.");
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Processing order...";

        // Open WhatsApp tab during the click to reduce popup blocking.
        const whatsappWindow = window.open("about:blank", "_blank");

        try {
            const client = getClient();

            const extension = {
                "image/jpeg": "jpg",
                "image/png": "png",
                "image/webp": "webp"
            }[photoFile.type];

            const fileName = "requests/" + Date.now() + "-" +
                Math.random().toString(36).slice(2) + "." + extension;

            const { error: uploadError } = await client.storage
                .from("custom-cake-requests")
                .upload(fileName, photoFile, {
                    contentType: photoFile.type,
                    upsert: false
                });

            if (uploadError) {
                throw new Error("Photo upload failed: " + uploadError.message);
            }

            const { data: imageData } = client.storage
                .from("custom-cake-requests")
                .getPublicUrl(fileName);

            const imageUrl = imageData.publicUrl;

            const { error: insertError } = await client
                .from("custom_cake_requests")
                .insert({
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    reference_image_url: imageUrl,
                    reference_image_path: fileName,
                    cake_weight: cakeWeight,
                    required_date: requiredDate,
                    required_time: requiredTime,
                    cake_writing: cakeWriting,
                    delivery_details: deliveryDetails,
                    status: "Pending"
                });

            if (insertError) {
                throw new Error("Database save failed: " + insertError.message);
            }

            const message =
                "🎂 NEW CUSTOM CAKE REQUEST - Rashi Elegant Cake\n\n" +
                "Customer: " + customerName + "\n" +
                "Phone: " + customerPhone + "\n" +
                "Weight: " + cakeWeight + "\n" +
                "Date: " + requiredDate + "\n" +
                "Time: " + requiredTime + "\n" +
                "Cake writing: " + (cakeWriting || "None") + "\n" +
                "Pickup / Delivery: " + deliveryDetails + "\n\n" +
                "Reference cake photo:\n" + imageUrl;

            const whatsappUrl = "https://wa.me/" + WHATSAPP_NUMBER +
                "?text=" + encodeURIComponent(message);

            showMessage(
                "Request saved! WhatsApp open karala Send button eka press karanna.",
                "success"
            );

            if (whatsappWindow && !whatsappWindow.closed) {
                whatsappWindow.location.href = whatsappUrl;
            } else {
                const link = document.createElement("a");
                link.href = whatsappUrl;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = "Click here to open WhatsApp and send your order";
                messageBox.appendChild(document.createElement("br"));
                messageBox.appendChild(link);
            }

            form.reset();
            photoPreview.hidden = true;
            photoPreview.removeAttribute("src");
            dateInput.min = today;

        } catch (error) {
            console.error("Custom cake request error:", error);

            if (whatsappWindow && !whatsappWindow.closed) {
                whatsappWindow.close();
            }

            showMessage(error.message || "Order eka submit karanna bari una.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "🎂 Send Custom Cake Request";
        }
    });
});
