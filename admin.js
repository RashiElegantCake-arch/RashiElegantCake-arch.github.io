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





/* ================= ORDER CALENDAR ================= */

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

async function loadOrderCalendar() {
  const dateInput = document.getElementById("calendarDate");
  const status = document.getElementById("calendarStatus");
  const output = document.getElementById("calendarOrders");

  if (!dateInput || !status || !output) return;

  const selectedDate = dateInput.value;
  output.innerHTML = "";
  status.textContent = "Loading orders...";

  if (typeof supabaseClient === "undefined" || !supabaseClient) {
    status.textContent = "Supabase is not connected.";
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("custom_cake_requests")
      .select("*")
      .eq("required_date", selectedDate)
      .order("required_time", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      status.textContent = "No custom cake orders found for this date.";
      return;
    }

    status.textContent = `${data.length} custom cake order(s) found.`;

    output.innerHTML = data.map(order => {
      const name = calendarEscape(order.customer_name);
      const phone = calendarEscape(order.customer_phone);
      const weight = calendarEscape(order.cake_weight);
      const time = calendarEscape(order.required_time || "Not specified");
      const writing = calendarEscape(order.cake_writing || "None");
      const delivery = calendarEscape(order.delivery_details || "Not specified");
      const image = order.reference_image_url
        ? `<p><a href="${calendarEscape(order.reference_image_url)}" target="_blank" rel="noopener noreferrer">View reference photo</a></p>`
        : "";

      return `
        <div class="admin-row" style="grid-template-columns:1fr; margin-top:10px">
          <div>
            <b>${name}</b>
            <small>
              Phone: ${phone}<br>
              Weight: ${weight}<br>
              Time: ${time}<br>
              Cake writing: ${writing}<br>
              Delivery / pickup: ${delivery}<br>
              Status: ${calendarEscape(order.status || "pending")}
            </small>
            ${image}
          </div>
        </div>
      `;
    }).join("");

  } catch (error) {
    console.error("Order calendar error:", error);
    status.textContent =
      "Could not load orders. Check Supabase table permissions and column names.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("calendarDate");
  const refreshButton = document.getElementById("calendarRefresh");

  if (!dateInput || !refreshButton) return;

  dateInput.value = localDateString();
  dateInput.addEventListener("change", loadOrderCalendar);
  refreshButton.addEventListener("click", loadOrderCalendar);
});

const originalShowPanelForCalendar = showPanel;

showPanel = function () {
  originalShowPanelForCalendar();
  loadOrderCalendar();
};
