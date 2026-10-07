/* =========================================================
   RASHI ELEGANT CAKE
   MAIN WEBSITE SCRIPT
========================================================= */

let selectedCake = null;


/* =========================================================
   FALLBACK IMAGE
========================================================= */

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800";


/* =========================================================
   ESCAPE HTML
========================================================= */

function esc(value) {

  return String(value ?? "").replace(/[&<>"']/g, function (m) {

    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m];

  });

}


/* =========================================================
   LOAD CAKES
========================================================= */

async function loadCakes() {

  const grid = document.getElementById("cakeGrid");

  if (!grid) return;

  grid.innerHTML = `
    <div class="loading-box">
      <div class="loading-spinner"></div>
      <p>Loading beautiful cakes...</p>
    </div>
  `;


  /* -----------------------------------------
     SUPABASE
  ----------------------------------------- */

  if (
    typeof supabaseClient !== "undefined" &&
    supabaseClient
  ) {

    try {

      const {
        data,
        error
      } = await supabaseClient
        .from("cakes")
        .select("*")
        .order("id", { ascending: false });


      if (!error && data) {

        renderCakes(data);

        return;
      }

      console.error("Supabase error:", error);

    } catch (error) {

      console.error(
        "Supabase loading error:",
        error
      );

    }

  }


  /* -----------------------------------------
     LOCAL STORAGE FALLBACK
  ----------------------------------------- */

  try {

    const localData =
      localStorage.getItem("rashiCakes");

    if (localData) {

      renderCakes(JSON.parse(localData));

      return;
    }

  } catch (error) {

    console.error(
      "Local storage error:",
      error
    );

  }


  grid.innerHTML = `
    <div class="loading-box">
      <p>Unable to load cakes right now.</p>
    </div>
  `;

}


/* =========================================================
   RENDER CAKES
========================================================= */

function renderCakes(cakes) {

  const grid =
    document.getElementById("cakeGrid");

  if (!grid) return;


  if (!cakes || !cakes.length) {

    grid.innerHTML = `
      <div class="loading-box">
        <p>No cake designs available yet.</p>
      </div>
    `;

    return;
  }


  grid.innerHTML = cakes.map(function (cake) {

    const image =
      cake.image_url &&
      !cake.image_url.includes(
        "cake-placeholder"
      )
        ? cake.image_url
        : FALLBACK_IMAGE;


    const price500 =
      Number(
        cake.price_500 ||
        cake.p500 ||
        0
      );


    const price1000 =
      Number(
        cake.price_1000 ||
        cake.p1000 ||
        0
      );


    const available =
      cake.available !== undefined
        ? cake.available
        : true;


    return `

      <article class="cake-card
        ${available ? "" : "unavailable"}">

        <img
          src="${esc(image)}"
          alt="${esc(cake.name)} cake"
          loading="lazy"
          onerror="this.src='${FALLBACK_IMAGE}'"
        >

        <div class="cake-body">

          <span class="badge">
            ${available ? "AVAILABLE" : "UNAVAILABLE"}
          </span>

          <h3>
            ${esc(cake.name)}
          </h3>

          <div class="prices">

            <div class="price">
              500g<br>
              <strong>
                Rs. ${price500.toLocaleString()}
              </strong>
            </div>

            <div class="price">
              1KG<br>
              <strong>
                Rs. ${price1000.toLocaleString()}
              </strong>
            </div>

          </div>

          ${
            available

              ? `
                <button
                  class="btn primary-btn"
                  onclick="openOrder(${JSON.stringify(cake).replace(/"/g, "&quot;")})">

                  🎂 Order This Cake

                </button>
              `

              : `
                <button
                  class="btn"
                  disabled
                  style="
                    background:#ddd;
                    color:#777;
                    cursor:not-allowed;
                    box-shadow:none;
                  ">

                  Currently Unavailable

                </button>
              `
          }

        </div>

      </article>

    `;

  }).join("");

}


/* =========================================================
   OPEN ORDER MODAL
========================================================= */

function openOrder(cake) {

  selectedCake = cake;


  const modal =
    document.getElementById("orderModal");

  const selected =
    document.getElementById("selectedCake");

  const cakeName =
    document.getElementById("cakeName");

  const weight =
    document.getElementById("weight");


  const image =
    cake.image_url &&
    !cake.image_url.includes(
      "cake-placeholder"
    )
      ? cake.image_url
      : FALLBACK_IMAGE;


  const price500 =
    Number(
      cake.price_500 ||
      cake.p500 ||
      0
    );


  const price1000 =
    Number(
      cake.price_1000 ||
      cake.p1000 ||
      0
    );


  selected.innerHTML = `

    <img
      src="${esc(image)}"
      alt="${esc(cake.name)}"
      onerror="this.src='${FALLBACK_IMAGE}'"
    >

    <div>
      <span class="eyebrow">
        SELECTED CAKE
      </span>

      <br>

      <b>
        ${esc(cake.name)}
      </b>
    </div>

  `;


  cakeName.value =
    cake.name || "";


  weight.innerHTML = `

    <option value="500g"
      data-price="${price500}">
      500g - Rs. ${price500.toLocaleString()}
    </option>

    <option value="1KG"
      data-price="${price1000}">
      1KG - Rs. ${price1000.toLocaleString()}
    </option>

  `;


  updateTotal();


  modal.classList.remove("hidden");

  document.body.style.overflow = "hidden";

}


/* =========================================================
   CLOSE ORDER MODAL
========================================================= */

function closeOrder() {

  const modal =
    document.getElementById("orderModal");

  if (!modal) return;

  modal.classList.add("hidden");

  document.body.style.overflow = "";

}


/* =========================================================
   UPDATE PRICE
========================================================= */

function updateTotal() {

  const weight =
    document.getElementById("weight");

  const total =
    document.getElementById("total");


  if (!weight || !total) return;


  const option =
    weight.options[
      weight.selectedIndex
    ];


  const price =
    Number(
      option?.dataset.price || 0
    );


  total.innerHTML = `
    Total Price:
    <strong>
      Rs. ${price.toLocaleString()}
    </strong>
  `;

}


/* =========================================================
   FORM SUBMIT
========================================================= */

async function submitOrder(event) {

  event.preventDefault();


  if (!selectedCake) {

    alert("Please select a cake first.");

    return;
  }


  const customerName =
    document
      .getElementById("customerName")
      .value
      .trim();


  const customerPhone =
    document
      .getElementById("customerPhone")
      .value
      .trim();


  const cakeName =
    document
      .getElementById("cakeName")
      .value
      .trim();


  const weight =
    document
      .getElementById("weight")
      .value;


  const date =
    document
      .getElementById("date")
      .value;


  const time =
    document
      .getElementById("time")
      .value;


  const message =
    document
      .getElementById("message")
      .value
      .trim();


  const address =
    document
      .getElementById("address")
      .value
      .trim();


  const weightSelect =
    document.getElementById("weight");


  const selectedOption =
    weightSelect.options[
      weightSelect.selectedIndex
    ];


  const price =
    Number(
      selectedOption?.dataset.price || 0
    );


  if (!customerName ||
      !customerPhone ||
      !date ||
      !time ||
      !address) {

    alert(
      "Please fill in all required details."
    );

    return;
  }


  /* -----------------------------------------
     WHATSAPP MESSAGE
  ----------------------------------------- */

  const text =

`🎂 *NEW CAKE ORDER*

👤 Customer Name:
${customerName}

📱 Contact Number:
${customerPhone}

🎂 Cake Design:
${cakeName}

⚖️ Weight:
${weight}

💰 Price:
Rs. ${price.toLocaleString()}

📅 Required Date:
${date}

⏰ Required Time:
${time}

📝 Cake Writing / Special Message:
${message || "None"}

📍 Pickup / Delivery Details:
${address}

━━━━━━━━━━━━━━
🍰 Rashi Elegant Cake
Thank you for your order! 💗`;


  const whatsappURL =
    "https://wa.me/94768727152?text=" +
    encodeURIComponent(text);


  window.open(
    whatsappURL,
    "_blank"
  );

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {


    /* Load cakes */

    loadCakes();


    /* Weight price */

    const weight =
      document.getElementById("weight");

    if (weight) {

      weight.addEventListener(
        "change",
        updateTotal
      );

    }


    /* Order form */

    const form =
      document.getElementById("orderForm");

    if (form) {

      form.addEventListener(
        "submit",
        submitOrder
      );

    }


    /* Modal background click */

    const modal =
      document.getElementById("orderModal");

    if (modal) {

      modal.addEventListener(
        "click",
        function (event) {

          if (
            event.target === modal
          ) {

            closeOrder();

          }

        }
      );

    }


    /* Back to top */

    const backTop =
      document.getElementById("backTop");

    window.addEventListener(
      "scroll",
      function () {

        if (!backTop) return;

        if (window.scrollY > 500) {

          backTop.style.display =
            "flex";

        } else {

          backTop.style.display =
            "none";

        }

      }
    );


    if (backTop) {

      backTop.style.display = "none";

    }


    /* Today's date as minimum date */

    const dateInput =
      document.getElementById("date");

    if (dateInput) {

      const today =
        new Date()
          .toISOString()
          .split("T")[0];

      dateInput.min = today;

    }

  }
);


/* =========================================================
   ESC KEY CLOSE MODAL
========================================================= */

document.addEventListener(
  "keydown",
  function (event) {

    if (event.key === "Escape") {

      closeOrder();

    }

  }
);
