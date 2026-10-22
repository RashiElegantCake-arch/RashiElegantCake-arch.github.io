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
   Custom orders + configurable regular orders
========================================= */

let calendarViewDate = new Date();
let calendarSelectedDate = localDateString();
let calendarOrdersByDate = {};
let calendarLoading = false;

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

function calendarMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
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

        const selectedClass = dateKey === calendarSelectedDate ? " selected" : "";
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
        const name = calendarEscape(
            order.customer_name || order.name || "Customer"
        );

        const phone = calendarEscape(
            order.customer_phone || order.customerPhone || order.phone || "Not provided"
        );

        const time = calendarEscape(
            order.required_time || order.requiredTime || order.time || "Not specified"
        );

        const weight = calendarEscape(
            order.cake_weight || order.weight || "Not specified"
        );

        const writing = calendarEscape(
            order.cake_writing || order.message || "None"
        );

        const delivery = calendarEscape(
            order.delivery_details || order.delivery || "Not specified"
        );

        const cakeName = calendarEscape(
            order.cake_name || order.cakeName || order.name_of_cake || "Custom cake"
        );

        const imageUrl = isCustom
            ? order.reference_image_url
            : (order.image_url || order.cake_image_url || "");

        const imageHtml = imageUrl
            ? `<p><a href="${calendarEscape(imageUrl)}" target="_blank" rel="noopener noreferrer">View photo</a></p>
               <a href="${calendarEscape(imageUrl)}" target="_blank" rel="noopener noreferrer">
                 <img src="${calendarEscape(imageUrl)}" alt="Cake reference photo" loading="lazy">
               </a>`
            : "";

        return `
            <article class="calendar-order-card">
                <span class="calendar-order-type">
                    ${isCustom ? "Custom Cake Order" : "Regular Cake Order"}
                </span>
                <h4>${name}</h4>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Time:</strong> ${time}</p>
                <p><strong>Weight:</strong> ${weight}</p>
                ${isCustom ? `<p><strong>Cake writing:</strong> ${writing}</p>` : ""}
                ${isCustom ? `<p><strong>Pickup / delivery:</strong> ${delivery}</p>` : ""}
                ${!isCustom ? `<p><strong>Cake:</strong> ${cakeName}</p>` : ""}
                <p><strong>Status:</strong> ${calendarEscape(order.status || "pending")}</p>
                ${imageHtml}
            </article>
        `;
    }).join("");
}

async function loadOrderCalendar() {
    if (calendarLoading) return;
    calendarLoading = true;

    const status = document.getElementById("calendarStatus");

    try {
        if (typeof supabaseClient === "undefined" || !supabaseClient) {
            if (status) status.textContent = "Supabase is not connected.";
            return;
        }

        const start = `${calendarMonthKey(calendarViewDate)}-01`;
        const endDate = new Date(
            calendarViewDate.getFullYear(),
            calendarViewDate.getMonth() + 1,
            0
        );
        const end = localDateString(endDate);

        const { data, error } = await supabaseClient
            .from("custom_cake_requests")
            .select("*")
            .gte("required_date", start)
            .lte("required_date", end)
            .order("required_time", { ascending: true });

        if (error) throw error;

        calendarOrdersByDate = {};

        (data || []).forEach(order => {
            if (!order.required_date) return;

            if (!calendarOrdersByDate[order.required_date]) {
                calendarOrdersByDate[order.required_date] = [];
            }

            calendarOrdersByDate[order.required_date].push({
                ...order,
                orderType: "custom"
            });
        });

        renderMonthlyCalendar();
        renderSelectedDayOrders();

    } catch (error) {
        console.error("Monthly order calendar error:", error);
        if (status) {
            status.textContent =
                "Could not load custom orders. Check Supabase table permissions.";
        }
    } finally {
        calendarLoading = false;
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
        loadOrderCalendar();
    });

    next.addEventListener("click", () => {
        calendarViewDate = new Date(
            calendarViewDate.getFullYear(),
            calendarViewDate.getMonth() + 1,
            1
        );
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

/* Refresh calendar whenever admin opens the panel */
const originalShowPanelForCalendar = showPanel;

showPanel = function () {
    originalShowPanelForCalendar();
    loadOrderCalendar();
};
