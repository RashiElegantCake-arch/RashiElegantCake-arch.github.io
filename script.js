/* =========================================================
   RASHI ELEGANT CAKE
========================================================= */

let selectedCakeData = null;


/* =========================================================
   MOBILE MENU
========================================================= */

const menuBtn = document.getElementById("menuBtn");
const mainNav = document.getElementById("mainNav");

if (menuBtn && mainNav) {

    menuBtn.addEventListener("click", function () {

        mainNav.classList.toggle("active");

        if (mainNav.classList.contains("active")) {
            menuBtn.textContent = "✕";
        } else {
            menuBtn.textContent = "☰";
        }

    });

}


/* =========================================================
   CLOSE MOBILE MENU AFTER CLICK
========================================================= */

document.querySelectorAll(".main-nav a").forEach(function (link) {

    link.addEventListener("click", function () {

        if (mainNav) {
            mainNav.classList.remove("active");
        }

        if (menuBtn) {
            menuBtn.textContent = "☰";
        }

    });

});


/* =========================================================
   LOAD CAKES FROM SUPABASE
========================================================= */

async function loadCakes() {

    const cakeGrid =
        document.getElementById("cakeGrid");

    if (!cakeGrid) return;


    try {

        const { data, error } =
            await supabaseClient
                .from("cakes")
                .select("*")
                .order("id", {
                    ascending: false
                });


        if (error) {
            throw error;
        }


        if (!data || data.length === 0) {

            cakeGrid.innerHTML = `
                <div class="loading">
                    <p>No cakes available right now.</p>
                </div>
            `;

            return;
        }


        renderCakes(data);


    } catch (error) {

        console.error(
            "Cake loading error:",
            error
        );


        cakeGrid.innerHTML = `
            <div class="loading">
                <p>Unable to load cakes.</p>
                <p>Please try again later.</p>
            </div>
        `;

    }

}


/* =========================================================
   RENDER CAKES
========================================================= */

function renderCakes(cakes) {

    const cakeGrid =
        document.getElementById("cakeGrid");

    if (!cakeGrid) return;


    cakeGrid.innerHTML = "";


    cakes.forEach(function (cake) {


        /* -----------------------------------------
           IMAGE
        ----------------------------------------- */

        const imageUrl =
            cake.image_url ||
            "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800";


        /* -----------------------------------------
           PRICE
        ----------------------------------------- */

        const price500 =
            cake.price_500 !== null &&
            cake.price_500 !== undefined
                ? Number(cake.price_500)
                : 0;


        const price1000 =
            cake.price_1000 !== null &&
            cake.price_1000 !== undefined
                ? Number(cake.price_1000)
                : 0;


        /* -----------------------------------------
           AVAILABLE
        ----------------------------------------- */

        const available =
            cake.available === false
                ? false
                : true;


        /* -----------------------------------------
           SAFE CAKE DATA
        ----------------------------------------- */

        const safeCake =
            JSON.stringify({

                id:
                    cake.id,

                name:
                    cake.name ||
                    "Cake",

                image_url:
                    imageUrl,

                price_500:
                    price500,

                price_1000:
                    price1000,

                available:
                    available

            })
            .replace(/'/g, "&apos;");


        /* -----------------------------------------
           CARD
        ----------------------------------------- */

        const card =
            document.createElement("div");


        card.className =
            "cake-card";


        card.innerHTML = `

            <div class="cake-image-wrap">

                <img
                    class="cake-image"

                    src="${escapeHtml(imageUrl)}"

                    alt="${escapeHtml(
                        cake.name || "Cake"
                    )}"

                    loading="lazy"

                    onerror="
                        this.src='https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800'
                    "
                >

            </div>


            <div class="cake-info">

                <div class="cake-name">

                    ${escapeHtml(
                        cake.name ||
                        "Beautiful Cake"
                    )}

                </div>


                <div class="cake-price">

                    <span>

                        500g:

                        <strong>
                            Rs.
                            ${price500.toLocaleString()}
                        </strong>

                    </span>


                    <span>

                        1kg:

                        <strong>
                            Rs.
                            ${price1000.toLocaleString()}
                        </strong>

                    </span>

                </div>


                <div class="cake-availability ${
                    available
                        ? "available"
                        : "unavailable"
                }">

                    ${
                        available
                            ? "✓ Available"
                            : "✕ Currently unavailable"
                    }

                </div>


                <button

                    class="order-btn"

                    ${available
                        ? ""
                        : "disabled"
                    }

                    onclick='openOrder(${safeCake})'

                >

                    ${
                        available
                            ? "🛒 Order Now"
                            : "Unavailable"
                    }

                </button>

            </div>

        `;


        cakeGrid.appendChild(card);

    });

}


/* =========================================================
   OPEN ORDER MODAL
========================================================= */

function openOrder(cake) {

    selectedCakeData =
        cake;


    const modal =
        document.getElementById(
            "orderModal"
        );


    const modalCakeName =
        document.getElementById(
            "modalCakeName"
        );


    const selectedCake =
        document.getElementById(
            "selectedCake"
        );


    if (!modal) return;


    if (modalCakeName) {

        modalCakeName.textContent =
            cake.name ||
            "Order Cake";

    }


    if (selectedCake) {

        selectedCake.value =
            cake.name ||
            "";

    }


    modal.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";


    updateTotal();


    setTimeout(
        function () {

            const nameInput =
                document.getElementById(
                    "customerName"
                );


            if (nameInput) {

                nameInput.focus();

            }

        },
        200
    );

}


/* =========================================================
   CLOSE ORDER MODAL
========================================================= */

function closeOrder() {

    const modal =
        document.getElementById(
            "orderModal"
        );


    if (!modal) return;


    modal.classList.remove(
        "active"
    );


    document.body.style.overflow =
        "";

}


/* =========================================================
   UPDATE TOTAL PRICE
========================================================= */

function updateTotal() {

    if (!selectedCakeData) return;


    const weightElement =
        document.getElementById(
            "cakeWeight"
        );


    const totalElement =
        document.getElementById(
            "totalPrice"
        );


    if (!weightElement ||
        !totalElement) {

        return;

    }


    const weight =
        weightElement.value;


    let price =
        0;


    if (weight === "500g") {

        price =
            Number(
                selectedCakeData.price_500 ||
                0
            );

    }


    if (weight === "1kg") {

        price =
            Number(
                selectedCakeData.price_1000 ||
                0
            );

    }


    totalElement.textContent =
        "Rs. " +
        price.toLocaleString();

}


/* =========================================================
   WEIGHT CHANGE
========================================================= */

const cakeWeight =
    document.getElementById(
        "cakeWeight"
    );


if (cakeWeight) {

    cakeWeight.addEventListener(
        "change",
        updateTotal
    );

}


/* =========================================================
   SUBMIT ORDER
========================================================= */

const orderForm =
    document.getElementById(
        "orderForm"
    );


if (orderForm) {

    orderForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            /* -----------------------------------------
               CHECK CAKE
            ----------------------------------------- */

            if (!selectedCakeData) {

                alert(
                    "Please select a cake first."
                );

                return;

            }


            /* -----------------------------------------
               GET FORM VALUES
            ----------------------------------------- */

            const customerName =
                document.getElementById(
                    "customerName"
                )?.value.trim() || "";


            const customerPhone =
                document.getElementById(
                    "customerPhone"
                )?.value.trim() || "";


            const weight =
                document.getElementById(
                    "cakeWeight"
                )?.value || "";


            const requiredDate =
                document.getElementById(
                    "requiredDate"
                )?.value || "";


            const requiredTime =
                document.getElementById(
                    "requiredTime"
                )?.value || "";


            const cakeMessage =
                document.getElementById(
                    "cakeMessage"
                )?.value.trim() || "";


            const deliveryDetails =
                document.getElementById(
                    "deliveryDetails"
                )?.value.trim() || "";


            /* -----------------------------------------
               VALIDATE
            ----------------------------------------- */

            if (!customerName) {

                alert(
                    "Please enter your name."
                );

                return;

            }


            if (!customerPhone) {

                alert(
                    "Please enter your contact number."
                );

                return;

            }


            if (!weight) {

                alert(
                    "Please select cake weight."
                );

                return;

            }


            if (!requiredDate) {

                alert(
                    "Please select required date."
                );

                return;

            }


            if (!requiredTime) {

                alert(
                    "Please select required time."
                );

                return;

            }


            /* -----------------------------------------
               PRICE
            ----------------------------------------- */

            let price =
                0;


            if (weight === "500g") {

                price =
                    Number(
                        selectedCakeData.price_500 ||
                        0
                    );

            }


            if (weight === "1kg") {

                price =
                    Number(
                        selectedCakeData.price_1000 ||
                        0
                    );

            }


            /* -----------------------------------------
               CAKE PHOTO URL
            ----------------------------------------- */

            const cakeImageUrl =
                selectedCakeData.image_url ||
                "";


            let cakePhotoText =
                "📸 Cake Design Photo:\nNot available";


            if (cakeImageUrl) {

                cakePhotoText =
                    `📸 Cake Design Photo:
${cakeImageUrl}`;

            }


            /* -----------------------------------------
               WHATSAPP MESSAGE
            ----------------------------------------- */

            const text =

`🍰 *NEW CAKE ORDER*

👤 *Customer Name:*
${customerName}

📞 *Contact:*
${customerPhone}

🎂 *Cake:*
${selectedCakeData.name}

⚖️ *Weight:*
${weight}

💰 *Price:*
Rs. ${price.toLocaleString()}

📅 *Required Date:*
${requiredDate}

⏰ *Required Time:*
${requiredTime}

✍️ *Cake Writing / Special Message:*
${cakeMessage || "None"}

📍 *Pickup / Delivery Details:*
${deliveryDetails || "Not specified"}

${cakePhotoText}

Thank you! ❤️`;


            /* -----------------------------------------
               ENCODE WHATSAPP MESSAGE
            ----------------------------------------- */

            const encodedText =
                encodeURIComponent(
                    text
                );


            /* -----------------------------------------
               WHATSAPP URL
            ----------------------------------------- */

            const whatsappUrl =
                "https://wa.me/94768727152?text=" +
                encodedText;


            /* -----------------------------------------
               MOBILE + PC
               USE LOCATION INSTEAD OF WINDOW.OPEN
            ----------------------------------------- */

            window.location.href =
                whatsappUrl;


            /* -----------------------------------------
               CLOSE MODAL
            ----------------------------------------- */

            setTimeout(
                function () {

                    closeOrder();

                },
                500
            );

        }
    );

}


/* =========================================================
   DATE MINIMUM = TODAY
========================================================= */

const requiredDateInput =
    document.getElementById(
        "requiredDate"
    );


if (requiredDateInput) {


    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    const today =
        `${year}-${month}-${day}`;


    requiredDateInput.min =
        today;

}


/* =========================================================
   MODAL BACKGROUND CLICK
========================================================= */

const orderModal =
    document.getElementById(
        "orderModal"
    );


if (orderModal) {

    orderModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                orderModal
            ) {

                closeOrder();

            }

        }
    );

}


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeOrder();

        }

    }
);


/* =========================================================
   BACK TO TOP
========================================================= */

const backToTop =
    document.getElementById(
        "backToTop"
    );


if (backToTop) {


    window.addEventListener(
        "scroll",
        function () {

            if (
                window.scrollY >
                400
            ) {

                backToTop.classList.add(
                    "show"
                );

            } else {

                backToTop.classList.remove(
                    "show"
                );

            }

        },
        {
            passive: true
        }
    );


    backToTop.addEventListener(
        "click",
        function () {

            window.scrollTo({

                top: 0,

                behavior: "smooth"

            });

        }
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}
/* =========================================================
   START WEBSITE
========================================================= */
document.addEventListener(
    "DOMContentLoaded",
    function () {
        loadCakes();
    }
);
