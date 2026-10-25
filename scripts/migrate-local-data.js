import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "abad-media";

if (!supabaseUrl || !serviceKey) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your local .env before migrating data.");
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function readJson(file, fallback = []) {
  try {
    return JSON.parse(await readFile(path.join(root, file), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

function contentType(file) {
  const extension = path.extname(file).toLowerCase();
  return ({
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
  })[extension] || "application/octet-stream";
}

async function migrateUpload(item, kind) {
  if (typeof item.url !== "string" || !item.url.startsWith("/uploads/")) return item;
  const filename = path.basename(item.url);
  const localFile = path.join(root, "public", "uploads", filename);
  const objectPath = `${kind}/${filename}`;
  const bytes = await readFile(localFile);
  const { error } = await supabase.storage.from(bucket).upload(objectPath, bytes, {
    contentType: contentType(filename),
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return { ...item, url: data.publicUrl, storagePath: objectPath };
}

const orders = await readJson("data/orders.json");
const menu = await readJson("data/menu-items.json");
const sales = await readJson("data/sales.json");
const gallery = await readJson("data/gallery.json");
const migratedMenu = await Promise.all(menu.map((item) => migrateUpload(item, "menu")));
const migratedGallery = await Promise.all(gallery.map((item) => migrateUpload(item, "gallery")));

for (const [key, value] of Object.entries({ orders, menu: migratedMenu, sales, gallery: migratedGallery })) {
  const { error } = await supabase.from("app_state").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

console.log(`Imported ${orders.length} orders, ${migratedMenu.length} menu items, ${sales.length} sales, and ${migratedGallery.length} gallery entries.`);
