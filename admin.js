const ADMIN_PASSWORD="Rashi@2026";
let editImage=null;
function getCakes(){const x=localStorage.getItem("rashiCakes");return x?JSON.parse(x):[]}
function saveCakes(c){localStorage.setItem("rashiCakes",JSON.stringify(c))}
function login(){if(document.getElementById("adminPassword").value===ADMIN_PASSWORD){sessionStorage.setItem("rashiAdmin","1");showPanel()}else document.getElementById("loginError").textContent="Incorrect password."}
function logout(){sessionStorage.removeItem("rashiAdmin");location.reload()}
function showPanel(){document.getElementById("loginBox").classList.add("hidden");document.getElementById("panel").classList.remove("hidden");renderAdmin()}
function renderAdmin(){const list=document.getElementById("adminList"),cakes=getCakes();list.innerHTML=cakes.map(c=>`<div class="admin-row"><img src="${c.image}"><div><b>${esc(c.name)}</b><br><small>500g: Rs. ${Number(c.p500).toLocaleString()} • 1KG: Rs. ${Number(c.p1000).toLocaleString()} • ${c.available?"Available":"Unavailable"}</small></div><div class="actions"><button class="smallbtn edit" onclick="editCake('${c.id}')">Edit</button><button class="smallbtn delete" onclick="deleteCake('${c.id}')">Delete</button></div></div>`).join("")||"<p>No cakes. Add your first design.</p>"}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
document.getElementById("aImage").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{editImage=r.result;document.getElementById("preview").innerHTML=`<img src="${editImage}">`};r.readAsDataURL(f)})
document.getElementById("cakeForm").addEventListener("submit",e=>{e.preventDefault();let cakes=getCakes(),id=document.getElementById("editId").value;let old=cakes.find(c=>c.id===id);let obj={id:id||Date.now().toString(),name:document.getElementById("aName").value.trim(),image:editImage||(old?old.image:"images/cake-placeholder-1.svg"),p500:Number(document.getElementById("a500").value),p1000:Number(document.getElementById("a1000").value),available:document.getElementById("aAvailable").checked};if(id)cakes=cakes.map(c=>c.id===id?obj:c);else cakes.push(obj);saveCakes(cakes);resetForm();renderAdmin();alert("Cake saved successfully.")})
function editCake(id){const c=getCakes().find(x=>x.id===id);if(!c)return;document.getElementById("editId").value=c.id;document.getElementById("aName").value=c.name;document.getElementById("a500").value=c.p500;document.getElementById("a1000").value=c.p1000;document.getElementById("aAvailable").checked=c.available;editImage=c.image;document.getElementById("preview").innerHTML=`<img src="${c.image}">`;document.getElementById("formTitle").textContent="Edit Cake";document.getElementById("cancelEdit").classList.remove("hidden");scrollTo(0,0)}
function deleteCake(id){if(!confirm("Delete this cake design?"))return;saveCakes(getCakes().filter(c=>c.id!==id));renderAdmin()}
function resetForm(){document.getElementById("cakeForm").reset();document.getElementById("editId").value="";document.getElementById("preview").innerHTML="";document.getElementById("formTitle").textContent="Add New Cake";document.getElementById("cancelEdit").classList.add("hidden");editImage=null}
if(!localStorage.getItem("rashiCakes")){localStorage.setItem("rashiCakes",JSON.stringify([
{id:"1",name:"Chocolate Birthday Cake",image:"images/cake-placeholder-1.svg",p500:2500,p1000:4500,available:true},
{id:"2",name:"Strawberry Cream Cake",image:"images/cake-placeholder-2.svg",p500:2800,p1000:5000,available:true},
{id:"3",name:"Buttercream Rose Cake",image:"images/cake-placeholder-3.svg",p500:3000,p1000:5500,available:true},
{id:"4",name:"Pink Birthday Cake",image:"images/cake-placeholder-4.svg",p500:2700,p1000:4800,available:true}
]))}
if(sessionStorage.getItem("rashiAdmin")==="1")showPanel()
