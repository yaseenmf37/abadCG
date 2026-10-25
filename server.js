import "dotenv/config";
import express from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { menuItems } from "./src/components/menuItems.js";

const app = express();
const port = Number(process.env.API_PORT || 3001);
const adminPassword = process.env.ADMIN_PASSWORD || "";
const sessionSecret = process.env.SESSION_SECRET || "";
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;
const usesSupabase = Boolean(supabase);
const mediaBucket = process.env.SUPABASE_STORAGE_BUCKET || "abad-media";
const dataDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
const ordersFile = path.join(dataDirectory, "orders.json");
const menuFile = path.join(dataDirectory, "menu-items.json");
const salesFile = path.join(dataDirectory, "sales.json");
const galleryFile = path.join(dataDirectory, "gallery.json");
const uploadDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "public", "uploads");
const distDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "dist");
const sessionLifetime = 12 * 60 * 60 * 1000;
const validTables = new Set(Array.from({ length: 20 }, (_, index) => String(index + 1)));
const validCategories = new Set(["نوشیدنی گرم", "نوشیدنی سرد", "غذا", "صبحانه"]);
const galleryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (request, file, callback) => {
    const isImage = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
    const isVideo = ["video/mp4", "video/webm", "video/quicktime"].includes(file.mimetype);
    if (!isImage && !isVideo) return callback(new Error("فرمت فایل پشتیبانی نمی‌شود. عکس JPG/PNG/WEBP/GIF یا ویدئوی MP4/WEBM انتخاب کنید."));
    callback(null, true);
  },
});
const menuImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (request, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
      return callback(new Error("فرمت فایل پشتیبانی نمی‌شود. برای تصویر منو JPG، PNG، WEBP یا GIF انتخاب کنید."));
    }
    callback(null, true);
  },
});
let orderMutationQueue = Promise.resolve();

function serializeOrderMutation(task) {
  const result = orderMutationQueue.then(task, task);
  orderMutationQueue = result.catch(() => {});
  return result;
}

function ordersTableReserved(orders, table) {
  return orders.some((order) => order.table === table);
}

app.use(express.json({ limit: "32kb" }));
app.use((request, response, next) => {
  const originalApiPath = request.query?.__path;
  if (process.env.VERCEL && typeof originalApiPath === "string" && originalApiPath.startsWith("/api/")) {
    request.url = originalApiPath;
  }
  next();
});

async function readStoredValue(key, fallback = []) {
  if (!usesSupabase) {
    if (process.env.VERCEL) throw new Error("برای اجرای آنلاین، SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY را در تنظیمات Vercel وارد کنید.");
    return null;
  }
  const { data, error } = await supabase.from("app_state").select("value").eq("key", key).maybeSingle();
  if (error) throw error;
  return data?.value ?? fallback;
}

async function writeStoredValue(key, value) {
  if (!usesSupabase) {
    if (process.env.VERCEL) throw new Error("ذخیره‌سازی Supabase در محیط Vercel تنظیم نشده است.");
    return false;
  }
  const { error } = await supabase.from("app_state").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
  return true;
}

async function uploadMedia(file, prefix) {
  const extension = path.extname(file.originalname).toLowerCase();
  const objectPath = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
  if (usesSupabase) {
    const { error } = await supabase.storage.from(mediaBucket).upload(objectPath, file.buffer || await readFile(file.path), {
      contentType: file.mimetype,
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(mediaBucket).getPublicUrl(objectPath);
    return { url: data.publicUrl, storagePath: objectPath };
  }
  await mkdir(uploadDirectory, { recursive: true });
  const filename = `${prefix}-${path.basename(objectPath)}`;
  if (file.buffer) await writeFile(path.join(uploadDirectory, filename), file.buffer);
  else await writeFile(path.join(uploadDirectory, filename), await readFile(file.path));
  return { url: `/uploads/${filename}`, storagePath: null };
}

async function deleteMedia(item) {
  if (usesSupabase && item.storagePath) {
    const { error } = await supabase.storage.from(mediaBucket).remove([item.storagePath]);
    if (error) throw error;
  } else if (item.url?.startsWith("/uploads/")) {
    await unlink(path.join(uploadDirectory, path.basename(item.url))).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}

async function readOrders() {
  if (usesSupabase) return readStoredValue("orders");
  try {
    return JSON.parse(await readFile(ordersFile, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeOrders(orders) {
  if (await writeStoredValue("orders", orders)) return;
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(ordersFile, `${JSON.stringify(orders, null, 2)}\n`, "utf8");
}

async function readMenu() {
  if (usesSupabase) {
    const savedMenu = await readStoredValue("menu", null);
    if (savedMenu !== null) return savedMenu;
    const initialMenu = menuItems.map((item, index) => ({
      ...item,
      id: `menu-${index + 1}`,
      price: Number(item.price) || 0,
      costPrice: 0,
    }));
    await writeMenu(initialMenu);
    return initialMenu;
  }
  try {
    return JSON.parse(await readFile(menuFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const initialMenu = menuItems.map((item, index) => ({
      ...item,
      id: `menu-${index + 1}`,
      price: Number(item.price) || 0,
      costPrice: 0,
    }));
    await writeMenu(initialMenu);
    return initialMenu;
  }
}

async function writeMenu(items) {
  if (await writeStoredValue("menu", items)) return;
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(menuFile, `${JSON.stringify(items, null, 2)}\n`, "utf8");
}

async function readSales() {
  if (usesSupabase) return readStoredValue("sales");
  try {
    return JSON.parse(await readFile(salesFile, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeSales(sales) {
  if (await writeStoredValue("sales", sales)) return;
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(salesFile, `${JSON.stringify(sales, null, 2)}\n`, "utf8");
}

async function readGallery() {
  if (usesSupabase) return readStoredValue("gallery");
  try {
    return JSON.parse(await readFile(galleryFile, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function writeGallery(items) {
  if (await writeStoredValue("gallery", items)) return;
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(galleryFile, `${JSON.stringify(items, null, 2)}\n`, "utf8");
}

function validateMenuItem(input) {
  const title = typeof input?.title === "string" ? input.title.trim() : "";
  const category = typeof input?.category === "string" ? input.category : "";
  const price = Number(input?.price);
  if (!title || title.length > 100) return { error: "نام محصول باید بین ۱ تا ۱۰۰ نویسه باشد." };
  if (!validCategories.has(category)) return { error: "دسته‌بندی محصول معتبر نیست." };
  if (!Number.isFinite(price) || price < 0 || price > 1000000000) return { error: "قیمت محصول معتبر نیست." };
  const desc = typeof input.desc === "string" ? input.desc.trim().slice(0, 300) : "";
  const image = typeof input.image === "string" && input.image.trim() ? input.image.trim().slice(0, 500) : "";
  const costPrice = Number(input.costPrice);
  if (!Number.isFinite(costPrice) || costPrice < 0 || costPrice > 1000000000) return { error: "بهای تمام‌شده معتبر نیست." };
  return { item: { title, category, desc, price: String(Math.floor(price)), costPrice: String(Math.floor(costPrice)), image } };
}

async function normalizedMenu() {
  const items = await readMenu();
  let changed = false;
  const normalized = items.map((item) => {
    if (item.costPrice !== undefined) return item;
    changed = true;
    return { ...item, costPrice: "0" };
  });
  if (changed) await writeMenu(normalized);
  return normalized;
}

function tehranDate(isoDate) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(isoDate));
}

function signSession(expiresAt) {
  return createHmac("sha256", sessionSecret).update(String(expiresAt)).digest("hex");
}

function hasAdminSession(request) {
  if (!sessionSecret) return false;
  const cookies = Object.fromEntries(
    (request.headers.cookie || "").split(";").map((part) => {
      const separator = part.indexOf("=");
      return separator < 0 ? ["", ""] : [part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())];
    })
  );
  const [expiresAt, signature] = (cookies.abad_admin || "").split(".");
  const expires = Number(expiresAt);
  if (!Number.isFinite(expires) || expires < Date.now() || !signature) return false;
  const expected = signSession(expires);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function requireAdmin(request, response, next) {
  if (!hasAdminSession(request)) return response.status(401).json({ error: "ورود مدیر لازم است." });
  next();
}

app.post("/api/admin/login", (request, response) => {
  if (!adminPassword || !sessionSecret) {
    return response.status(503).json({ error: "رمز مدیر در تنظیمات سرور تعریف نشده است." });
  }
  const password = typeof request.body?.password === "string" ? request.body.password : "";
  const passwordBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(adminPassword);
  const valid = passwordBuffer.length === expectedBuffer.length && timingSafeEqual(passwordBuffer, expectedBuffer);
  if (!valid) return response.status(401).json({ error: "رمز واردشده درست نیست." });

  const expiresAt = Date.now() + sessionLifetime;
  response.cookie("abad_admin", `${expiresAt}.${signSession(expiresAt)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionLifetime,
    path: "/api/admin",
  });
  response.json({ ok: true });
});

app.post("/api/admin/logout", requireAdmin, (request, response) => {
  response.clearCookie("abad_admin", { httpOnly: true, sameSite: "strict", path: "/api/admin" });
  response.json({ ok: true });
});

app.get("/api/admin/orders", requireAdmin, async (request, response, next) => {
  try {
    response.json(await readOrders());
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/orders/:id/confirm", requireAdmin, async (request, response, next) => {
  try {
    const confirm = async () => {
    const orders = await readOrders();
    const order = orders.find((entry) => entry.id === request.params.id);
    if (!order) return response.status(404).json({ error: "سفارش پیدا نشد." });
    if (order.status === "confirmed") return response.status(409).json({ error: "این سفارش قبلاً تأیید شده است." });

    const catalog = await normalizedMenu();
    const confirmedAt = new Date().toISOString();
    const salesItems = order.items.map((item) => {
      const menuItem = catalog.find((entry) => entry.title === item.title);
      return {
        title: item.title,
        quantity: item.quantity,
        salePrice: Number(item.price) || 0,
        costPrice: Number(item.costPrice ?? menuItem?.costPrice) || 0,
      };
    });
    const sales = await readSales();
    const updatedOrder = {
      ...order,
      status: "confirmed",
      confirmedAt,
      items: order.items.map((item, index) => ({ ...item, costPrice: salesItems[index].costPrice })),
    };
    const sale = { id: order.id, table: order.table, confirmedAt, items: salesItems };
    if (usesSupabase) {
      const { data, error } = await supabase.rpc("confirm_cafe_order", {
        p_order_id: order.id,
        p_confirmed_order: updatedOrder,
        p_sale: sale,
      });
      if (error) throw error;
      if (data?.status === "missing") return response.status(404).json({ error: "سفارش پیدا نشد." });
      if (data?.status === "already_confirmed") return response.status(409).json({ error: "این سفارش قبلاً تأیید شده است." });
      return response.json({ ok: true, order: data.order });
    }
    if (!sales.some((sale) => sale.id === order.id)) {
      sales.push(sale);
      await writeSales(sales);
    }
    Object.assign(order, updatedOrder);
    await writeOrders(orders);
    response.json({ ok: true, order: updatedOrder });
    };
    if (usesSupabase) await confirm();
    else await serializeOrderMutation(confirm);
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/sales", requireAdmin, async (request, response, next) => {
  try {
    const sales = await readSales();
    const today = tehranDate(new Date());
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
    const todaySales = sales.filter((sale) => tehranDate(sale.confirmedAt) === today);
    const last30DaysSales = sales.filter((sale) => {
      const confirmedAt = new Date(sale.confirmedAt).getTime();
      return confirmedAt >= periodStart.getTime() && confirmedAt <= periodEnd.getTime();
    });
    const summarize = (records) => {
      const products = new Map();
      for (const sale of records) {
        for (const item of sale.items) {
          const current = products.get(item.title) || { title: item.title, quantity: 0, revenue: 0, cost: 0, profit: 0 };
          current.quantity += item.quantity;
          current.revenue += item.salePrice * item.quantity;
          current.cost += item.costPrice * item.quantity;
          current.profit += (item.salePrice - item.costPrice) * item.quantity;
          products.set(item.title, current);
        }
      }
      return [...products.values()].sort((left, right) => right.quantity - left.quantity);
    };
    response.json({
      today,
      todayOrders: todaySales.length,
      todayRevenue: todaySales.reduce((sum, sale) => sum + sale.items.reduce((itemsSum, item) => itemsSum + item.salePrice * item.quantity, 0), 0),
      todayCost: todaySales.reduce((sum, sale) => sum + sale.items.reduce((itemsSum, item) => itemsSum + item.costPrice * item.quantity, 0), 0),
      todayProfit: todaySales.reduce((sum, sale) => sum + sale.items.reduce((itemsSum, item) => itemsSum + (item.salePrice - item.costPrice) * item.quantity, 0), 0),
      todayProducts: summarize(todaySales),
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      last30DaysOrders: last30DaysSales.length,
      last30DaysRevenue: last30DaysSales.reduce((sum, sale) => sum + sale.items.reduce((itemsSum, item) => itemsSum + item.salePrice * item.quantity, 0), 0),
      last30DaysCost: last30DaysSales.reduce((sum, sale) => sum + sale.items.reduce((itemsSum, item) => itemsSum + item.costPrice * item.quantity, 0), 0),
      last30DaysProfit: last30DaysSales.reduce((sum, sale) => sum + sale.items.reduce((itemsSum, item) => itemsSum + (item.salePrice - item.costPrice) * item.quantity, 0), 0),
      last30DaysProducts: summarize(last30DaysSales),
      allProducts: summarize(sales),
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/data/reset", requireAdmin, async (request, response, next) => {
  try {
    const reset = async () => {
      if (request.body?.confirmation !== "RESET") {
        return response.status(400).json({ error: "برای ریست، تأیید صریح لازم است." });
      }
      const orders = await readOrders();
      const sales = await readSales();
      if (usesSupabase) {
        const { error } = await supabase.rpc("reset_cafe_activity");
        if (error) throw error;
        return response.json({ ok: true, deletedOrders: orders.length, deletedSales: sales.length });
      }
      await writeOrders([]);
      await writeSales([]);
      response.json({ ok: true, deletedOrders: orders.length, deletedSales: sales.length });
    };
    if (usesSupabase) await reset();
    else await serializeOrderMutation(reset);
  } catch (error) {
    next(error);
  }
});

app.get("/api/menu-items", async (request, response, next) => {
  try {
    const items = await readMenu();
    response.json(items.map(({ costPrice, ...item }) => item));
  } catch (error) {
    next(error);
  }
});

app.get("/api/gallery", async (request, response, next) => {
  try {
    response.json(await readGallery());
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/gallery", requireAdmin, async (request, response, next) => {
  try {
    response.json(await readGallery());
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/gallery", requireAdmin, galleryUpload.single("file"), async (request, response, next) => {
  try {
    if (!request.file) return response.status(400).json({ error: "یک فایل عکس یا ویدئو انتخاب کنید." });
    const caption = typeof request.body.caption === "string" ? request.body.caption.trim().slice(0, 300) : "";
    const uploaded = await uploadMedia(request.file, "gallery");
    const media = {
      id: `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: request.file.mimetype.startsWith("video/") ? "video" : "image",
      url: uploaded.url,
      storagePath: uploaded.storagePath,
      caption,
      createdAt: new Date().toISOString(),
    };
    const items = await readGallery();
    items.unshift(media);
    await writeGallery(items);
    response.status(201).json(media);
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/media/upload-url", requireAdmin, async (request, response, next) => {
  try {
    if (!usesSupabase) return response.status(501).json({ error: "direct-upload-unavailable" });
    const { filename, mimetype, kind } = request.body || {};
    const allowedImages = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const allowedVideos = ["video/mp4", "video/webm", "video/quicktime"];
    if (!['gallery', 'menu'].includes(kind)) return response.status(400).json({ error: "نوع رسانه معتبر نیست." });
    if (!(kind === "menu" ? allowedImages : [...allowedImages, ...allowedVideos]).includes(mimetype)) {
      return response.status(400).json({ error: "فرمت فایل پشتیبانی نمی‌شود." });
    }
    const extension = path.extname(typeof filename === "string" ? filename : "").toLowerCase();
    const objectPath = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
    const { data, error } = await supabase.storage.from(mediaBucket).createSignedUploadUrl(objectPath);
    if (error) throw error;
    const encodedPath = data.path.split("/").map(encodeURIComponent).join("/");
    response.json({
      signedUrl: `${supabaseUrl}/storage/v1/object/upload/sign/${encodeURIComponent(mediaBucket)}/${encodedPath}?token=${encodeURIComponent(data.token)}`,
      path: data.path,
      token: data.token,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/media/complete", requireAdmin, async (request, response, next) => {
  try {
    if (!usesSupabase) return response.status(501).json({ error: "direct-upload-unavailable" });
    const { path: objectPath, kind, caption = "" } = request.body || {};
    if (typeof objectPath !== "string" || !["gallery", "menu"].includes(kind) || !objectPath.startsWith(`${kind}/`)) {
      return response.status(400).json({ error: "اطلاعات فایل معتبر نیست." });
    }
    const { data } = supabase.storage.from(mediaBucket).getPublicUrl(objectPath);
    if (kind === "menu") return response.status(201).json({ url: data.publicUrl });
    const media = {
      id: `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: path.extname(objectPath).toLowerCase() === ".mp4" || path.extname(objectPath).toLowerCase() === ".webm" || path.extname(objectPath).toLowerCase() === ".mov" ? "video" : "image",
      url: data.publicUrl,
      storagePath: objectPath,
      caption: typeof caption === "string" ? caption.trim().slice(0, 300) : "",
      createdAt: new Date().toISOString(),
    };
    const items = await readGallery();
    items.unshift(media);
    await writeGallery(items);
    response.status(201).json(media);
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/gallery/:id", requireAdmin, async (request, response, next) => {
  try {
    const items = await readGallery();
    const item = items.find((entry) => entry.id === request.params.id);
    if (!item) return response.status(404).json({ error: "مطلب گالری پیدا نشد." });
    item.caption = typeof request.body?.caption === "string" ? request.body.caption.trim().slice(0, 300) : "";
    await writeGallery(items);
    response.json(item);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/gallery/:id", requireAdmin, async (request, response, next) => {
  try {
    const items = await readGallery();
    const item = items.find((entry) => entry.id === request.params.id);
    if (!item) return response.status(404).json({ error: "مطلب گالری پیدا نشد." });
    await writeGallery(items.filter((entry) => entry.id !== request.params.id));
    await deleteMedia(item);
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/menu-items", requireAdmin, async (request, response, next) => {
  try {
    response.json(await normalizedMenu());
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/menu-image", requireAdmin, menuImageUpload.single("file"), async (request, response, next) => {
  try {
    if (!request.file) return response.status(400).json({ error: "یک فایل تصویر انتخاب کنید." });
    response.status(201).json(await uploadMedia(request.file, "menu"));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/menu-items", requireAdmin, async (request, response, next) => {
  try {
    const validation = validateMenuItem(request.body);
    if (validation.error) return response.status(400).json({ error: validation.error });
    const items = await normalizedMenu();
    if (items.some((item) => item.title === validation.item.title && item.category === validation.item.category)) {
      return response.status(409).json({ error: "این محصول در این دسته‌بندی وجود دارد." });
    }
    const item = { ...validation.item, id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
    items.push(item);
    await writeMenu(items);
    response.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/menu-items/:id", requireAdmin, async (request, response, next) => {
  try {
    const validation = validateMenuItem(request.body);
    if (validation.error) return response.status(400).json({ error: validation.error });
    const items = await normalizedMenu();
    const index = items.findIndex((item) => item.id === request.params.id);
    if (index < 0) return response.status(404).json({ error: "محصول پیدا نشد." });
    if (items.some((item) => item.id !== request.params.id && item.title === validation.item.title && item.category === validation.item.category)) {
      return response.status(409).json({ error: "این محصول در این دسته‌بندی وجود دارد." });
    }
    items[index] = { ...validation.item, id: request.params.id };
    await writeMenu(items);
    response.json(items[index]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/menu-items/:id", requireAdmin, async (request, response, next) => {
  try {
    const items = await normalizedMenu();
    const remaining = items.filter((item) => item.id !== request.params.id);
    if (remaining.length === items.length) return response.status(404).json({ error: "محصول پیدا نشد." });
    await writeMenu(remaining);
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", async (request, response, next) => {
  try {
    const create = async () => {
    const table = String(request.body?.table || "");
    const requestedItems = request.body?.items;
    if (!validTables.has(table) || !Array.isArray(requestedItems) || requestedItems.length < 1 || requestedItems.length > 50) {
      return response.status(400).json({ error: "میز یا اقلام سفارش معتبر نیست." });
    }

    const catalog = await normalizedMenu();
    if (!usesSupabase && ordersTableReserved(await readOrders(), table)) {
      return response.status(409).json({ error: `میز ${table} در حال حاضر سفارش فعال دارد. برای ثبت سفارش جدید با مدیر کافه هماهنگ کنید.` });
    }
    const items = requestedItems.map((item) => {
      const catalogItem = catalog.find((entry) => entry.title === item?.title);
      if (!catalogItem || typeof item.title !== "string") return null;
      return {
        title: catalogItem.title,
        quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1))),
        price: Number(catalogItem.price) || 0,
        costPrice: Number(catalogItem.costPrice) || 0,
      };
    });
    if (items.some((item) => !item)) return response.status(400).json({ error: "یکی از محصولات سفارش معتبر نیست." });

    const orders = await readOrders();
    const order = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      table,
      items,
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    if (usesSupabase) {
      const { data, error } = await supabase.rpc("reserve_cafe_table", { p_order: order });
      if (error) throw error;
      if (!data) return response.status(409).json({ error: `میز ${table} در حال حاضر سفارش فعال دارد. برای ثبت سفارش جدید با مدیر کافه هماهنگ کنید.` });
      return response.status(201).json({ ok: true, orderId: order.id });
    }
    orders.unshift(order);
    await writeOrders(orders);
    response.status(201).json({ ok: true, orderId: order.id });
    };
    if (usesSupabase) await create();
    else await serializeOrderMutation(create);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/orders/:id", requireAdmin, async (request, response, next) => {
  try {
    const remove = async () => {
    if (usesSupabase) {
      const { data, error } = await supabase.rpc("delete_cafe_order", { p_order_id: request.params.id });
      if (error) throw error;
      if (!data) return response.status(404).json({ error: "سفارش پیدا نشد." });
      return response.json({ ok: true });
    }
    const orders = await readOrders();
    const remaining = orders.filter((order) => order.id !== request.params.id);
    if (remaining.length === orders.length) return response.status(404).json({ error: "سفارش پیدا نشد." });
    await writeOrders(remaining);
    response.json({ ok: true });
    };
    if (usesSupabase) await remove();
    else await serializeOrderMutation(remove);
  } catch (error) {
    next(error);
  }
});

if (!process.env.VERCEL && existsSync(distDirectory)) {
  app.use("/uploads", express.static(uploadDirectory));
  app.use(express.static(distDirectory));
  app.use((request, response, next) => {
    if (request.method !== "GET" || request.path.startsWith("/api/")) return next();
    response.sendFile(path.join(distDirectory, "index.html"));
  });
}

app.use((error, request, response, next) => {
  if (error instanceof multer.MulterError) {
    return response.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: error.code === "LIMIT_FILE_SIZE" ? "حجم فایل باید کمتر از ۱۰۰ مگابایت باشد." : "بارگذاری فایل ناموفق بود." });
  }
  if (error.message?.startsWith("فرمت فایل پشتیبانی نمی‌شود")) {
    return response.status(400).json({ error: error.message });
  }
  console.error(error);
  response.status(500).json({ error: "خطای داخلی سرور." });
});

if (!process.env.VERCEL) {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Abad ordering API listening on port ${port}`);
  });
}

export { app };
export default app;
