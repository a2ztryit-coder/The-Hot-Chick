import { openDB } from "idb";

const DB_NAME = "hotel-pos-offline";
const DB_VERSION = 1;

const defaultSettings = {
  id: "settings",
  shopName: "The Hot Chick",
  address: "Main Road, City",
  phone: "+91 99999 99999",
  parcelCharge: 5,
  receiptFooter: "Thank you! Visit again.",
  adminPin: "1234",
  theme: "light",
};

const defaultMeta = {
  id: "meta",
  tokenDate: "",
  tokenCounter: 0,
};

const defaultCategories = [
  { id: "cat-cluckin-hot", name: "Cluckin Hot", enabled: true },
  { id: "cat-between-buns", name: "Between the Buns", enabled: true },
  { id: "cat-chick-flicks", name: "Chick Flicks", enabled: true },
  { id: "cat-hottie-sandwiches", name: "Hottie Chicken Sandwiches", enabled: true },
  { id: "cat-xxxtra-hot", name: "XXXtra Hot", enabled: true },
  { id: "cat-chick-combo", name: "Chick N Combo", enabled: true },
  { id: "cat-feast", name: "The Hot Chick Feast", enabled: true },
  { id: "cat-power-packs", name: "Hot Chick Power Packs", enabled: true },
  { id: "cat-budget-bites", name: "Hot Chick Budget Bites", enabled: true },
  { id: "cat-chill-seduction", name: "The Chill Seduction", enabled: true },
  { id: "cat-too-hot-handle", name: "Too Hot To Handle", enabled: true },
  { id: "cat-rolls", name: "Rolls", enabled: true },
];

const defaultItems = [
  {
    id: "item-1",
    name: "Fried Chicken Wings (4pc)",
    categoryId: "cat-cluckin-hot",
    sellingPrice: 100,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-2",
    name: "Fried Chicken Wings (5pc)",
    categoryId: "cat-cluckin-hot",
    sellingPrice: 130,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-3",
    name: "Fried Chicken Lollipop (3pc)",
    categoryId: "cat-cluckin-hot",
    sellingPrice: 120,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-4",
    name: "Fried Chicken Lollipop (4pc)",
    categoryId: "cat-cluckin-hot",
    sellingPrice: 180,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-5",
    name: "Fried Chicken Strips (4pc)",
    categoryId: "cat-cluckin-hot",
    sellingPrice: 120,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-6",
    name: "Fried Chicken Strips (6pc)",
    categoryId: "cat-cluckin-hot",
    sellingPrice: 160,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-7",
    name: "Crispy Chicken Popcorn (Medium)",
    categoryId: "cat-cluckin-hot",
    sellingPrice: 80,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-8",
    name: "Crispy Chicken Popcorn (Large)",
    categoryId: "cat-cluckin-hot",
    sellingPrice: 120,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-9",
    name: "Jumbo Wings (2pc)",
    categoryId: "cat-cluckin-hot",
    sellingPrice: 120,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-10",
    name: "Jumbo Wings (4pc)",
    categoryId: "cat-cluckin-hot",
    sellingPrice: 200,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-11",
    name: "Mini Chicken Crisper",
    categoryId: "cat-between-buns",
    sellingPrice: 90,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-12",
    name: "Classic Zinger Burger",
    categoryId: "cat-between-buns",
    sellingPrice: 110,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-13",
    name: "Fried Burger",
    categoryId: "cat-between-buns",
    sellingPrice: 120,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-14",
    name: "Chicken Cheese Burger",
    categoryId: "cat-between-buns",
    sellingPrice: 140,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-15",
    name: "Mexican Chicken Burger",
    categoryId: "cat-between-buns",
    sellingPrice: 150,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-16",
    name: "BBQ Chicken Burger",
    categoryId: "cat-between-buns",
    sellingPrice: 150,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-17",
    name: "French Fries",
    categoryId: "cat-chick-flicks",
    sellingPrice: 80,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-18",
    name: "Cheesy Fries",
    categoryId: "cat-chick-flicks",
    sellingPrice: 120,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-19",
    name: "Peri Peri Fries",
    categoryId: "cat-chick-flicks",
    sellingPrice: 100,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-20",
    name: "Fresh Garden Sandwich",
    categoryId: "cat-hottie-sandwiches",
    sellingPrice: 90,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-21",
    name: "Veg Cheese Sandwich",
    categoryId: "cat-hottie-sandwiches",
    sellingPrice: 90,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-22",
    name: "Classic Chicken Sandwich",
    categoryId: "cat-hottie-sandwiches",
    sellingPrice: 90,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-23",
    name: "Fried Sandwich",
    categoryId: "cat-hottie-sandwiches",
    sellingPrice: 120,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-24",
    name: "Chicken Cheese Sandwich",
    categoryId: "cat-hottie-sandwiches",
    sellingPrice: 140,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-25",
    name: "Hot Garlic Chicken Sandwich",
    categoryId: "cat-hottie-sandwiches",
    sellingPrice: 150,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-26",
    name: "Hot Garlic Wings (4pc)",
    categoryId: "cat-xxxtra-hot",
    sellingPrice: 140,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-27",
    name: "Nashville Hot Chicken Strips (4pc)",
    categoryId: "cat-xxxtra-hot",
    sellingPrice: 160,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-28",
    name: "Chickzilla",
    categoryId: "cat-xxxtra-hot",
    sellingPrice: 150,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-29",
    name: "Lays with Fiery Chicken",
    categoryId: "cat-xxxtra-hot",
    sellingPrice: 100,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-30",
    name: "6 Pc Hot and Crispy Bucket Chicken",
    categoryId: "cat-chick-combo",
    sellingPrice: 199,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-31",
    name: "12 Pc Hot and Crispy Bucket Chicken",
    categoryId: "cat-chick-combo",
    sellingPrice: 349,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-32",
    name: "Hot Chick Feast Combo",
    categoryId: "cat-feast",
    sellingPrice: 249,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-33",
    name: "Hot Chick Power Pack Combo",
    categoryId: "cat-power-packs",
    sellingPrice: 299,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-34",
    name: "French Fries + Any Mojito",
    categoryId: "cat-budget-bites",
    sellingPrice: 129,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-35",
    name: "Mini Chicken Crisper + Fries + Any Mojito",
    categoryId: "cat-budget-bites",
    sellingPrice: 149,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-36",
    name: "Crispy Chicken Popcorn + Fries + Any Mojito",
    categoryId: "cat-budget-bites",
    sellingPrice: 149,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-37",
    name: "Mint Lime Mojito",
    categoryId: "cat-chill-seduction",
    sellingPrice: 70,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-38",
    name: "Virgin Lychee Mojito",
    categoryId: "cat-chill-seduction",
    sellingPrice: 70,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-39",
    name: "Green Apple Mojito",
    categoryId: "cat-chill-seduction",
    sellingPrice: 70,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-40",
    name: "Frozen Strawberry Mojito",
    categoryId: "cat-chill-seduction",
    sellingPrice: 70,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-41",
    name: "Mango Mojito",
    categoryId: "cat-chill-seduction",
    sellingPrice: 70,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-42",
    name: "Blue Sea Mojito",
    categoryId: "cat-chill-seduction",
    sellingPrice: 70,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-43",
    name: "Pina Colada",
    categoryId: "cat-chill-seduction",
    sellingPrice: 70,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-44",
    name: "Bubble Gum Mojito",
    categoryId: "cat-chill-seduction",
    sellingPrice: 70,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-45",
    name: "Spicy Main Chick Burger",
    categoryId: "cat-too-hot-handle",
    sellingPrice: 150,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-46",
    name: "The Sizzlin' Chick Burger",
    categoryId: "cat-too-hot-handle",
    sellingPrice: 150,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-47",
    name: "Topless Chick Burger",
    categoryId: "cat-too-hot-handle",
    sellingPrice: 179,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-48",
    name: "Chicks 'n' Fries",
    categoryId: "cat-too-hot-handle",
    sellingPrice: 120,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-49",
    name: "Lemon Pepper Fried Chicken",
    categoryId: "cat-too-hot-handle",
    sellingPrice: 150,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-50",
    name: "Pot Loaded Chicken",
    categoryId: "cat-too-hot-handle",
    sellingPrice: 150,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-51",
    name: "Garlic Butter Popcorn (Medium)",
    categoryId: "cat-too-hot-handle",
    sellingPrice: 100,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-52",
    name: "Garlic Butter Popcorn (Large)",
    categoryId: "cat-too-hot-handle",
    sellingPrice: 130,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-53",
    name: "Fried Chicken Roll",
    categoryId: "cat-rolls",
    sellingPrice: 100,
    costPrice: 0,
    enabled: true,
  },
  {
    id: "item-54",
    name: "Cheesy Chicken Roll",
    categoryId: "cat-rolls",
    sellingPrice: 120,
    costPrice: 0,
    enabled: true,
  },
];

function todayKey() {
  // use IST so token counter resets at midnight IST, not 5:30 AM
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  const d = parts.find((p) => p.type === "day").value;
  return `${y}-${m}-${d}`;
}

export const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("app")) {
      db.createObjectStore("app", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("categories")) {
      db.createObjectStore("categories", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("menuItems")) {
      db.createObjectStore("menuItems", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("orders")) {
      db.createObjectStore("orders", { keyPath: "id" });
    }
  },
});

export async function initDatabase() {
  const db = await dbPromise;
  const settings = await db.get("app", "settings");
  if (!settings) {
    await db.put("app", defaultSettings);
  }
  const meta = await db.get("app", "meta");
  if (!meta) {
    await db.put("app", defaultMeta);
  }
  const categories = await db.getAll("categories");
  if (!categories.length) {
    for (const category of defaultCategories) {
      await db.put("categories", category);
    }
  }
  const menuItems = await db.getAll("menuItems");
  if (!menuItems.length) {
    for (const item of defaultItems) {
      await db.put("menuItems", item);
    }
  } else {
    for (const item of menuItems) {
      if (!Object.prototype.hasOwnProperty.call(item, "imageData")) continue;
      const { imageData, ...nextItem } = item;
      void imageData;
      await db.put("menuItems", nextItem);
    }
  }
}

export async function getSettings() {
  const db = await dbPromise;
  return (await db.get("app", "settings")) || defaultSettings;
}

export async function saveSettings(settings) {
  const db = await dbPromise;
  await db.put("app", { ...settings, id: "settings" });
}

export async function getMeta() {
  const db = await dbPromise;
  return (await db.get("app", "meta")) || defaultMeta;
}

export async function saveMeta(meta) {
  const db = await dbPromise;
  await db.put("app", { ...meta, id: "meta" });
}

export async function getCategories() {
  const db = await dbPromise;
  return db.getAll("categories");
}

export async function saveCategory(category) {
  const db = await dbPromise;
  await db.put("categories", category);
}

export async function deleteCategory(id) {
  const db = await dbPromise;
  await db.delete("categories", id);
}

export async function getMenuItems() {
  const db = await dbPromise;
  return db.getAll("menuItems");
}

export async function saveMenuItem(item) {
  const db = await dbPromise;
  await db.put("menuItems", item);
}

export async function deleteMenuItem(id) {
  const db = await dbPromise;
  await db.delete("menuItems", id);
}

export async function deleteOrder(id) {
  const db = await dbPromise;
  await db.delete("orders", id);
}

export async function saveOrder(order) {
  const db = await dbPromise;
  await db.put("orders", order);
}

export async function getOrders() {
  const db = await dbPromise;
  return db.getAll("orders");
}

export async function getNextToken() {
  const db = await dbPromise;
  const meta = (await db.get("app", "meta")) || defaultMeta;
  const today = todayKey();
  const tokenCounter = meta.tokenDate === today ? meta.tokenCounter + 1 : 1;
  const updated = {
    id: "meta",
    tokenDate: today,
    tokenCounter,
  };
  await db.put("app", updated);
  return tokenCounter;
}

export async function resetTodayToken() {
  const db = await dbPromise;
  await db.put("app", {
    id: "meta",
    tokenDate: todayKey(),
    tokenCounter: 0,
  });
}

export async function clearAllData() {
  const db = await dbPromise;
  await db.clear("orders");
  await db.clear("menuItems");
  await db.clear("categories");
  await db.clear("app");
  await initDatabase();
}

export async function exportBackup() {
  const db = await dbPromise;
  const [settings, meta, categories, menuItems, orders] = await Promise.all([
    db.get("app", "settings"),
    db.get("app", "meta"),
    db.getAll("categories"),
    db.getAll("menuItems"),
    db.getAll("orders"),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    settings,
    meta,
    categories,
    menuItems,
    orders,
  };
}

export async function restoreBackup(data) {
  const db = await dbPromise;
  await db.clear("orders");
  await db.clear("menuItems");
  await db.clear("categories");
  await db.clear("app");

  if (data.settings) await db.put("app", { ...data.settings, id: "settings" });
  if (data.meta) await db.put("app", { ...data.meta, id: "meta" });

  for (const c of data.categories || []) {
    await db.put("categories", c);
  }
  for (const i of data.menuItems || []) {
    await db.put("menuItems", i);
  }
  for (const o of data.orders || []) {
    await db.put("orders", o);
  }

  await initDatabase();
}
