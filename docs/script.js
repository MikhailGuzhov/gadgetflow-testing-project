const API = "http://localhost:3001";
const FALLBACK_PRODUCTS = [
  {
    id: 1,
    name: "Наушники FlowBuds Pro",
    price: 7990,
    img: "./images/AdobeStock_1196473656.jpeg",
    description:
      "Беспроводные наушники с активным шумоподавлением. 15 часов работы.",
    category: "Аудио",
  },
  {
    id: 2,
    name: "Смарт‑часы WaveTrack 2",
    price: 14990,
    img: "./images/AdobeStock_1196473656.jpeg",
    description: "Водонепроницаемые GPS‑часы с пульсоксиметром.",
    category: "Носимые",
  },
  {
    id: 3,
    name: "Колонка BeatBox Mini",
    price: 5990,
    img: "./images/AdobeStock_1196473656.jpeg",
    description: "Компактная колонка с мощными басами и RGB‑подсветкой.",
    category: "Аудио",
  },
  {
    id: 4,
    name: "Пауэрбанк PowerPack 10k",
    price: 3490,
    img: "./images/AdobeStock_1196473656.jpeg",
    description: "Тонкий пауэрбанк 10 000 мА·ч с PD 20 Вт.",
    category: "Аксессуары",
  },
  {
    id: 5,
    name: "Защитное стекло LensGuard",
    price: 990,
    img: "./images/AdobeStock_1196473656.jpeg",
    description: "Упрочнённое стекло 9H для камеры смартфона.",
    category: "Аксессуары",
  },
  {
    id: 6,
    name: "Саундбар SoundBar X",
    price: 21990,
    img: "./images/AdobeStock_1196473656.jpeg",
    description: "Саундбар Dolby Atmos для домашнего кинотеатра.",
    category: "Аудио",
  },
];
const qs = (id) => document.getElementById(id);
const getCart = () => JSON.parse(localStorage.getItem("cart") || "[]");
const setCart = (c) => {
  localStorage.setItem("cart", JSON.stringify(c));
  updateCartCount();
};
function updateCartCount() {
  const c = getCart().reduce((s, i) => s + i.qty, 0);
  const el = qs("cart-count");
  if (el) el.textContent = c;
}
async function fetchJson(u) {
  try {
    const r = await fetch(u);
    if (r.ok) return await r.json();
  } catch (e) {}
  return null;
}
const getProducts = () =>
  fetchJson(API + "/products").then((d) => d || FALLBACK_PRODUCTS);
const getProduct = (id) =>
  fetchJson(`${API}/products/${id}`).then(
    (p) => p || FALLBACK_PRODUCTS.find((x) => x.id == id)
  );
const fmt = (p) => p.toLocaleString("ru-RU") + " ₽";
async function renderCatalog() {
  const list = qs("product-list");
  if (!list) return;
  const q = (qs("search-input")?.value || "").toLowerCase();
  const cat = qs("category-filter")?.value || "";
  const prods = await getProducts();
  list.innerHTML = "";
  prods
    .filter(
      (p) => (!cat || p.category === cat) && p.name.toLowerCase().includes(q)
    )
    .forEach((p) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<img src='${p.img}'><div class='card-body'><strong>${
        p.name
      }</strong><span class='price'>${fmt(
        p.price
      )}</span><a class='btn primary' onclick='addToCart(${
        p.id
      })'>В корзину</a><a class='btn' href='product.html?id=${
        p.id
      }'>Подробнее</a></div>`;
      list.appendChild(card);
    });
}
function addToCart(id) {
  const cart = getCart();
  const it = cart.find((i) => i.id === id);
  it ? it.qty++ : cart.push({ id, qty: 1 });
  setCart(cart);
  renderCart();
}
function changeQty(id, d) {
  const cart = getCart();
  const it = cart.find((i) => i.id === id);
  if (!it) return;
  it.qty = Math.max(1, it.qty + d);
  setCart(cart);
  renderCart();
}
function removeItem(id) {
  setCart(getCart().filter((i) => i.id !== id));
  renderCart();
}
async function renderCart() {
  const tbody = document.querySelector("#cart-table tbody");
  if (!tbody) return;
  const prods = await getProducts();
  const cart = getCart();
  tbody.innerHTML = "";
  let total = 0;
  cart.forEach((i) => {
    const p = prods.find((pr) => pr.id === i.id);
    if (!p) return;
    total += p.price * i.qty;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.name}</td><td><button onclick='changeQty(${
      i.id
    },-1)'>-</button> ${i.qty} <button onclick='changeQty(${
      i.id
    },1)'>+</button></td><td>${fmt(p.price)}</td><td>${fmt(
      p.price * i.qty
    )}</td><td><button onclick='removeItem(${i.id})'>×</button></td>`;
    tbody.appendChild(tr);
  });
  qs("total") &&
    (qs("total").textContent = total
      ? `Итого: ${fmt(total)}`
      : "Корзина пуста");
}
async function renderProduct() {
  const cont = qs("product-detail");
  if (!cont) return;
  const id = parseInt(new URLSearchParams(location.search).get("id"));
  const p = await getProduct(id);
  if (!p) {
    cont.textContent = "Товар не найден";
    return;
  }
  cont.innerHTML = `<img src='${
    p.img
  }' style='max-width:400px;width:100%;border-radius:8px;'><h2>${
    p.name
  }</h2><p>${p.description}</p><p class='price'>${fmt(
    p.price
  )}</p><a class='btn primary' onclick='addToCart(${
    p.id
  })'>Добавить в корзину</a>`;
}
async function sendOrder(data) {
  const r = await fetch(API + "/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.ok;
}
function handleCheckout() {
  const f = qs("checkout-form");
  if (!f) return;
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!f.checkValidity()) {
      qs("form-error").textContent = "Проверьте поля";
      return;
    }
    const u = {
      name: qs("name").value,
      email: qs("email").value,
      address: qs("address").value,
    };
    const ok = await sendOrder({ cart: getCart(), user: u });
    if (ok) {
      localStorage.removeItem("cart");
      location.href = "success.html";
    } else qs("form-error").textContent = "Ошибка сервера";
  });
}
function init() {
  updateCartCount();
  renderCatalog();
  renderProduct();
  renderCart();
  handleCheckout();
  ["search-input", "category-filter"].forEach(
    (id) => qs(id) && qs(id).addEventListener("input", renderCatalog)
  );
}
document.addEventListener("DOMContentLoaded", init);
