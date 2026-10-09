document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("customCakeForm");

    if (!form) return;

    const photoInput = document.getElementById("customCakePhoto");
    const photoPreview = document.getElementById("customCakePreview");
    const submitButton = document.getElementById("customRequestSubmit");
    const messageBox = document.getElementById("customRequestMessage");
    const dateInput = document.getElementById("customRequiredDate");

    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    let previewUrl = null;

    // Set today's date as the earliest selectable date.
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
        if (
            typeof supabaseClient === "undefined" ||
            !supabaseClient
        ) {
            throw new Error(
                "Supabase connect wela naha. Please check supabase-config.js."
            );
        }

        return supabaseClient;
    }

    // Show a preview when the customer chooses a photo.
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
            showMessage(
                "Please select a JPG, PNG or WEBP image.",
                "error"
            );
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            photoInput.value = "";
            showMessage(
                "Photo eka 5 MB walata wada adu wenna one.",
                "error"
            );
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
            document.getElementById("customCustomerName")
                .value.trim();

        const customerPhone =
            document.getElementById("customCustomerPhone")
                .value.trim();

        const cakeWeight =
            document.getElementById("customCakeWeight").value;

        const requiredDate = dateInput.value;
        const requiredTime =
            document.getElementById("customRequiredTime").value;

        const cakeWriting =
            document.getElementById("customCakeWriting")
                .value.trim();

        const deliveryDetails =
            document.getElementById("customDeliveryDetails")
                .value.trim();

        const photoFile =
            photoInput.files && photoInput.files[0];

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

        if (customerPhone.length > 20 || customerPhone.length < 7) {
            showMessage(
                "Valid contact number ekak enter karanna.",
                "error"
            );
            return;
        }

        if (deliveryDetails.length > 2000) {
            showMessage(
                "Pickup / Delivery details tika adu karanna.",
                "error"
            );
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
            showMessage(
                "JPG, PNG or WEBP photo ekak select karanna.",
                "error"
            );
            return;
        }

        if (photoFile.size > MAX_FILE_SIZE) {
            showMessage(
                "Photo eka 5 MB walata wada adu wenna one.",
                "error"
            );
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Uploading photo and sending request...";

        let uploadedPath = null;

        try {
            const client = getSupabaseClient();

            // Create a unique storage filename.
            const fileExtension = {
                "image/jpeg": "jpg",
                "image/png": "png",
                "image/webp": "webp"
            }[photoFile.type];

            const uniqueId =
                typeof crypto !== "undefined" &&
                typeof crypto.randomUUID === "function"
                    ? crypto.randomUUID()
                    : Date.now() + "-" +
                      Math.random().toString(36).slice(2);

            const safeFileName =
                `${Date.now()}-${uniqueId}.${fileExtension}`;

            const storagePath = `requests/${safeFileName}`;

            // Upload the reference image to Supabase Storage.
            const { error: uploadError } = await client
                .storage
                .from("custom-cake-requests")
                .upload(storagePath, photoFile, {
                    contentType: photoFile.type,
                    upsert: false
                });

            if (uploadError) {
                throw new Error(
                    "Photo upload failed: " + uploadError.message
                );
            }

            uploadedPath = storagePath;

            // Get the public URL for the uploaded image.
            const { data: imageData } = client
                .storage
                .from("custom-cake-requests")
                .getPublicUrl(storagePath);

            const imageUrl = imageData.publicUrl;

            // Save request details in the database.
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
                throw new Error(
                    "Request save failed: " + insertError.message
                );
            }

            showMessage(
                "Thank you! Your custom cake request was submitted successfully. Rashi will contact you to discuss your design and price.",
                "success"
            );

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

            showMessage(
                error.message ||
                "Request eka submit karanna bari una. Please try again.",
                "error"
            );

            // If the photo uploaded but the database insert failed,
            // the photo remains in Storage and can be cleaned up later.
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
