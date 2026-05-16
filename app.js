const storageKeys = {
  recipes: "mealPlanner.recipes",
  shopping: "mealPlanner.shopping",
};

function createId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const seedRecipes = [
  {
    id: createId(),
    name: "Omelete de ervas",
    category: "breakfast",
    time: 12,
    difficulty: "Easy",
    favorite: true,
    ingredients: ["2 ovos", "1 colher de queijo", "salsinha", "tomate cereja"],
    steps: "Bata os ovos, misture os temperos e cozinhe em fogo baixo até firmar.",
  },
  {
    id: createId(),
    name: "Bowl de frango e arroz",
    category: "lunch",
    time: 35,
    difficulty: "Medium",
    favorite: false,
    ingredients: ["1 peito de frango", "1 xícara de arroz", "brócolis", "molho de soja"],
    steps: "Grelhe o frango, cozinhe o arroz e monte com legumes salteados.",
  },
  {
    id: createId(),
    name: "Sopa rápida de legumes",
    category: "dinner",
    time: 28,
    difficulty: "Easy",
    favorite: false,
    ingredients: ["cenoura", "batata", "abobrinha", "caldo de legumes"],
    steps: "Corte tudo pequeno, cozinhe no caldo e finalize com azeite.",
  },
];

let recipes = load(storageKeys.recipes, seedRecipes);
let shoppingItems = load(storageKeys.shopping, []);
let activeFilter = "all";
let searchTerm = "";

const recipeForm = document.querySelector("#recipeForm");
const recipeId = document.querySelector("#recipeId");
const recipeName = document.querySelector("#recipeName");
const recipeCategory = document.querySelector("#recipeCategory");
const recipeTime = document.querySelector("#recipeTime");
const recipeDifficulty = document.querySelector("#recipeDifficulty");
const recipeIngredients = document.querySelector("#recipeIngredients");
const recipeSteps = document.querySelector("#recipeSteps");
const recipeGrid = document.querySelector("#recipeGrid");
const recipeTemplate = document.querySelector("#recipeCardTemplate");
const searchInput = document.querySelector("#searchInput");
const resultCount = document.querySelector("#resultCount");
const emptyState = document.querySelector("#emptyState");
const shoppingList = document.querySelector("#shoppingList");
const shoppingEmpty = document.querySelector("#shoppingEmpty");

function load(key, fallback) {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
}

function save() {
  localStorage.setItem(storageKeys.recipes, JSON.stringify(recipes));
  localStorage.setItem(storageKeys.shopping, JSON.stringify(shoppingItems));
}

function normalize(value) {
  return value.trim().toLowerCase();
}

function getVisibleRecipes() {
  return recipes.filter((recipe) => {
    const matchesFilter =
      activeFilter === "all" ||
      recipe.category === activeFilter ||
      (activeFilter === "favorites" && recipe.favorite);
    const haystack = normalize(`${recipe.name} ${recipe.ingredients.join(" ")}`);
    return matchesFilter && haystack.includes(searchTerm);
  });
}

function render() {
  renderRecipes();
  renderShopping();
  renderStats();
  save();
}

function renderRecipes() {
  const visibleRecipes = getVisibleRecipes();
  recipeGrid.replaceChildren();
  emptyState.style.display = visibleRecipes.length ? "none" : "block";
  resultCount.textContent = `${visibleRecipes.length} receita${visibleRecipes.length === 1 ? "" : "s"} encontrada${visibleRecipes.length === 1 ? "" : "s"}`;

  visibleRecipes.forEach((recipe) => {
    const card = recipeTemplate.content.firstElementChild.cloneNode(true);
    const category = card.querySelector(".category-pill");
    const favorite = card.querySelector(".favorite-button");

    category.textContent = recipe.category;
    category.classList.add(recipe.category);
    card.querySelector("h3").textContent = recipe.name;
    card.querySelector(".time-meta").textContent = `${recipe.time} min`;
    card.querySelector(".difficulty-meta").textContent = recipe.difficulty;
    favorite.classList.toggle("active", recipe.favorite);

    const ingredientPreview = card.querySelector(".ingredient-preview");
    recipe.ingredients.slice(0, 4).forEach((ingredient) => {
      const item = document.createElement("li");
      item.textContent = ingredient;
      ingredientPreview.append(item);
    });

    card.querySelector(".steps-preview").textContent = recipe.steps || "Sem preparo anotado.";
    card.querySelector(".add-shopping").addEventListener("click", () => addIngredients(recipe.ingredients));
    card.querySelector(".edit-recipe").addEventListener("click", () => editRecipe(recipe.id));
    card.querySelector(".delete-recipe").addEventListener("click", () => deleteRecipe(recipe.id));
    favorite.addEventListener("click", () => toggleFavorite(recipe.id));
    recipeGrid.append(card);
  });
}

function renderShopping() {
  shoppingList.replaceChildren();
  shoppingEmpty.style.display = shoppingItems.length ? "none" : "block";

  shoppingItems.forEach((item) => {
    const row = document.createElement("li");
    const checkbox = document.createElement("input");
    const label = document.createElement("span");

    checkbox.type = "checkbox";
    checkbox.checked = item.done;
    label.textContent = item.name;
    label.classList.toggle("done", item.done);
    checkbox.addEventListener("change", () => {
      item.done = checkbox.checked;
      render();
    });

    row.append(checkbox, label);
    shoppingList.append(row);
  });
}

function renderStats() {
  document.querySelector("#totalRecipes").textContent = recipes.length;
  document.querySelector("#totalFavorites").textContent = recipes.filter((recipe) => recipe.favorite).length;
  document.querySelector("#totalItems").textContent = shoppingItems.filter((item) => !item.done).length;
}

function addIngredients(ingredients) {
  const existing = new Set(shoppingItems.map((item) => normalize(item.name)));
  ingredients.forEach((ingredient) => {
    if (!existing.has(normalize(ingredient))) {
      existing.add(normalize(ingredient));
      shoppingItems.push({ id: createId(), name: ingredient, done: false });
    }
  });
  render();
}

function editRecipe(id) {
  const recipe = recipes.find((item) => item.id === id);
  recipeId.value = recipe.id;
  recipeName.value = recipe.name;
  recipeCategory.value = recipe.category;
  recipeTime.value = recipe.time;
  recipeDifficulty.value = recipe.difficulty;
  recipeIngredients.value = recipe.ingredients.join("\n");
  recipeSteps.value = recipe.steps;
  recipeName.focus();
}

function deleteRecipe(id) {
  recipes = recipes.filter((recipe) => recipe.id !== id);
  if (recipeId.value === id) {
    recipeForm.reset();
    recipeId.value = "";
  }
  render();
}

function toggleFavorite(id) {
  recipes = recipes.map((recipe) => (recipe.id === id ? { ...recipe, favorite: !recipe.favorite } : recipe));
  render();
}

recipeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const ingredients = recipeIngredients.value
    .split("\n")
    .map((ingredient) => ingredient.trim())
    .filter(Boolean);
  const data = {
    id: recipeId.value || createId(),
    name: recipeName.value.trim(),
    category: recipeCategory.value,
    time: Number(recipeTime.value),
    difficulty: recipeDifficulty.value,
    ingredients,
    steps: recipeSteps.value.trim(),
    favorite: recipes.find((recipe) => recipe.id === recipeId.value)?.favorite || false,
  };

  recipes = recipeId.value ? recipes.map((recipe) => (recipe.id === recipeId.value ? data : recipe)) : [data, ...recipes];
  recipeForm.reset();
  recipeId.value = "";
  render();
});

recipeForm.addEventListener("reset", () => {
  recipeId.value = "";
});

searchInput.addEventListener("input", (event) => {
  searchTerm = normalize(event.target.value);
  renderRecipes();
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".chip.active").classList.remove("active");
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderRecipes();
  });
});

document.querySelector("#clearShopping").addEventListener("click", () => {
  shoppingItems = [];
  render();
});

render();
