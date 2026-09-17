const STORAGE_PREFIX = "cartshare-room-";
const SESSION_KEY = "cartshare-session";
const DELIVERY_TARGET = 75;
const itemVisuals = [
  { terms: ["sofa", "couch", "chair", "table", "desk", "shelf", "furniture"], icon: "🛋️", tone: "lavender" },
  { terms: ["bed", "mattress", "pillow", "blanket", "sheet", "duvet"], icon: "🛏️", tone: "lavender" },
  { terms: ["milk", "cheese", "yogurt", "butter", "cream"], icon: "🥛", tone: "blue" },
  { terms: ["apple", "banana", "orange", "fruit", "berry"], icon: "🍎", tone: "peach" },
  { terms: ["lettuce", "spinach", "vegetable", "carrot", "salad", "greens"], icon: "🥬", tone: "green" },
  { terms: ["bread", "toast", "bagel", "bun", "flour"], icon: "🍞", tone: "gold" },
  { terms: ["coffee", "tea", "cocoa", "drink", "juice", "water"], icon: "☕", tone: "brown" },
  { terms: ["pasta", "rice", "noodle", "sauce", "spaghetti"], icon: "🍝", tone: "coral" },
  { terms: ["soap", "shampoo", "lotion", "toothpaste", "cleaner"], icon: "🧴", tone: "aqua" },
  { terms: ["paper", "tissue", "toilet", "towel", "napkin"], icon: "🧻", tone: "cream" }
];

const state = {
  room: "",
  user: "",
  data: { items: [], activities: [], users: [] }
};

const $ = (selector) => document.querySelector(selector);
const roomKey = () => `${STORAGE_PREFIX}${state.room}`;
const initials = (name) => name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const money = (value) => `$${Number(value).toFixed(2)}`;
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[character]));
const getItemVisual = (name) => itemVisuals.find((visual) => visual.terms.some((term) => name.toLowerCase().includes(term))) || { icon: "✦", tone: "mint" };

function loadRoom() {
  try {
    return JSON.parse(localStorage.getItem(roomKey())) || { items: [], activities: [], users: [] };
  } catch {
    return { items: [], activities: [], users: [] };
  }
}

function saveRoom() {
  localStorage.setItem(roomKey(), JSON.stringify(state.data));
}

function broadcast() {
  saveRoom();
  renderApp();
}

function addActivity(action, itemName = "") {
  state.data.activities.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    user: state.user,
    action,
    itemName,
    timestamp: Date.now()
  });
  state.data.activities = state.data.activities.slice(0, 30);
}

function updatePresence() {
  const existing = state.data.users.filter((user) => user.name !== state.user);
  state.data.users = [...existing, { name: state.user, lastSeen: Date.now() }];
}

function enterRoom(name, room) {
  state.user = name.trim();
  state.room = room.trim().toUpperCase();
  state.data = loadRoom();
  updatePresence();
  const hasJoined = state.data.activities.some((activity) => activity.user === state.user && activity.action === "joined");
  if (!hasJoined) addActivity("joined");
  broadcast();
  localStorage.setItem(SESSION_KEY, JSON.stringify({ name: state.user, room: state.room }));
    $("#auth-view").classList.add("d-none");
    $("#app-view").classList.remove("d-none");
  renderApp();
}

function relativeTime(timestamp) {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function renderActivity() {
  const activityList = $("#activity-list");
  if (!state.data.activities.length) {
    activityList.innerHTML = '<p class="muted text-center py-4">Activity will appear here.</p>';
    return;
  }
  activityList.innerHTML = state.data.activities.map((activity) => {
    const actionText = activity.action === "added" ? `added <strong>${escapeHtml(activity.itemName)}</strong>` : activity.action === "removed" ? `removed <strong>${escapeHtml(activity.itemName)}</strong>` : "joined the room";
    return `<div class="activity-entry"><span class="activity-avatar">${escapeHtml(initials(activity.user))}</span><div><p><strong>${escapeHtml(activity.user)}</strong> ${actionText}</p><time>${relativeTime(activity.timestamp)}</time></div></div>`;
  }).join("");
}

function renderCart() {
  const total = state.data.items.reduce((sum, item) => sum + Number(item.price), 0);
  const count = state.data.items.length;
  $("#cart-total").textContent = money(total);
  $("#cart-foot-total").textContent = money(total);
  $("#cart-foot-label").textContent = `${count} item${count === 1 ? "" : "s"}`;
  $("#item-count").textContent = `${count} item${count === 1 ? "" : "s"}`;
  $("#progress-amount").textContent = total >= DELIVERY_TARGET ? "Unlocked" : `${money(DELIVERY_TARGET - total)} to go`;
  $("#shipping-status").textContent = total >= DELIVERY_TARGET ? "Free delivery unlocked" : "Add items to get started";
  $("#progress-bar").style.width = `${Math.min(100, (total / DELIVERY_TARGET) * 100)}%`;
  $("#empty-cart").classList.toggle("d-none", count > 0);
  $("#cart-list").innerHTML = state.data.items.map((item) => { const visual = getItemVisual(item.name); return `<div class="cart-item"><span class="item-icon ${visual.tone}">${visual.icon}</span><div class="item-main"><strong>${escapeHtml(item.name)}</strong><small>Added by ${escapeHtml(item.addedBy)}</small></div><span class="item-price">${money(item.price)}</span><button class="remove-item" type="button" data-item-id="${item.id}" aria-label="Remove ${escapeHtml(item.name)}">×</button></div>`; }).join("");
}

function renderApp() {
  $("#room-label").textContent = state.room;
  $("#footer-room").textContent = state.room;
  $("#receipt-room").textContent = state.room;
  $("#user-label").textContent = state.user;
  $("#greeting-name").textContent = state.user;
  $("#user-avatar").textContent = initials(state.user);
  const activeUsers = state.data.users.filter((user) => Date.now() - user.lastSeen < 120000);
  $("#people-count").textContent = `${Math.max(1, activeUsers.length)} ${activeUsers.length === 1 ? "person" : "people"}`;
  renderCart();
  renderActivity();
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function openReceipt() {
  const total = state.data.items.reduce((sum, item) => sum + Number(item.price), 0);
  $("#receipt-date").textContent = new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  $("#receipt-total").textContent = money(total);
  $("#receipt-items").innerHTML = state.data.items.length ? state.data.items.map((item) => `<div class="receipt-row"><span>${escapeHtml(item.name)} <small>(${escapeHtml(item.addedBy)})</small></span><strong>${money(item.price)}</strong></div>`).join("") : '<p class="muted py-3">No items have been added yet.</p>';
  $("#receipt-modal").classList.remove("d-none");
}

$("#generate-code").addEventListener("click", () => {
  $("#room-code").value = `ROOM-${Math.floor(100 + Math.random() * 900)}`;
});

$("#room-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#name").value.trim();
  const room = $("#room-code").value.trim();
  if (!name || !room) {
    $("#form-error").textContent = "Please enter your name and a room code.";
    return;
  }
  $("#form-error").textContent = "";
  enterRoom(name, room);
});

$("#item-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#item-name").value.trim();
  const price = Number($("#item-price").value);
  if (!name || !price || price < 0) return;
  state.data.items.push({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`, name, price, addedBy: state.user });
  addActivity("added", name);
  updatePresence();
  broadcast();
  event.target.reset();
  $("#item-name").focus();
});

$("#add-item-focus").addEventListener("click", () => $("#item-name").focus());
$("#cart-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-item-id]");
  if (!button) return;
  const item = state.data.items.find((entry) => entry.id === button.dataset.itemId);
  if (!item) return;
  state.data.items = state.data.items.filter((entry) => entry.id !== item.id);
  addActivity("removed", item.name);
  updatePresence();
  broadcast();
});

$("#copy-room").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(state.room); showToast("Room code copied"); } catch { showToast(`Room code: ${state.room}`); }
});
$("#print-receipt").addEventListener("click", openReceipt);
$("#close-receipt").addEventListener("click", () => $("#receipt-modal").classList.add("d-none"));
$("#receipt-print-action").addEventListener("click", () => window.print());
$("#leave-room").addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
    $("#app-view").classList.add("d-none");
    $("#auth-view").classList.remove("d-none");
  $("#room-form").reset();
});

window.addEventListener("storage", (event) => {
  if (event.key !== roomKey() || !event.newValue) return;
  state.data = loadRoom();
  renderApp();
  showToast("Room updated in another tab");
});

window.setInterval(() => {
  if (!state.room) return;
  updatePresence();
  saveRoom();
  renderApp();
}, 30000);

try {
  const session = JSON.parse(localStorage.getItem(SESSION_KEY));
  if (session?.name && session?.room) enterRoom(session.name, session.room);
} catch { /* Ignore an invalid old session. */ }
