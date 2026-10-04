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
    const p500 = c.price_500 || c.p500 || 0;
    const p1000 = c.price_1000 || c.p1000 || 0;
    const avail = c.available !== undefined ? c.available : true;
    
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

  let finalImageUrl = editImage || "images/cake-placeholder-1.svg";

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
        console.error("Upload error:", uploadError);
      }
    } catch (err) {
      console.error("Storage upload exception:", err);
    }
  }

  // Database Save Payload
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
