const ADMIN_PASSWORD = "Rashi@2026";
let editImage = null;
let imageFileToUpload = null;

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

// Fetch cakes from Supabase
async function loadAdminCakes() {
  const list = document.getElementById("adminList");
  list.innerHTML = "<p>Loading cakes...</p>";

  if (typeof supabaseClient !== "undefined" && supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from("cakes").select("*");
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
    const imgUrl = c.image_url || c.image || "images/cake-placeholder-1.svg";
    const p500 = c.price_500g || c.p500 || 0;
    const p1000 = c.price_1kg || c.p1000 || 0;
    const avail = c.is_available !== undefined ? c.is_available : (c.available !== undefined ? c.available : true);
    
    return `
      <div class="admin-row">
        <img src="${imgUrl}">
        <div>
          <b>${esc(c.name)}</b><br>
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

// Image file selection
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

// Form Submit -> Upload image & Save to Supabase
document.getElementById("cakeForm").addEventListener("submit", async e => {
  e.preventDefault();
  const id = document.getElementById("editId").value;
  const name = document.getElementById("aName").value.trim();
  const p500 = Number(document.getElementById("a500").value);
  const p1000 = Number(document.getElementById("a1000").value);
  const available = document.getElementById("aAvailable").checked;

  let finalImageUrl = editImage || "images/cake-placeholder-1.svg";

  // Upload photo to Supabase Storage
  if (imageFileToUpload && typeof supabaseClient !== "undefined" && supabaseClient) {
    try {
      const fileName = `${Date.now()}_${imageFileToUpload.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from("cakes")
        .upload(fileName, imageFileToUpload);

      if (!uploadError) {
        const { data: publicUrlData } = supabaseClient.storage
          .from("cakes")
          .getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      } else {
        console.warn("Storage upload warning:", uploadError);
      }
    } catch (err) {
      console.error("Storage upload exception:", err);
    }
  }

  // Save to Supabase Database
  if (typeof supabaseClient !== "undefined" && supabaseClient) {
    try {
      const dbPayload = {
        name: name,
        image_url: finalImageUrl,
        price_500g: p500,
        price_1kg: p1000,
        is_available: available
      };

      if (id) {
        await supabaseClient.from("cakes").update(dbPayload).eq("id", id);
      } else {
        await supabaseClient.from("cakes").insert([dbPayload]);
      }
    } catch (err) {
      console.error("DB Save Exception:", err);
    }
  }

  // Local Storage save
  let localCakes = JSON.parse(localStorage.getItem("rashiCakes") || "[]");
  let obj = {
    id: id || Date.now().toString(),
    name: name,
    image: finalImageUrl,
    p500: p500,
    p1000: p1000,
    available: available
  };

  if (id) {
    localCakes = localCakes.map(c => String(c.id) === String(id) ? obj : c);
  } else {
    localCakes.push(obj);
  }
  localStorage.setItem("rashiCakes", JSON.stringify(localCakes));

  resetForm();
  loadAdminCakes();
  alert("Cake saved successfully!");
});

async function editCake(id) {
  let cake = null;
  
  if (typeof supabaseClient !== "undefined" && supabaseClient) {
    const { data } = await supabaseClient.from("cakes").select("*").eq("id", id).single();
    if (data) cake = data;
  }

  if (!cake) {
    const localCakes = JSON.parse(localStorage.getItem("rashiCakes") || "[]");
    cake = localCakes.find(x => String(x.id) === String(id));
  }

  if (!cake) return;

  document.getElementById("editId").value = cake.id;
  document.getElementById("aName").value = cake.name;
  document.getElementById("a500").value = cake.price_500g || cake.p500;
  document.getElementById("a1000").value = cake.price_1kg || cake.p1000;
  document.getElementById("aAvailable").checked = cake.is_available !== undefined ? cake.is_available : cake.available;
  
  editImage = cake.image_url || cake.image;
  imageFileToUpload = null;

  document.getElementById("preview").innerHTML = `<img src="${editImage}">`;
  document.getElementById("formTitle").textContent = "Edit Cake";
  document.getElementById("cancelEdit").classList.remove("hidden");
  scrollTo(0, 0);
}

async function deleteCake(id) {
  if (!confirm("Delete this cake design?")) return;

  if (typeof supabaseClient !== "undefined" && supabaseClient) {
    await supabaseClient.from("cakes").delete().eq("id", id);
  }

  let localCakes = JSON.parse(localStorage.getItem("rashiCakes") || "[]");
  localCakes = localCakes.filter(c => String(c.id) === String(id));
  localStorage.setItem("rashiCakes", JSON.stringify(localCakes));

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
