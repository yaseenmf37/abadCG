import { useEffect, useRef, useState } from "react";

function formatPrice(amount) {
  return Number(amount || 0).toLocaleString("fa-IR");
}

const menuCategories = ["نوشیدنی گرم", "نوشیدنی سرد", "غذا", "صبحانه"];

const emptyMenuForm = {
  title: "",
  category: menuCategories[0],
  desc: "",
  costPrice: "0",
  price: "",
  image: "",
};

const placeholderImage =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="#eee9e4"/><path d="M56 34c-11-5-22 6-18 16 3 9 13 11 18 3" fill="none" stroke="#a54832" stroke-width="4" stroke-linecap="round"/></svg>`
  );

function elapsedSince(createdAt, now) {
  const seconds = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours.toLocaleString("fa-IR")} ساعت و ${(minutes % 60).toLocaleString("fa-IR")} دقیقه`;
  }
  if (minutes) return `${minutes.toLocaleString("fa-IR")} دقیقه و ${remainingSeconds.toLocaleString("fa-IR")} ثانیه`;
  return `${remainingSeconds.toLocaleString("fa-IR")} ثانیه`;
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const responseText = await response.text();
  let data = {};
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error("سرور سفارش پاسخ معتبری نداد؛ سرور برنامه را دوباره اجرا کنید.");
  }
  if (!response.ok) throw new Error(data.error || "ارتباط با سرور برقرار نشد.");
  return data;
}

async function uploadDirectToStorage(file, kind, caption = "") {
  const signedResponse = await fetch("/api/admin/media/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, mimetype: file.type, kind }),
  });
  const signedText = await signedResponse.text();
  let signedData = {};
  try {
    signedData = signedText ? JSON.parse(signedText) : {};
  } catch {
    throw new Error("پاسخ سرور برای آماده‌سازی آپلود معتبر نیست.");
  }
  if (signedResponse.status === 501) return null;
  if (!signedResponse.ok) throw new Error(signedData.error || "آماده‌سازی بارگذاری فایل انجام نشد.");

  const uploadResponse = await fetch(signedData.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type, "Authorization": `Bearer ${signedData.token}`, "x-upsert": "false" },
    body: file,
  });
  if (!uploadResponse.ok) throw new Error("بارگذاری مستقیم فایل در فضای ابری ناموفق بود.");

  return request("/api/admin/media/complete", {
    method: "POST",
    body: JSON.stringify({ path: signedData.path, kind, caption }),
  });
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState([]);
  const [salesReport, setSalesReport] = useState(null);
  const [resettingData, setResettingData] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [menuForm, setMenuForm] = useState(emptyMenuForm);
  const [menuImageFile, setMenuImageFile] = useState(null);
  const menuImageInputRef = useRef(null);
  const [editingMenuId, setEditingMenuId] = useState("");
  const [savingMenu, setSavingMenu] = useState(false);
  const [galleryFile, setGalleryFile] = useState(null);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let active = true;
    request("/api/admin/orders")
      .then(async (data) => {
        if (!active) return;
        setOrders(data);
        setMenuItems(await request("/api/admin/menu-items"));
        setGalleryItems(await request("/api/admin/gallery"));
        setAuthenticated(true);
      })
      .catch(() => {})
      .finally(() => active && setChecking(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!authenticated) return undefined;
    const poll = window.setInterval(async () => {
      setNow(Date.now());
      try {
        setOrders(await request("/api/admin/orders"));
      } catch (fetchError) {
        if (fetchError.message.includes("ورود مدیر")) setAuthenticated(false);
        else setError(fetchError.message);
      }
    }, 5000);
    return () => window.clearInterval(poll);
  }, [authenticated]);

  async function login(event) {
    event.preventDefault();
    setError("");
    try {
      await request("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
      setOrders(await request("/api/admin/orders"));
      setMenuItems(await request("/api/admin/menu-items"));
      setGalleryItems(await request("/api/admin/gallery"));
      setAuthenticated(true);
      setPassword("");
    } catch (loginError) {
      setError(loginError.message);
    }
  }

  async function closeOrder(order) {
    const confirmed = window.confirm(`سفارش میز ${Number(order.table).toLocaleString("fa-IR")} کامل حذف و میز آزاد شود؟`);
    if (!confirmed) return;
    setBusyId(order.id);
    setError("");
    try {
      await request(`/api/admin/orders/${encodeURIComponent(order.id)}`, { method: "DELETE" });
      setOrders((current) => current.filter((item) => item.id !== order.id));
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusyId("");
    }
  }

  async function confirmOrder(order) {
    if (order.status === "confirmed") return;
    setBusyId(order.id);
    setError("");
    try {
      const result = await request(`/api/admin/orders/${encodeURIComponent(order.id)}/confirm`, { method: "POST" });
      setOrders((current) => current.map((entry) => entry.id === order.id ? result.order : entry));
      setSalesReport(await request("/api/admin/sales"));
    } catch (confirmError) {
      setError(confirmError.message);
    } finally {
      setBusyId("");
    }
  }

  async function logout() {
    try {
      await request("/api/admin/logout", { method: "POST" });
    } finally {
      setAuthenticated(false);
      setOrders([]);
      setMenuItems([]);
      setGalleryItems([]);
    }
  }

  async function saveMenuItem(event) {
    event.preventDefault();
    setSavingMenu(true);
    setError("");
    try {
      const editing = Boolean(editingMenuId);
      let image = menuForm.image;
      if (menuImageFile) {
        const directUpload = await uploadDirectToStorage(menuImageFile, "menu");
        if (directUpload) {
          image = directUpload.url;
        } else {
          const formData = new FormData();
          formData.set("file", menuImageFile);
          const uploadResponse = await fetch("/api/admin/menu-image", { method: "POST", body: formData });
          const uploadText = await uploadResponse.text();
          let uploadResult;
          try {
            uploadResult = uploadText ? JSON.parse(uploadText) : {};
          } catch {
            throw new Error("پاسخ سرور برای بارگذاری تصویر معتبر نیست.");
          }
          if (!uploadResponse.ok) throw new Error(uploadResult.error || "بارگذاری تصویر انجام نشد.");
          image = uploadResult.url;
        }
      }
      const saved = await request(
        editing ? `/api/admin/menu-items/${encodeURIComponent(editingMenuId)}` : "/api/admin/menu-items",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify({ ...menuForm, image }),
        }
      );
      setMenuItems((current) => editing
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [...current, saved]);
      setMenuForm(emptyMenuForm);
      setEditingMenuId("");
      setMenuImageFile(null);
      if (menuImageInputRef.current) menuImageInputRef.current.value = "";
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingMenu(false);
    }
  }

  function editMenuItem(item) {
    setEditingMenuId(item.id);
    setMenuImageFile(null);
    if (menuImageInputRef.current) menuImageInputRef.current.value = "";
    setMenuForm({
      title: item.title,
      category: item.category,
      desc: item.desc || "",
      costPrice: String(item.costPrice || 0),
      price: String(item.price),
      image: item.image || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteMenuItem(item) {
    if (!window.confirm(`«${item.title}» از منوی مشتری حذف شود؟`)) return;
    setError("");
    try {
      await request(`/api/admin/menu-items/${encodeURIComponent(item.id)}`, { method: "DELETE" });
      setMenuItems((current) => current.filter((entry) => entry.id !== item.id));
      if (editingMenuId === item.id) {
        setEditingMenuId("");
        setMenuForm(emptyMenuForm);
      }
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function openSalesReport() {
    setActiveTab("sales");
    setError("");
    try {
      setSalesReport(await request("/api/admin/sales"));
    } catch (reportError) {
      setError(reportError.message);
    }
  }

  async function uploadGalleryItem(event) {
    event.preventDefault();
    if (!galleryFile) {
      setError("یک عکس یا ویدئو برای بارگذاری انتخاب کنید.");
      return;
    }
    setUploadingGallery(true);
    setError("");
    try {
      let saved = await uploadDirectToStorage(galleryFile, "gallery", galleryCaption);
      if (!saved) {
        const formData = new FormData();
        formData.set("file", galleryFile);
        formData.set("caption", galleryCaption);
        const response = await fetch("/api/admin/gallery", { method: "POST", body: formData });
        const responseText = await response.text();
        try {
          saved = responseText ? JSON.parse(responseText) : {};
        } catch {
          throw new Error("پاسخ سرور برای بارگذاری معتبر نیست.");
        }
        if (!response.ok) throw new Error(saved.error || "بارگذاری رسانه انجام نشد.");
      }
      setGalleryItems((current) => [saved, ...current]);
      setGalleryFile(null);
      setGalleryCaption("");
      event.currentTarget.reset();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploadingGallery(false);
    }
  }

  async function editGalleryCaption(item) {
    const caption = window.prompt("کپشن رسانه:", item.caption || "");
    if (caption === null || caption.trim() === (item.caption || "")) return;
    setError("");
    try {
      const updated = await request(`/api/admin/gallery/${encodeURIComponent(item.id)}`, {
        method: "PUT",
        body: JSON.stringify({ caption }),
      });
      setGalleryItems((current) => current.map((entry) => entry.id === item.id ? updated : entry));
    } catch (editError) {
      setError(editError.message);
    }
  }

  async function deleteGalleryItem(item) {
    if (!window.confirm("این عکس یا ویدئو از گالری حذف شود؟")) return;
    setError("");
    try {
      await request(`/api/admin/gallery/${encodeURIComponent(item.id)}`, { method: "DELETE" });
      setGalleryItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function resetTestData() {
    const accepted = window.confirm("همه سفارش‌های فعال و تمام گزارش‌های فروش پاک می‌شوند. منو و قیمت‌ها باقی می‌مانند. ادامه می‌دهید؟");
    if (!accepted) return;
    const confirmation = window.prompt("برای تأیید نهایی، RESET را وارد کنید.");
    if (confirmation !== "RESET") return;

    setResettingData(true);
    setError("");
    try {
      const result = await request("/api/admin/data/reset", {
        method: "POST",
        body: JSON.stringify({ confirmation }),
      });
      setOrders([]);
      setSalesReport(await request("/api/admin/sales"));
      window.alert(`ریست انجام شد. ${result.deletedOrders.toLocaleString("fa-IR")} سفارش و ${result.deletedSales.toLocaleString("fa-IR")} فروش پاک شد. منو و قیمت‌ها باقی ماندند.`);
    } catch (resetError) {
      setError(resetError.message);
    } finally {
      setResettingData(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f3f0ec] text-[#262321]">
      <header className="border-b border-black/10 bg-[#201b19] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs text-[#db9a81]">ABAD CAFE · MANAGEMENT</p>
            <h1 className="mt-1 text-xl font-bold">پنل مدیریت کافه</h1>
          </div>
          {authenticated && (
            <button onClick={logout} className="rounded-md border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
              خروج از پنل
            </button>
          )}
        </div>
      </header>

      {checking ? (
        <p className="mx-auto max-w-6xl px-5 py-12 text-sm text-[#746c67]">در حال بررسی دسترسی...</p>
      ) : !authenticated ? (
        <form onSubmit={login} className="mx-auto mt-16 max-w-md px-5">
          <div className="border-t-2 border-[#a54832] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold">ورود مدیر</h2>
            <p className="mt-2 text-sm text-[#746c67]">برای مشاهده سفارش‌های فعال، رمز مدیر را وارد کنید.</p>
            <label className="mt-6 block text-sm font-semibold" htmlFor="admin-password">رمز عبور</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-md border border-[#d8d1cb] bg-[#faf9f7] px-3 py-3 outline-none focus:border-[#a54832]"
              required
            />
            {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
            <button className="mt-5 w-full rounded-md bg-[#a54832] px-4 py-3 font-semibold text-white hover:bg-[#873b2b]">ورود به پنل</button>
          </div>
        </form>
      ) : (
        <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <nav aria-label="بخش‌های مدیریت" className="mb-7 flex gap-2 border-b border-[#d8d1cb]">
            <button
              type="button"
              aria-current={activeTab === "orders" ? "page" : undefined}
              onClick={() => setActiveTab("orders")}
              className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === "orders" ? "border-[#a54832] text-[#8b3a2b]" : "border-transparent text-[#746c67] hover:text-[#262321]"}`}
            >
              سفارش‌ها
            </button>
            <button
              type="button"
              aria-current={activeTab === "menu" ? "page" : undefined}
              onClick={() => setActiveTab("menu")}
              className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === "menu" ? "border-[#a54832] text-[#8b3a2b]" : "border-transparent text-[#746c67] hover:text-[#262321]"}`}
            >
              مدیریت منو
            </button>
            <button
              type="button"
              aria-current={activeTab === "sales" ? "page" : undefined}
              onClick={openSalesReport}
              className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === "sales" ? "border-[#a54832] text-[#8b3a2b]" : "border-transparent text-[#746c67] hover:text-[#262321]"}`}
            >
              فروش و سود
            </button>
            <button
              type="button"
              aria-current={activeTab === "gallery" ? "page" : undefined}
              onClick={() => setActiveTab("gallery")}
              className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === "gallery" ? "border-[#a54832] text-[#8b3a2b]" : "border-transparent text-[#746c67] hover:text-[#262321]"}`}
            >
              گالری
            </button>
          </nav>

          {error && <p role="alert" className="mb-5 border-r-4 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

          <div className={activeTab === "orders" ? "" : "hidden"}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-[#d8d1cb] pb-5">
            <div>
              <p className="text-sm text-[#746c67]">سفارش‌های ثبت‌شده و در انتظار آماده‌سازی</p>
              <p className="mt-2 text-2xl font-bold">{orders.length.toLocaleString("fa-IR")} سفارش فعال</p>
            </div>
            <span className="text-xs text-[#746c67]">به‌روزرسانی خودکار هر ۵ ثانیه</span>
          </div>

          {orders.length === 0 ? (
            <div className="border border-dashed border-[#c9c0b9] px-5 py-16 text-center text-[#746c67]">
              <p className="text-lg font-semibold">فعلاً سفارشی ثبت نشده</p>
              <p className="mt-2 text-sm">سفارش‌های جدید به‌محض ثبت در این صفحه نمایش داده می‌شوند.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#ded8d2] border-y border-[#ded8d2]">
              {orders.map((order) => {
                const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                return (
                  <article key={order.id} className="grid gap-5 bg-white px-4 py-5 sm:grid-cols-[1fr_auto] sm:px-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <h2 className="text-xl font-bold">میز {Number(order.table).toLocaleString("fa-IR")}</h2>
                        <span className="text-sm text-[#746c67]">از ثبت سفارش: {elapsedSince(order.createdAt, now)}</span>
                        <span className={`rounded px-2 py-1 text-xs font-semibold ${order.status === "confirmed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                          {order.status === "confirmed" ? "تأیید شده · در فروش ثبت شد" : "در انتظار تأیید"}
                        </span>
                      </div>
                      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                        {order.items.map((item, index) => (
                          <li key={`${item.title}-${index}`} className="flex justify-between gap-4 border-b border-[#f0ece8] pb-2 text-sm">
                            <span>{item.title} <span className="text-[#746c67]">× {item.quantity.toLocaleString("fa-IR")}</span></span>
                            <span className="shrink-0 text-[#746c67]">{formatPrice(item.price * item.quantity)} تومان</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-sm font-bold">جمع: {formatPrice(total)} تومان</p>
                    </div>
                    <div className="flex flex-wrap items-start gap-2">
                      {order.status !== "confirmed" && (
                        <button
                          onClick={() => confirmOrder(order)}
                          disabled={busyId === order.id}
                          className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                        >
                          {busyId === order.id ? "در حال ثبت..." : "تأیید و ثبت فروش"}
                        </button>
                      )}
                      <button
                        onClick={() => closeOrder(order)}
                        disabled={busyId === order.id}
                        className="rounded-md bg-[#a54832] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#873b2b] disabled:opacity-50"
                      >
                        {busyId === order.id ? "در حال انجام..." : "حذف سفارش و آزادکردن میز"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          </div>

          {activeTab === "menu" && (
            <div>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-[#d8d1cb] pb-5">
                <div>
                  <p className="text-sm text-[#746c67]">محصولاتی که مشتری در منو می‌بیند</p>
                  <p className="mt-2 text-2xl font-bold">{menuItems.length.toLocaleString("fa-IR")} آیتم منو</p>
                </div>
                <span className="text-xs text-[#746c67]">تغییرات به‌صورت خودکار ذخیره می‌شوند</span>
              </div>

              <form onSubmit={saveMenuItem} className="mb-8 border-t-2 border-[#a54832] bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold">{editingMenuId ? "ویرایش محصول" : "افزودن محصول جدید"}</h2>
                  {editingMenuId && (
                    <button type="button" onClick={() => { setEditingMenuId(""); setMenuForm(emptyMenuForm); setMenuImageFile(null); if (menuImageInputRef.current) menuImageInputRef.current.value = ""; }} className="text-sm text-[#8b3a2b] hover:underline">
                      لغو ویرایش
                    </button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold">نام محصول
                    <input required maxLength={100} value={menuForm.title} onChange={(event) => setMenuForm({ ...menuForm, title: event.target.value })} className="mt-2 w-full rounded-md border border-[#d8d1cb] bg-[#faf9f7] px-3 py-2.5 font-normal outline-none focus:border-[#a54832]" />
                  </label>
                  <label className="text-sm font-semibold">دسته‌بندی
                    <select value={menuForm.category} onChange={(event) => setMenuForm({ ...menuForm, category: event.target.value })} className="mt-2 w-full rounded-md border border-[#d8d1cb] bg-[#faf9f7] px-3 py-2.5 font-normal outline-none focus:border-[#a54832]">
                      {menuCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-semibold">بهای تمام‌شده برای کافه · تومان
                    <input required type="number" min="0" max="1000000000" step="1" value={menuForm.costPrice} onChange={(event) => setMenuForm({ ...menuForm, costPrice: event.target.value })} className="mt-2 w-full rounded-md border border-[#d8d1cb] bg-[#faf9f7] px-3 py-2.5 font-normal outline-none focus:border-[#a54832]" />
                  </label>
                  <label className="text-sm font-semibold">قیمت فروش به مشتری · تومان
                    <input required type="number" min="0" max="1000000000" step="1" value={menuForm.price} onChange={(event) => setMenuForm({ ...menuForm, price: event.target.value })} className="mt-2 w-full rounded-md border border-[#d8d1cb] bg-[#faf9f7] px-3 py-2.5 font-normal outline-none focus:border-[#a54832]" />
                  </label>
                  <div className="text-sm font-semibold">
                    <label htmlFor="menu-image-file">تصویر محصول</label>
                    <input
                      ref={menuImageInputRef}
                      id="menu-image-file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(event) => setMenuImageFile(event.target.files?.[0] || null)}
                      className="mt-2 block w-full text-sm file:ml-3 file:rounded file:border-0 file:bg-[#f0e9e5] file:px-3 file:py-2 file:text-xs file:font-semibold"
                    />
                    <span className="mt-1 block text-xs font-normal text-[#746c67]">JPG، PNG، WEBP یا GIF · حداکثر ۱۰ مگابایت{editingMenuId ? " · انتخاب‌نکردن فایل، تصویر فعلی را نگه می‌دارد" : ""}</span>
                    {menuImageFile && <span className="mt-1 block truncate text-xs font-normal text-[#8b3a2b]">فایل انتخاب‌شده: {menuImageFile.name}</span>}
                    <img src={menuForm.image || placeholderImage} onError={(event) => { if (event.currentTarget.src !== placeholderImage) event.currentTarget.src = placeholderImage; }} alt="پیش‌نمایش تصویر محصول" className="mt-3 h-20 w-20 rounded-md border border-[#ded8d2] object-cover" />
                  </div>
                  <label className="text-sm font-semibold sm:col-span-2">توضیحات
                    <textarea maxLength={300} rows={2} value={menuForm.desc} onChange={(event) => setMenuForm({ ...menuForm, desc: event.target.value })} className="mt-2 w-full resize-y rounded-md border border-[#d8d1cb] bg-[#faf9f7] px-3 py-2.5 font-normal outline-none focus:border-[#a54832]" />
                  </label>
                </div>
                <button disabled={savingMenu} className="mt-5 rounded-md bg-[#a54832] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#873b2b] disabled:opacity-50">
                  {savingMenu ? "در حال ذخیره..." : editingMenuId ? "ذخیره تغییرات" : "افزودن به منو"}
                </button>
              </form>

              <div className="divide-y divide-[#ded8d2] border-y border-[#ded8d2]">
                {menuCategories.map((category) => {
                  const categoryItems = menuItems.filter((item) => item.category === category);
                  return (
                    <section key={category} className="py-5">
                      <h3 className="mb-3 text-sm font-bold text-[#8b3a2b]">{category} <span className="font-normal text-[#746c67]">({categoryItems.length.toLocaleString("fa-IR")})</span></h3>
                      {categoryItems.length ? (
                        <ul className="divide-y divide-[#eee9e4]">
                          {categoryItems.map((item) => (
                            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <img src={item.image || placeholderImage} onError={(event) => { if (event.currentTarget.src !== placeholderImage) event.currentTarget.src = placeholderImage; }} alt="" className="h-12 w-12 rounded object-cover" />
                                <div className="min-w-0">
                                  <p className="font-semibold">{item.title}</p>
                                  <p className="mt-1 text-xs text-[#746c67]">بها: {formatPrice(item.costPrice)} · فروش: {formatPrice(item.price)} · سود: {formatPrice(Number(item.price) - Number(item.costPrice))} تومان{item.desc ? ` · ${item.desc}` : ""}</p>
                                </div>
                              </div>
                              <div className="flex shrink-0 gap-2">
                                <button type="button" onClick={() => editMenuItem(item)} className="rounded border border-[#d8d1cb] px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f0ec]">ویرایش</button>
                                <button type="button" onClick={() => deleteMenuItem(item)} className="rounded border border-[#c87d70]/50 px-3 py-1.5 text-xs font-semibold text-[#963e32] hover:bg-red-50">حذف</button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="py-2 text-sm text-[#746c67]">هنوز محصولی در این دسته ثبت نشده است.</p>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "sales" && (
            <div>
              <div className="mb-6 border-b border-[#d8d1cb] pb-5">
                <p className="text-sm text-[#746c67]">فقط سفارش‌های تأییدشده در این محاسبات شمرده می‌شوند.</p>
                <h2 className="mt-2 text-2xl font-bold">گزارش فروش و سود</h2>
                {salesReport && <p className="mt-1 text-xs text-[#746c67]">امروز: {salesReport.today}</p>}
              </div>

              {!salesReport ? (
                <p className="py-12 text-center text-sm text-[#746c67]">در حال دریافت گزارش...</p>
              ) : (
                <>
                  <div className="mb-8 grid gap-px border border-[#ded8d2] bg-[#ded8d2] sm:grid-cols-4">
                    {[
                      ["سفارش‌های تأییدشده امروز", salesReport.todayOrders],
                      ["فروش امروز", `${formatPrice(salesReport.todayRevenue)} تومان`],
                      ["بهای تمام‌شده امروز", `${formatPrice(salesReport.todayCost)} تومان`],
                      ["سود امروز", `${formatPrice(salesReport.todayProfit)} تومان`],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-white px-4 py-5">
                        <p className="text-xs text-[#746c67]">{label}</p>
                        <p className="mt-2 text-lg font-bold">{typeof value === "number" ? value.toLocaleString("fa-IR") : value}</p>
                      </div>
                    ))}
                  </div>

                  <section className="mb-8">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold">گزارش ۳۰ روز اخیر</h3>
                      <p className="mt-1 text-xs text-[#746c67]">از {new Date(salesReport.periodStart).toLocaleDateString("fa-IR")} تا {new Date(salesReport.periodEnd).toLocaleDateString("fa-IR")}</p>
                    </div>
                    <div className="mb-4 grid gap-px border border-[#ded8d2] bg-[#ded8d2] sm:grid-cols-4">
                      {[
                        ["سفارش‌های تأییدشده", salesReport.last30DaysOrders.toLocaleString("fa-IR")],
                        ["فروش", `${formatPrice(salesReport.last30DaysRevenue)} تومان`],
                        ["بهای تمام‌شده", `${formatPrice(salesReport.last30DaysCost)} تومان`],
                        ["سود خالص کالاها", `${formatPrice(salesReport.last30DaysProfit)} تومان`],
                      ].map(([label, value]) => (
                        <div key={label} className="bg-white px-4 py-4">
                          <p className="text-xs text-[#746c67]">{label}</p>
                          <p className="mt-2 font-bold">{value}</p>
                        </div>
                      ))}
                    </div>
                    {salesReport.last30DaysProducts.length ? (
                      <div className="overflow-x-auto border-y border-[#ded8d2] bg-white">
                        <table className="w-full min-w-[650px] text-right text-sm">
                          <thead className="bg-[#ebe6e1] text-xs text-[#5e5651]">
                            <tr><th className="px-4 py-3">محصول</th><th className="px-4 py-3">تعداد</th><th className="px-4 py-3">فروش</th><th className="px-4 py-3">بهای تمام‌شده</th><th className="px-4 py-3">سود</th></tr>
                          </thead>
                          <tbody className="divide-y divide-[#eee9e4]">
                            {salesReport.last30DaysProducts.map((product) => (
                              <tr key={product.title}>
                                <td className="px-4 py-3 font-semibold">{product.title}</td>
                                <td className="px-4 py-3">{product.quantity.toLocaleString("fa-IR")}</td>
                                <td className="px-4 py-3">{formatPrice(product.revenue)}</td>
                                <td className="px-4 py-3">{formatPrice(product.cost)}</td>
                                <td className="px-4 py-3 font-bold">{formatPrice(product.profit)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="border-y border-dashed border-[#c9c0b9] bg-white px-4 py-6 text-center text-sm text-[#746c67]">در ۳۰ روز اخیر هنوز فروشی ثبت نشده است.</p>
                    )}
                  </section>

                  <div className="mb-8">
                    <h3 className="mb-3 text-lg font-bold">فروش امروز به تفکیک محصول</h3>
                    {salesReport.todayProducts.length ? (
                      <div className="overflow-x-auto border-y border-[#ded8d2] bg-white">
                        <table className="w-full min-w-[650px] text-right text-sm">
                          <thead className="bg-[#ebe6e1] text-xs text-[#5e5651]">
                            <tr><th className="px-4 py-3">محصول</th><th className="px-4 py-3">تعداد فروخته‌شده</th><th className="px-4 py-3">مبلغ فروش</th><th className="px-4 py-3">بهای تمام‌شده</th><th className="px-4 py-3">سود</th></tr>
                          </thead>
                          <tbody className="divide-y divide-[#eee9e4]">
                            {salesReport.todayProducts.map((product) => (
                              <tr key={product.title}>
                                <td className="px-4 py-3 font-semibold">{product.title}</td>
                                <td className="px-4 py-3">{product.quantity.toLocaleString("fa-IR")}</td>
                                <td className="px-4 py-3">{formatPrice(product.revenue)}</td>
                                <td className="px-4 py-3">{formatPrice(product.cost)}</td>
                                <td className="px-4 py-3 font-bold">{formatPrice(product.profit)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="border-y border-dashed border-[#c9c0b9] bg-white px-4 py-8 text-center text-sm text-[#746c67]">امروز هنوز سفارشی تأیید نشده است.</p>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-3 text-lg font-bold">جمع فروش از ابتدای ثبت اطلاعات</h3>
                    {salesReport.allProducts.length ? (
                      <div className="overflow-x-auto border-y border-[#ded8d2] bg-white">
                        <table className="w-full min-w-[550px] text-right text-sm">
                          <thead className="bg-[#ebe6e1] text-xs text-[#5e5651]">
                            <tr><th className="px-4 py-3">محصول</th><th className="px-4 py-3">تعداد</th><th className="px-4 py-3">فروش کل</th><th className="px-4 py-3">سود کل</th></tr>
                          </thead>
                          <tbody className="divide-y divide-[#eee9e4]">
                            {salesReport.allProducts.map((product) => (
                              <tr key={product.title}>
                                <td className="px-4 py-3 font-semibold">{product.title}</td>
                                <td className="px-4 py-3">{product.quantity.toLocaleString("fa-IR")}</td>
                                <td className="px-4 py-3">{formatPrice(product.revenue)}</td>
                                <td className="px-4 py-3 font-bold">{formatPrice(product.profit)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="border-y border-dashed border-[#c9c0b9] bg-white px-4 py-8 text-center text-sm text-[#746c67]">هنوز فروشی ثبت نشده است.</p>
                    )}
                  </div>

                  <section className="mt-10 border-t border-red-200 pt-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-red-900">ریست اطلاعات آزمایشی</h3>
                        <p className="mt-1 text-xs text-[#746c67]">سفارش‌های فعال و گزارش فروش پاک می‌شوند؛ منو و قیمت‌ها باقی می‌مانند.</p>
                      </div>
                      <button type="button" onClick={resetTestData} disabled={resettingData} className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50">
                        {resettingData ? "در حال ریست..." : "ریست سفارش‌ها و فروش"}
                      </button>
                    </div>
                  </section>
                </>
              )}
            </div>
          )}

          {activeTab === "gallery" && (
            <div>
              <div className="mb-6 border-b border-[#d8d1cb] pb-5">
                <p className="text-sm text-[#746c67]">عکس و ویدئوهای کافه در صفحه عمومی گالری نمایش داده می‌شوند.</p>
                <h2 className="mt-2 text-2xl font-bold">مدیریت گالری <span className="text-base font-normal text-[#746c67]">({galleryItems.length.toLocaleString("fa-IR")})</span></h2>
              </div>

              <form onSubmit={uploadGalleryItem} className="mb-8 border-t-2 border-[#a54832] bg-white p-5 shadow-sm sm:p-7">
                <h3 className="mb-5 text-lg font-bold">افزودن عکس یا ویدئو</h3>
                <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <label className="text-sm font-semibold">فایل رسانه
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                      onChange={(event) => setGalleryFile(event.target.files?.[0] || null)}
                      className="mt-2 block w-full text-sm file:ml-3 file:rounded file:border-0 file:bg-[#f0e9e5] file:px-3 file:py-2 file:text-xs file:font-semibold"
                      required
                    />
                    <span className="mt-1 block text-xs font-normal text-[#746c67]">JPG، PNG، WEBP، GIF، MP4 یا WEBM · حداکثر ۱۰۰ مگابایت</span>
                  </label>
                  <label className="text-sm font-semibold">کپشن
                    <input maxLength={300} value={galleryCaption} onChange={(event) => setGalleryCaption(event.target.value)} placeholder="یک لحظه از حال‌وهوای کافه..." className="mt-2 w-full rounded-md border border-[#d8d1cb] bg-[#faf9f7] px-3 py-2.5 font-normal outline-none focus:border-[#a54832]" />
                  </label>
                  <button disabled={uploadingGallery} className="rounded-md bg-[#a54832] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#873b2b] disabled:opacity-50">
                    {uploadingGallery ? "در حال بارگذاری..." : "انتشار در گالری"}
                  </button>
                </div>
                {galleryFile && <p className="mt-3 text-xs text-[#746c67]">فایل انتخاب‌شده: {galleryFile.name}</p>}
              </form>

              {galleryItems.length === 0 ? (
                <p className="border border-dashed border-[#c9c0b9] px-5 py-12 text-center text-sm text-[#746c67]">گالری هنوز خالی است.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {galleryItems.map((item) => (
                    <article key={item.id} className="overflow-hidden border border-[#ded8d2] bg-white">
                      {item.type === "video" ? (
                        <video src={item.url} controls playsInline preload="metadata" className="h-52 w-full bg-black object-contain" />
                      ) : (
                        <img src={item.url} alt={item.caption || ""} className="h-52 w-full bg-[#eee9e4] object-cover" />
                      )}
                      <p className="min-h-12 px-3 py-2 text-sm text-[#5e5651]">{item.caption || "بدون کپشن"}</p>
                      <div className="flex gap-2 border-t border-[#eee9e4] p-3">
                        <button type="button" onClick={() => editGalleryCaption(item)} className="rounded border border-[#d8d1cb] px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f0ec]">ویرایش کپشن</button>
                        <button type="button" onClick={() => deleteGalleryItem(item)} className="rounded border border-[#c87d70]/50 px-3 py-1.5 text-xs font-semibold text-[#963e32] hover:bg-red-50">حذف رسانه</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <footer className="border-t border-black/10 px-5 py-6 text-center text-xs text-[#746c67]">
        طراحی و توسعه توسط{" "}
        <a
          href="https://hiradcode.ir"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#8b3a2b] underline underline-offset-4 hover:text-[#262321]"
        >
          هیراد کد
        </a>
      </footer>
    </main>
  );
}
