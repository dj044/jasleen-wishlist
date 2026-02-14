function getWishes() {
  return JSON.parse(localStorage.getItem("jasleen_wishlist") || "[]");
}

function saveWishes(wishes) {
  localStorage.setItem("jasleen_wishlist", JSON.stringify(wishes));
}

function renderWishes() {
  const wishlistDiv = document.getElementById("wishlist");
  wishlistDiv.innerHTML = "";

  const wishes = getWishes();

  wishes.forEach((wish, index) => {
    const item = document.createElement("div");
    item.className = "wishlist-item";

    item.innerHTML = `
      <span>${wish}</span>
      <button class="delete-btn" onclick="deleteWish(${index})">✕</button>
    `;

    wishlistDiv.appendChild(item);
  });
}

function addWish() {
  const input = document.getElementById("wishInput");
  const wish = input.value.trim();
  if (!wish) return;

  const wishes = getWishes();
  wishes.unshift(wish);
  saveWishes(wishes);

  input.value = "";
  renderWishes();
}

function deleteWish(index) {
  const wishes = getWishes();
  wishes.splice(index, 1);
  saveWishes(wishes);
  renderWishes();
}

renderWishes();
