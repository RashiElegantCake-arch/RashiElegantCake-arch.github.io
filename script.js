const DEFAULT_CAKES = [
  { id: "1", name: "Chocolate Birthday Cake", image: "images/cake-placeholder-1.svg", p500: 2500, p1000: 4500, available: true },
  { id: "2", name: "Strawberry Cream Cake", image: "images/cake-placeholder-2.svg", p500: 2800, p1000: 5000, available: true },
  { id: "3", name: "Buttercream Rose Cake", image: "images/cake-placeholder-3.svg", p500: 3000, p1000: 5500, available: true },
  { id: "4", name: "Pink Birthday Cake", image: "images/cake-placeholder-4.svg", p500: 2700, p1000: 4800, available: true }
];

let cakes = [];
let selected = null;

// LocalStorage load function
function getLocalCakes() {
  const x = localStorage.getItem("rashiCakes");
  if (!x) {
    localStorage.setItem("rashiCakes", JSON.stringify(DEFAULT_CAKES));
    return DEFAULT_CAKES;
  }
  return JSON.parse(x);
}

// Fetch Cakes from Supabase or LocalStorage
async function loadCakesData() {
  if (typeof supabaseClient !== "undefined" && supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from("cakes").select("*");
      if (!error && data && data.length > 0) {
        cakes = data.map(item => ({
          id: String(item.id),
          name: item.name,
          image: item.image_url || item.image || "images/cake-placeholder-1.svg",
          p500: item.price_500g || item.p500 || 0,
          p1000: item.price_1kg || item.p1000 || 0,
          available: item.is_available !== undefined ? item.is_available : (item.available !== undefined ? item.available : true)
        }));
        renderCakes();
        return;
      }
    } catch (err) {
      console.warn("Supabase fetch error, fallback to local:", err);
    }
  }
  
  // Fallback to LocalStorage if Supabase fails or is empty
  cakes = getLocalCakes();
  renderCakes();
}

function renderCakes() {
  const grid = document.getElementById("cakeGrid");
  if (!grid) return;
  
  grid.innerHTML = cakes.map(c => `
    <article class="cake-card ${c.available ? "" : "unavailable"}">
      <img src="${c.image}" alt="${escapeHtml(c.name)}">
      <div class="cake-body">
        <span class="badge">${c.available ? "Available" : "Unavailable"}</span>
        <h3>${escapeHtml(c.name)}</h3>
        <div class="prices">
          <span class="price">500g: Rs. ${Number(c.p500).toLocaleString()}</span>
          <span class="price">1KG: Rs. ${Number(c.p1000).toLocaleString()}</span>
        </div>
        ${c.available ? `<button class="btn" onclick="openOrder('${c.id}')">Order This Cake</button>` : `<button class="btn secondary" disabled>Currently Unavailable</button>`}
      </div>
    </article>
  `).join("") || "<p>No cakes available yet.</p>";
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function openOrder(id) {
  selected = cakes.find(c => c.id === id);
  if (!selected) return;
  
  document.getElementById("selectedCake").innerHTML = `<img src="${selected.image}"><b>${escapeHtml(selected.name)}</b>`;
  document.getElementById("cakeName").value = selected.name;
  document.getElementById("weight").innerHTML = `
    <option value="500">500g - Rs. ${Number(selected.p500).toLocaleString()}</option>
    <option value="1000">1KG - Rs. ${Number(selected.p1000).toLocaleString()}</option>
  `;
  updateTotal();
  document.getElementById("orderModal").classList.remove("hidden");
}

function closeOrder() {
  document.getElementById("orderModal").classList.add("hidden");
}

function updateTotal() {
  if (!selected) return;
  const w = document.getElementById("weight").value;
  document.getElementById("total").textContent = "Total: Rs. " + Number(w === "500" ? selected.p500 : selected.p1000).toLocaleString();
}

document.addEventListener("DOMContentLoaded", () => {
  loadCakesData();
  
  const weightSelect = document.getElementById("weight");
  if (weightSelect) weightSelect.addEventListener("change", updateTotal);
  
  const orderForm = document.getElementById("orderForm");
  if (orderForm) {
    orderForm.addEventListener("submit", e => {
      e.preventDefault();
      const w = document.getElementById("weight").value;
      const price = w === "500" ? selected.p500 : selected.p1000;
      const text = `🍰 Rashi Elegant Cake - New Order%0A%0A👤 Customer Name: ${encodeURIComponent(document.getElementById("customerName").value)}%0A📞 Contact Number: ${encodeURIComponent(document.getElementById("customerPhone").value)}%0A🎂 Cake Design: ${encodeURIComponent(selected.name)}%0A⚖️ Weight: ${w === "500" ? "500g" : "1KG"}%0A💰 Price: Rs. ${price}%0A📅 Required Date: ${encodeURIComponent(document.getElementById("date").value)}%0A🕐 Required Time: ${encodeURIComponent(document.getElementById("time").value)}%0A📝 Cake Writing / Special Message: ${encodeURIComponent(document.getElementById("message").value || "None")}%0A📍 Pickup / Delivery Details: ${encodeURIComponent(document.getElementById("address").value)}`;
      window.open("https://wa.me/94768727152?text=" + text, "_blank");
    });
  }
});
