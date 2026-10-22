const ADMIN_PASSWORD = "Rashi@2026";
let editImage = null;
let imageFileToUpload = null;

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500";

function esc(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function login() {
  if (document.getElementById("adminPassword").value === ADMIN_PASSWORD) {
    sessionStorage.setItem("rashiAdmin", "1");
    showPanel();
  } else {
    document.getElementById("loginError").textContent = "Incorrect password.";
  }
}

function logout() {
  sessionStorage.removeItem("rashiAdmin");
  location.reload();
}

function showPanel() {
  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("panel").classList.remove("hidden");
  loadAdminCakes();
}

async function loadAdminCakes() {
  const list = document.getElementById("adminList");
  list.innerHTML = "<p>Loading cakes...</p>";

  if (typeof supabaseClient !== "undefined" && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
.from("cakes")
.select("*")
.order("display_order", { ascending: true });
      if (!error && data) {
        renderAdminList(data);
        return;
      }
    } catch (err) {
      console.error("Supabase load error:", err);
    }
  }
  
  const localData = localStorage.getItem("rashiCakes");
  renderAdminList(localData ? JSON.parse(localData) : []);
}

function renderAdminList(cakes) {
  const list = document.getElementById("adminList");
  list.innerHTML = cakes.map(c => {
    const imgUrl = (c.image_url && !c.image_url.includes("images/cake-placeholder")) ? c.image_url : FALLBACK_IMAGE;
    const p500 = c.price_500 || c.p500 || 0;
    const p1000 = c.price_1000 || c.p1000 || 0;
    const avail = c.available !== undefined ? c.available : true;
    
    return `
      <div class="admin-row">
        <img src="${imgUrl}" onerror="this.src='${FALLBACK_IMAGE}'">
        <div>
<b>${String(c.display_order ?? 0).padStart(2, "0")}. ${esc(c.name)}</b><br>
          <small>500g: Rs. ${Number(p500).toLocaleString()} • 1KG: Rs. ${Number(p1000).toLocaleString()} • ${avail ? "Available" : "Unavailable"}</small>
        </div>
        <div class="actions">
          <button class="smallbtn edit" onclick="editCake('${c.id}')">Edit</button>
          <button class="smallbtn delete" onclick="deleteCake('${c.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join("") || "<p>No cakes. Add your first design.</p>";
}

document.getElementById("aImage").addEventListener("change", e => {
  const f = e.target.files[0];
  if (!f) return;
  imageFileToUpload = f;
  
  const r = new FileReader();
  r.onload = () => {
    editImage = r.result;
    document.getElementById("preview").innerHTML = `<img src="${editImage}">`;
  };
  r.readAsDataURL(f);
});

document.getElementById("cakeForm").addEventListener("submit", async e => {
  e.preventDefault();
  const id = document.getElementById("editId").value;
  const name = document.getElementById("aName").value.trim();
  const p500 = Number(document.getElementById("a500").value);
  const p1000 = Number(document.getElementById("a1000").value);
  const available = document.getElementById("aAvailable").checked;

  let finalImageUrl = editImage || FALLBACK_IMAGE;

  // Upload Photo to Supabase Storage Bucket ('cake-images')
  if (imageFileToUpload && typeof supabaseClient !== "undefined" && supabaseClient) {
    try {
      const fileName = `${Date.now()}_${imageFileToUpload.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from("cake-images")
        .upload(fileName, imageFileToUpload);

      if (!uploadError) {
        const { data: publicUrlData } = supabaseClient.storage
          .from("cake-images")
          .getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      } else {
        console.error("Storage upload error:", uploadError);
      }
    } catch (err) {
      console.error("Storage upload exception:", err);
    }
  }

  const dbPayload = {
    name: name,
    image_url: finalImageUrl,
    price_500: p500,
    price_1000: p1000,
    available: available
  };

  if (typeof supabaseClient !== "undefined" && supabaseClient) {
    try {
      if (id) {
        await supabaseClient.from("cakes").update(dbPayload).eq("id", id);
      } else {
        await supabaseClient.from("cakes").insert([dbPayload]);
      }
    } catch (err) {
      console.error("DB Save Exception:", err);
    }
  }

  resetForm();
  await loadAdminCakes();
  alert("Cake saved successfully!");
});

async function editCake(id) {
  let cake = null;
  if (typeof supabaseClient !== "undefined" && supabaseClient) {
    const { data } = await supabaseClient.from("cakes").select("*").eq("id", id).single();
    if (data) cake = data;
  }

  if (!cake) return;

  document.getElementById("editId").value = cake.id;
  document.getElementById("aName").value = cake.name;
  document.getElementById("a500").value = cake.price_500;
  document.getElementById("a1000").value = cake.price_1000;
  document.getElementById("aAvailable").checked = cake.available;
  
  editImage = cake.image_url;
  imageFileToUpload = null;

  document.getElementById("preview").innerHTML = `<img src="${editImage || FALLBACK_IMAGE}">`;
  document.getElementById("formTitle").textContent = "Edit Cake";
  document.getElementById("cancelEdit").classList.remove("hidden");
  scrollTo(0, 0);
}

async function deleteCake(id) {
  if (!confirm("Delete this cake design?")) return;

  if (typeof supabaseClient !== "undefined" && supabaseClient) {
    await supabaseClient.from("cakes").delete().eq("id", id);
  }

  loadAdminCakes();
}

function resetForm() {
  document.getElementById("cakeForm").reset();
  document.getElementById("editId").value = "";
  document.getElementById("preview").innerHTML = "";
  document.getElementById("formTitle").textContent = "Add New Cake";
  document.getElementById("cancelEdit").classList.add("hidden");
  editImage = null;
  imageFileToUpload = null;
}

if (sessionStorage.getItem("rashiAdmin") === "1") {
  showPanel();
}









/* =========================================
   MONTHLY ORDER CALENDAR
   Regular + Custom Orders
   Shows cake/reference photos
========================================= */

let calendarViewDate = new Date();
let calendarSelectedDate = localDateString();
let calendarOrdersByDate = {};
let calendarLoading = false;
let calendarLoadVersion = 0;

function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function calendarEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[char]));
}

function calendarSafeImageUrl(value) {
    if (!value) return "";

    try {
        const url = new URL(String(value), window.location.href);

        if (url.protocol !== "https:" && url.protocol !== "http:") {
            return "";
        }

        return url.href;
    } catch {
        return "";
    }
}

function calendarMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function calendarTimeValue(value) {
    if (!value) return "Not specified";

    const match = String(value).match(/^(\d{1,2}):(\d{2})/);

    if (!match) return calendarEscape(value);

    let hour = Number(match[1]);
    const minute = match[2];
    const suffix = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;
}

function renderMonthlyCalendar() {
    const title = document.getElementById("calendarMonthTitle");
    const days = document.getElementById("calendarDays");

    if (!title || !days) return;

    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    title.textContent = calendarViewDate.toLocaleDateString("en", {
        month: "long",
        year: "numeric"
    });

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today = localDateString();

    let html = "";

    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day empty" aria-hidden="true"></div>';
    }

    for (let day = 1; day <= totalDays; day++) {
        const dateKey =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const orders = calendarOrdersByDate[dateKey] || [];
        const regularCount = orders.filter(o => o.orderType === "regular").length;
        const customCount = orders.filter(o => o.orderType === "custom").length;

        let typeClass = "";
        let countText = "";

        if (regularCount && customCount) {
            typeClass = "has-both";
            countText = `${orders.length} orders`;
        } else if (customCount) {
            typeClass = "has-custom";
            countText = `${customCount} custom`;
        } else if (regularCount) {
            typeClass = "has-regular";
            countText = `${regularCount} orders`;
        }

        const selectedClass =
            dateKey === calendarSelectedDate ? " selected" : "";

        const todayClass = dateKey === today ? " today" : "";

        html += `
            <button
                type="button"
                class="calendar-day ${typeClass}${selectedClass}${todayClass}"
                data-calendar-date="${dateKey}"
                aria-label="${dateKey}${orders.length ? `, ${orders.length} orders` : ""}"
                aria-pressed="${dateKey === calendarSelectedDate}"
            >
                <span class="day-number">${day}</span>
                <span class="day-count">${calendarEscape(countText)}</span>
            </button>
        `;
    }

    days.innerHTML = html;

    days.querySelectorAll("[data-calendar-date]").forEach(button => {
        button.addEventListener("click", () => {
            calendarSelectedDate = button.dataset.calendarDate;

            renderMonthlyCalendar();
            renderSelectedDayOrders();
        });
    });
}

function renderSelectedDayOrders() {
    const title = document.getElementById("selectedDateTitle");
    const status = document.getElementById("calendarStatus");
    const output = document.getElementById("calendarOrders");

    if (!title || !status || !output) return;

    title.textContent = new Date(
        `${calendarSelectedDate}T12:00:00`
    ).toLocaleDateString("en", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    const orders = calendarOrdersByDate[calendarSelectedDate] || [];

    if (!orders.length) {
        status.textContent = "No orders found for this date.";
        output.innerHTML = "";
        return;
    }

    status.textContent = `${orders.length} order(s) found.`;

    output.innerHTML = orders.map(order => {
        const isCustom = order.orderType === "custom";

        const customerName = calendarEscape(
            order.customer_name || "Customer"
        );

        const phone = calendarEscape(
            order.customer_phone || "Not provided"
        );

        const time = calendarEscape(
            calendarTimeValue(order.required_time)
        );

        const weight = calendarEscape(
            order.cake_weight || "Not specified"
        );

        const statusText = calendarEscape(
            order.status || "pending"
        );

        const cakeName = calendarEscape(
            order.cake_name || (isCustom ? "Custom cake" : "Cake order")
        );

const imageUrl = calendarSafeImageUrl(
    isCustom
        ? (order.reference_image_url || "")
        : (order.cake_image_url || order.image_url || "")
);
        const imageHtml = imageUrl
            ? `
                <a href="${calendarEscape(imageUrl)}"
                   target="_blank"
                   rel="noopener noreferrer">
                    <img
                        src="${calendarEscape(imageUrl)}"
                        alt="${isCustom ? "Custom cake reference photo" : "Ordered cake photo"}"
                        loading="lazy"
                    >
                </a>
                <p>
                    <a href="${calendarEscape(imageUrl)}"
                       target="_blank"
                       rel="noopener noreferrer">
                        View full photo
                    </a>
                </p>
              `
            : `<p><strong>Photo:</strong> Not available for this order</p>`;

        const writing = isCustom
            ? order.cake_writing
            : order.cake_message;

        const delivery = order.delivery_details || "Not specified";

        return `
            <article class="calendar-order-card">
                <span class="calendar-order-type">
                    ${isCustom ? "Custom Cake Order" : "Regular Cake Order"}
                </span>

                <h4>${customerName}</h4>

                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Time:</strong> ${time}</p>
                <p><strong>Weight:</strong> ${weight}</p>
                <p><strong>Cake:</strong> ${cakeName}</p>

                ${!isCustom && order.total_price != null
                    ? `<p><strong>Total:</strong> Rs. ${calendarEscape(order.total_price)}</p>`
                    : ""}

                ${writing
                    ? `<p><strong>Cake writing/message:</strong> ${calendarEscape(writing)}</p>`
                    : ""}

                <p><strong>Pickup / delivery:</strong> ${calendarEscape(delivery)}</p>
                <p><strong>Status:</strong> ${statusText}</p>

                ${imageHtml}
            </article>
        `;
    }).join("");
}

async function loadOrderCalendar() {
    const thisLoad = ++calendarLoadVersion;

    const status = document.getElementById("calendarStatus");

    if (typeof supabaseClient === "undefined" || !supabaseClient) {
        if (status) status.textContent = "Supabase is not connected.";
        return;
    }

    const start = `${calendarMonthKey(calendarViewDate)}-01`;

    const end = localDateString(
        new Date(
            calendarViewDate.getFullYear(),
            calendarViewDate.getMonth() + 1,
            0
        )
    );

    if (status) status.textContent = "Loading orders...";

    try {
        const [regularResult, customResult] = await Promise.all([
            supabaseClient
                .from("regular_cake_orders")
                .select("*")
                .gte("required_date", start)
                .lte("required_date", end),

            supabaseClient
        .from("custom_cake_requests")
        .select("*")
        .order("required_date", { ascending: true })
        ]);
console.log("Calendar month:", start, "to", end);
console.log("Custom orders error:", customResult.error);
console.log("Custom orders received:", customResult.data);
        // Ignore outdated results if the month changed while loading.
        if (thisLoad !== calendarLoadVersion) return;

        if (regularResult.error) {
            console.error("Regular orders query error:", regularResult.error);
        }

        if (customResult.error) {
            console.error("Custom orders query error:", customResult.error);
        }

        if (regularResult.error && customResult.error) {
            throw new Error(
                "Could not read either order table. Check Supabase permissions and table names."
            );
        }

        calendarOrdersByDate = {};

        function addOrders(records, type) {
            (records || []).forEach(order => {
                if (!order.required_date) return;

                const dateKey = String(order.required_date).slice(0, 10);

                if (!calendarOrdersByDate[dateKey]) {
                    calendarOrdersByDate[dateKey] = [];
                }

                calendarOrdersByDate[dateKey].push({
                    ...order,
                    orderType: type
                });
            });
        }

        if (!regularResult.error) {
            addOrders(regularResult.data, "regular");
        }

        if (!customResult.error) {
            addOrders(customResult.data, "custom");
        }

        // Sort each date by required time.
        Object.values(calendarOrdersByDate).forEach(orders => {
            orders.sort((a, b) =>
                String(a.required_time || "").localeCompare(
                    String(b.required_time || "")
                )
            );
        });

        renderMonthlyCalendar();
        renderSelectedDayOrders();

        if (regularResult.error || customResult.error) {
            if (status) {
                status.textContent =
                    "Some orders could not be loaded. Check the browser console and Supabase permissions.";
            }
        }

    } catch (error) {
        if (thisLoad !== calendarLoadVersion) return;

        console.error("Monthly order calendar error:", error);

        if (status) {
            status.textContent =
                "Could not load orders. Check Supabase connection, table names, and read permissions.";
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const previous = document.getElementById("calendarPrev");
    const next = document.getElementById("calendarNext");
    const today = document.getElementById("calendarToday");

    if (!previous || !next || !today) return;

    previous.addEventListener("click", () => {
        calendarViewDate = new Date(
            calendarViewDate.getFullYear(),
            calendarViewDate.getMonth() - 1,
            1
        );

        calendarSelectedDate = localDateString(calendarViewDate);
        loadOrderCalendar();
    });

    next.addEventListener("click", () => {
        calendarViewDate = new Date(
            calendarViewDate.getFullYear(),
            calendarViewDate.getMonth() + 1,
            1
        );

        calendarSelectedDate = localDateString(calendarViewDate);
        loadOrderCalendar();
    });

    today.addEventListener("click", () => {
        calendarViewDate = new Date();
        calendarSelectedDate = localDateString();

        loadOrderCalendar();
    });

    calendarSelectedDate = localDateString();
    loadOrderCalendar();
});

/* Refresh the calendar when the admin panel opens */
const originalShowPanelForCalendar = showPanel;

showPanel = function () {
    originalShowPanelForCalendar();
    loadOrderCalendar();
};
