import { useEffect, useState } from "react";
import { menuItems } from "./menuItems";
import warmImage from "./warm.webp";
import ColdImage from "./cold.webp";
import foodImage from "./food.webp";
// import brackfastImage from "./brackfast.webp";

import abadCGImage from "./abadCG.webp";
import abadCGHImage from "./abadCGH.jpg";


const categories = [
  {
    id: "hot",
    title: "نوشیدنی گرم",
    category: "نوشیدنی گرم",
    image: warmImage
  },
  {
    id: "cold",
    title: "نوشیدنی سرد",
    category: "نوشیدنی سرد",
    image: ColdImage
  },
  {
    id: "food",
    title: "غذا",
    category: "غذا",
    image: foodImage
  },
  {
    id: "breakfast",
    title: "صبحانه",
    category: "صبحانه",
    image: foodImage
  },
];

const fallbackItemImage =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="188" height="180" viewBox="0 0 188 180"><rect width="188" height="180" fill="#2a171c"/><path d="M104 66c-20-10-40 10-33 30 5 16 24 20 33 6" fill="none" stroke="#d31e3a" stroke-width="7" stroke-linecap="round"/></svg>`
  );

function formatPrice(price) {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice)) {
    return price;
  }

  return numericPrice.toLocaleString("fa-IR");
}

export default function Menu() {
  const [catalogItems, setCatalogItems] = useState(menuItems);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [table, setTable] = useState("");
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const loadCatalog = async () => {
      try {
        const response = await fetch("/api/menu-items");
        if (!response.ok) return;
        const items = await response.json();
        if (active && Array.isArray(items)) setCatalogItems(items);
      } catch {
        // Keep the bundled menu available when the ordering API is offline.
      }
    };
    loadCatalog();
    const refresh = window.setInterval(loadCatalog, 30000);
    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, []);

  const scrollToCategory = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const addToCart = (item, category) => {
    const id = `${category.id}-${item.title}`;
    setCart((current) => {
      const existing = current.find((entry) => entry.id === id);
      if (existing) {
        return current.map((entry) => entry.id === id ? { ...entry, quantity: entry.quantity + 1 } : entry);
      }
      return [...current, { id, title: item.title, price: Number(item.price), quantity: 1 }];
    });
    setOrderSuccess(false);
    setOrderError("");
  };

  const changeQuantity = (id, difference) => {
    setCart((current) => current
      .map((entry) => entry.id === id ? { ...entry, quantity: entry.quantity + difference } : entry)
      .filter((entry) => entry.quantity > 0));
  };

  const submitOrder = async () => {
    if (!table || cart.length === 0) {
      setOrderError("شماره میز را انتخاب کنید و سفارش را کامل کنید.");
      return;
    }
    setSubmitting(true);
    setOrderError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, items: cart.map(({ title, price, quantity }) => ({ title, price, quantity })) }),
      });
      const responseText = await response.text();
      let result;
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error("سرور سفارش پاسخ معتبری نداد؛ سرور برنامه را دوباره اجرا کنید.");
      }
      if (!response.ok) throw new Error(result.error || "ثبت سفارش انجام نشد.");
      setCart([]);
      setCartOpen(false);
      setOrderSuccess(true);
      setTable("");
    } catch (error) {
      setOrderError(error.message || "ارتباط با سرور برقرار نشد.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main dir="rtl" className="abad-dark">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lalezar&family=Vazirmatn:wght@300;400;500;600;700;800&display=swap');

        .abad-dark {
          --blood: #a20d24;
          --blood-light: #d31e3a;
          --black: #100b0d;
          --panel: #181114;
          --cream: #f4e8e8;
          --muted: #b4a0a5;
          --gold: #c9a17a;

          min-height: 100vh;
          overflow: hidden;
          color: var(--cream);

          background:
            radial-gradient(
              ellipse at 8% 8%,
              #6c071c 0%,
              transparent 35%
            ),
            radial-gradient(
              ellipse at 95% 50%,
              #390914 0%,
              transparent 35%
            ),
            #100b0d;

          font-family: 'Vazirmatn', Tahoma, sans-serif;
        }

        .abad-about-section {
          background:
            radial-gradient(ellipse at 12% 88%, #6c071c 0%, transparent 46%),
            radial-gradient(ellipse at 92% 25%, #390914 0%, transparent 38%),
            #100b0d;
        }

        .abad-footer-section {
          background:
            radial-gradient(ellipse at 50% 100%, #6c071c 0%, transparent 62%),
            radial-gradient(ellipse at 8% 0%, #390914 0%, transparent 44%),
            #100b0d;
        }

        .abad-menu-section {
          isolation: isolate;
        }

        .abad-menu-section::before {
          content: "";
          position: absolute;
          z-index: -1;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 100vw;
          transform: translateX(-50%);
          pointer-events: none;
          background:
            radial-gradient(ellipse at 12% 24%, #6c071c 0%, transparent 40%),
            radial-gradient(ellipse at 88% 60%, #390914 0%, transparent 38%),
            radial-gradient(ellipse at 24% 91%, #5a0a1b 0%, transparent 42%),
            linear-gradient(180deg, #100b0d 0%, #16090d 52%, #100b0d 100%);
        }

        .abad-heading {
          font-family: 'Lalezar', 'Vazirmatn', Tahoma, sans-serif;
          font-weight: 400;
          letter-spacing: .01em;
        }

        .abad-grain {
          background-image:
            radial-gradient(#ffffff12 .7px, transparent .7px);
          background-size: 5px 5px;
          pointer-events: none;
        }

        .abad-hero {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          min-height: 650px;
          display: flex;
          align-items: center;
          background: #24070e;
        }

        .abad-hero-bg {
          position: absolute;
          z-index: -2;
          inset: 0;
          background-image:
            linear-gradient(
              90deg,
              #16090de8 0%,
              #310911b8 48%,
              #16090d80 100%
            ),
            var(--hero-image);
          background-size: cover;
          background-position: center;
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 34%, #000 66%, transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0%, #000 34%, #000 66%, transparent 100%);
          animation: abad-hero-zoom 22s ease-in-out infinite alternate;
        }

        .abad-hero::after {
          content: "";
          position: absolute;
          z-index: -1;
          inset: 0;
          background:
            linear-gradient(
              0deg,
              #100b0d 0%,
              transparent 30%,
              #17070c55 100%
            );
        }

        @keyframes abad-hero-zoom {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.08);
          }
        }

        @keyframes abad-reveal {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .abad-reveal {
          animation: abad-reveal .8s cubic-bezier(.2,.7,.2,1) both;
        }

        .abad-category {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 13px;
          padding: 8px;
          color: #d8c8cb;
          transition:
            transform .35s ease,
            color .35s ease;
        }

        .abad-category:hover {
          transform: translateY(-8px);
          color: white;
        }

        .abad-category-image {
          position: relative;
          display: block;
          width: clamp(76px, 14vw, 158px);
          aspect-ratio: 1;
          padding: 5px;
          border-radius: 50%;
          background:
            linear-gradient(
              145deg,
              #e54b60,
              #510817 52%,
              #1a1013
            );
          box-shadow:
            0 12px 25px #0008,
            0 0 0 1px #f1c2c225;
          transition:
            box-shadow .35s ease,
            transform .35s ease;
        }

        .abad-category-image img {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          filter: brightness(.78) saturate(.8);
          transition:
            filter .35s ease,
            transform .5s ease;
        }

        .abad-category:hover .abad-category-image {
          box-shadow:
            0 0 0 2px #ed5269,
            0 0 32px #c5163745,
            0 18px 40px #000b;
        }

        .abad-category:hover img {
          filter: brightness(1) saturate(1.05);
          transform: scale(.96);
        }

        .abad-category:focus-visible {
          outline: 2px solid #ed5269;
          outline-offset: 5px;
          border-radius: 20px;
        }

        .abad-product {
          position: relative;
          display: grid;
          grid-template-columns: 94px minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 17px;
          min-height: 116px;
          padding: 13px;
          overflow: hidden;
          border: 1px solid #ffffff0a;
          border-radius: 24px;
          background:
            linear-gradient(
              120deg,
              #201518,
              #151012 70%
            );
          box-shadow:
            0 12px 24px #0004,
            0 2px 0 #ffffff04 inset;
          transition:
            transform .3s ease,
            border-color .3s ease,
            box-shadow .3s ease,
            background .3s ease;
          animation: abad-reveal .55s ease both;
        }

        .abad-product::before {
          content: "";
          position: absolute;
          top: 18%;
          right: 0;
          width: 3px;
          height: 64%;
          border-radius: 8px 0 0 8px;
          background: #d31e3a;
          opacity: 0;
          transform: scaleY(.3);
          transition:
            opacity .3s ease,
            transform .3s ease;
        }

        .abad-product:hover {
          transform: translateY(-4px) scale(1.008);
          border-color: #a51c35aa;
          background:
            linear-gradient(
              120deg,
              #29161b,
              #171012 75%
            );
          box-shadow:
            0 20px 45px #0009,
            0 0 25px #a20d241c;
        }

        .abad-product:hover::before {
          opacity: 1;
          transform: scaleY(1);
        }

        .abad-product-image {
          width: 94px;
          height: 90px;
          overflow: hidden;
          border-radius: 18px;
          background: #2a171c;
          box-shadow: 0 7px 16px #0007;
        }

        .abad-product-image img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition:
            transform .55s ease,
            filter .35s ease;
          filter: brightness(.82) saturate(.85);
        }

        .abad-product:hover .abad-product-image img {
          transform: scale(1.1);
          filter: brightness(1) saturate(1);
        }

        .abad-product-title {
          color: #f8edef;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.9;
          transition: color .25s ease;
        }

        .abad-product:hover .abad-product-title {
          color: #ffb7c3;
        }

        .abad-product-desc {
          margin-top: 4px;
          color: #aa969c;
          font-size: 11px;
          line-height: 1.9;
        }

        .abad-price {
          align-self: center;
          white-space: nowrap;
          text-align: left;
          padding-left: 5px;
        }

        .abad-price-number {
          color: #f0b5bd;
          font-size: 14px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }

        .abad-price-unit {
          display: block;
          margin-top: 3px;
          color: #917b82;
          font-size: 10px;
        }

        .abad-add-order {
          min-height: 38px;
          padding: 0 11px;
          border: 1px solid #a72b43;
          border-radius: 12px;
          background: #a20d2430;
          color: #ffdbe1;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          transition: background .2s ease, transform .2s ease;
        }

        .abad-add-order:hover {
          transform: translateY(-1px);
          background: #a20d24;
        }

        .abad-section-title {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .abad-section-title::before,
        .abad-section-title::after {
          content: "";
          height: 1px;
          flex: 1;
          background:
            linear-gradient(
              90deg,
              transparent,
              #85203699
            );
        }

        .abad-section-title::after {
          background:
            linear-gradient(
              90deg,
              #85203699,
              transparent
            );
        }

        .abad-scroll {
          scroll-margin-top: 24px;
        }

        .abad-about-image {
          width: 100%;
          aspect-ratio: 4 / 5;
          object-fit: cover;
          border-radius: 20px;
          transition: transform .7s ease;
        }

        .abad-about-frame:hover .abad-about-image {
          transform: scale(1.025);
        }

        @media (max-width: 560px) {
          .abad-hero {
            min-height: 560px;
          }

          .abad-product {
            grid-template-columns: 58px minmax(0, 1fr) auto auto;
            gap: 8px;
            min-height: 96px;
            padding: 8px;
            border-radius: 16px;
          }

          .abad-product-image {
            width: 58px;
            height: 58px;
            border-radius: 12px;
          }

          .abad-product-title {
            font-size: 13px;
          }

          .abad-product-desc {
            font-size: 10px;
          }

          .abad-price-number {
            font-size: 12px;
          }

          .abad-price-unit {
            font-size: 9px;
          }

          .abad-add-order {
            min-height: 34px;
            padding: 0 7px;
            border-radius: 10px;
            font-size: 10px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .abad-dark *,
          .abad-dark *::before,
          .abad-dark *::after {
            animation-duration: .01ms !important;
            transition-duration: .01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <div className="abad-grain pointer-events-none fixed inset-0 z-30 opacity-[.12]" />

      {/* Header */}
      <header className="relative z-20 border-b border-white/10 bg-[#100b0de8] text-[#f4e8e8] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 md:px-10">
          <a href="#home" className="flex items-center gap-3">
            <span className="abad-heading text-3xl text-white md:text-4xl">
           کافه<span>{" "}</span><span className="text-[#cf263f]">{ }ابد</span>
            </span>

            <span className="hidden border-r border-white/15 pr-3 text-[10px] leading-5 text-[#bda9ae] sm:block">
              کافه گالری
              <br />
              هنر و قهوه
            </span>
          </a>

          <a href="/gallery" className="rounded-full border border-[#9c243b] px-4 py-2 text-xs font-semibold text-[#f0dfe3] transition hover:bg-[#a20d24] hover:text-white sm:text-sm">
            گالری کافه
          </a>

          {/* <nav className="flex items-center gap-4 text-xs text-[#d4c3c7] sm:gap-7 sm:text-sm">
            <a
              href="#home"
              className="transition hover:text-[#ef6b7e]"
            >
              خانه
            </a>

            <a
              href="#menu"
              className="transition hover:text-[#ef6b7e]"
            >
              منو
            </a>

            <a
              href="#about"
              className="transition hover:text-[#ef6b7e]"
            >
              درباره ابد
            </a>
          </nav>

          <a
            href="#menu"
            className="rounded-full border border-[#9c243b] bg-[#83152a]/30 px-3 py-2 text-[10px] text-white shadow-[0_0_22px_#a20d2425] transition hover:bg-[#a20d24] sm:px-5 sm:text-xs"
          >
            کشف منو ↙
          </a> */}
        </div>
      </header>

      {/* Hero */}
      <section  style={{ "--hero-image": `url(${abadCGHImage})` }} id="home" className="abad-hero">
        <div className="abad-hero-bg" />
        <div className="abad-grain absolute inset-0 z-[-1] opacity-20" />

        <div className="abad-reveal relative mx-auto w-full max-w-7xl px-6 py-20 md:px-12 md:py-28">
          <p className="max-w-2xl text-sm leading-9 text-[#f0dfe3] sm:text-base sm:leading-10 flex justify-center">
            آنْچِه ما دَر زَندِگى اَنجام مى‌دَهيمْ، دَر اَبَديَّت بازتاب پیدا میکند
          </p>
          <span className="h-16 flex"></span>
          {/* <div className="mb-7 flex items-center gap-3 text-xs tracking-[.12em] text-[#ed8795] sm:text-sm">
            <span className="h-px w-9 bg-[#cf263f]" />
            گرگان · abadCG
          </div> */}

          <h1 style={{"align-items":"baseline"}} className="flex abad-heading max-w-4xl text-6xl leading-[1.35] text-white sm:text-7xl md:text-8xl">کافه <span className="mt-2 block text-[#d7354f] drop-shadow-[0_0_35px_#b20b2a55]">اَبَد</span></h1>

          <div className="my-7 h-px w-24 bg-gradient-to-l from-[#e34a60] to-transparent" />


          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#menu"
              className="inline-flex items-center gap-4 rounded-full border border-[#c72a43] bg-[#9f1028] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_35px_#b20b2a45] transition duration-300 hover:-translate-y-1 hover:bg-[#c21c38] hover:shadow-[0_14px_45px_#d31e3a55]"
            >
               منوی ابد <span aria-hidden="true">←</span>
            </a>

            <span className="text-xs text-[#e1cbd0]">
              قهوه، هنر، خاطره
            </span>
          </div>

          <div className="mt-14 flex items-center gap-3 text-[10px] tracking-[.22em] text-[#bca6ac]">
            <span className="h-px w-10 bg-[#8c2639]" />
            COFFEE · ART · ETERNITY
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-20 left-[8%] h-64 w-64 rounded-full bg-[#a20d24]/15 blur-[100px]" />

        <div className="absolute bottom-0 left-0 right-0 h-px bg-[#c72a43]/70" />
      </section>

      {/* Menu */}
      <section
        id="menu"
        className="abad-menu-section relative mx-auto max-w-7xl px-5 pb-16 pt-16 md:px-10 md:pb-24 md:pt-20"
      >
        <div className="mb-5 text-center text-[10px] tracking-[.32em] text-[#d34b60]">
          THE ABAD COLLECTION
        </div>

        <h2 className="abad-heading text-center text-4xl text-white sm:text-5xl md:text-6xl">
          منوی <span className="text-[#c9223d]">ابد</span>
        </h2>

        {/* <p className="mt-3 text-center text-xs text-[#a9949a] sm:text-sm">
          چیزی برای کشف کردن، چیزی برای به خاطر سپردن
        </p> */}

        {/* Circular category shortcuts */}
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-4 gap-2 sm:mt-16 sm:gap-6">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => scrollToCategory(category.id)}
              aria-label={`رفتن به بخش ${category.title}`}
              className="abad-category"
            >
              <span className="abad-category-image">
                <img
                  src={category.image}
                  alt={category.title}
                  loading="lazy"
                />
              </span>

              <span className="text-center text-[10px] font-semibold sm:text-sm">
                {category.title}
              </span>
            </button>
          ))}
        </div>

        {/* All categories stay visible on the page */}
        <div className="mt-16 space-y-16 sm:mt-20 sm:space-y-24">
          {categories.map((category, index) => {
            const items = catalogItems.filter(
              (item) => item.category === category.category
            );

            return (
              <section
                key={category.id}
                id={category.id}
                className="abad-scroll"
              >
                <div className="abad-section-title mb-8">
                  <div className="text-center">
                    <p className="mb-2 text-[10px] tracking-[.25em] text-[#c64a60]">
                      ABAD COLLECTION · {index + 1}
                    </p>

                    <h3 className="abad-heading text-3xl text-white sm:text-4xl">
                      {category.title}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  {items.map((item, itemIndex) => (
                    <article
                      key={item.id || `${category.id}-${item.title}-${itemIndex}`}
                      className="abad-product"
                      style={{
                        animationDelay: `${Math.min(itemIndex * 35, 300)}ms`,
                      }}
                    >
                      {/* Product image: right side in RTL */}
                      <div className="abad-product-image">
                        <img
                          src={item.image || fallbackItemImage}
                          onError={(event) => {
                            if (event.currentTarget.src !== fallbackItemImage) {
                              event.currentTarget.src = fallbackItemImage;
                            }
                          }}
                          alt={item.title}
                          loading="lazy"
                        />
                      </div>

                      {/* Product name and description */}
                      <div className="min-w-0">
                        <h4 className="abad-product-title">
                          {item.title}
                        </h4>

                        {item.desc && (
                          <p className="abad-product-desc">
                            {item.desc}
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      <div className="abad-price">
                        <span className="abad-price-number">
                          {formatPrice(item.price)}
                        </span>

                        <span className="abad-price-unit">
                          تومان
                        </span>
                      </div>

                      {/* <button
                        type="button"
                        className="abad-add-order"
                        onClick={() => addToCart(item, category)}
                        aria-label={`افزودن ${item.title} به سفارش`}
                      >
                        افزودن +
                      </button> */}
                    </article>
                  ))}

                  {items.length === 0 && (
                    <p className="col-span-full rounded-2xl border border-dashed border-[#662034] p-6 text-center text-sm text-[#b4a0a5]">
                      محصولات این بخش هنوز اضافه نشده‌اند.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-12 flex items-center justify-center gap-3 text-[10px] text-[#80636b]">
          <span className="h-px w-8 bg-[#5b1a2a]" />
          قیمت‌ها به تومان هستند
          <span className="h-px w-8 bg-[#5b1a2a]" />
        </div>
      </section>

      {/* About Abad */}
      <section
        id="about"
        className="abad-about-section relative overflow-hidden border-t border-[#86203955] text-[#f4e8e8]"
      >
        <div className="abad-grain absolute inset-0 opacity-10" />

        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="mb-12 text-center">
            <p className="mb-3 text-[10px] tracking-[.3em] text-[#c64a60]">
              THE STORY OF ABAD
            </p>

            <h2 className="abad-heading text-4xl sm:text-5xl md:text-6xl">
              درباره <span className="text-[#d7354f]">ابد</span>
            </h2>

            <p className="mt-4 text-xs text-[#a9949a] sm:text-sm">
              روایتی میان خاطره، هنر و ابدیت
            </p>
          </div>

          <div className="grid items-start gap-10 md:grid-cols-[.9fr_1.1fr] md:gap-14">
            {/* About image */}
            <div className="abad-about-frame group relative mx-auto w-full max-w-lg">
              <div className="absolute -inset-3 rounded-[32px] bg-[#a20d24]/15 blur-2xl transition duration-500 group-hover:bg-[#a20d24]/25" />

              <div className="relative overflow-hidden rounded-[28px] border border-[#a72b43]/50 bg-[#1a1013] p-3 shadow-[0_25px_70px_#000a,0_0_35px_#a20d2415]">
                <img
                  src={abadCGImage}
                  alt="فضای هنری کافه گالری ابد"
                  className="abad-about-image"
                  loading="lazy"
                />

                <div className="absolute bottom-6 right-6 left-6 rounded-2xl border border-white/10 bg-[#100b0de8] p-4 shadow-2xl backdrop-blur-md">
                  <p className="text-[10px] tracking-[.2em] text-[#d7354f]">
                    ABAD · GALLERY CAFE
                  </p>

                  <p className="abad-heading mt-1 text-2xl text-white">
                    لحظه‌ای که ابدی می‌شود
                  </p>
                </div>
              </div>
            </div>

            {/* Full about text */}
            <div className="space-y-6 text-sm leading-9 text-[#d3c0c6] sm:text-base sm:leading-10">
              {/* <p>
                در دل خیابان‌های کهن گرگان، جایی میان خاطرات یک خانه‌ی قدیمی
                و رؤیای یک گالری، «ابد» متولد شد؛ مکانی که زمان، آرام در آن
                رنگ می‌بازد و هر جرعه‌ قهوه، سفری‌ست به عمق روح.
              </p>

              <p>
                اینجا هنر در هوا جاری‌ست؛ موسیقی از دل دیوارهای سپید و
                پنجره‌هایی که رو به میدان گشوده‌اند می‌گذرد، و نگاهت در
                رفت‌وآمد زندگی، آرام گره می‌خورد. جایی که دوای دلتنگی‌ات
                را در فنجانی سرخ می‌نوشی و غم‌های گذرا را میان دست‌سازه‌ها
                جا می‌گذاری؛ آثاری که با دست و دل خلق شده‌اند تا قصه بگویند،
                بی‌آن‌که کلامی بگویند.
              </p> */}

              <p>
                «ابد» بیش از یک کافه است؛ روایت پیوند دیروز و امروز، گالری‌ای
                زنده از نگاه‌ها، لبخندها و مکث‌هایی که شاید کوتاه باشند،
                اما در دل، بلند و ابدی‌اند.
              </p>

              <blockquote className="my-8 rounded-2xl border-r-2 border-[#d7354f] bg-[#1a1013] px-5 py-5 text-[#f1c4cc] shadow-[0_15px_35px_#0005] sm:px-7">
                فرق ازل و ابد در آن است که ازل را آغازی نیست و ابد را پایانی
                نیست… و ما، در «ابد»، گرد هم می‌آییم؛ تا در بی‌کرانگی هنر و
                دوستی، لحظه‌ای بایستیم… لحظه‌ای که هرچند کوتاه است، اما
                شاید، ابدی شود.
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="contact"
        className="abad-footer-section relative overflow-hidden border-t border-[#86203955] text-[#f4e8e8]"
      >
        <div className="pointer-events-none absolute -top-32 left-1/2 h-60 w-96 -translate-x-1/2 rounded-full bg-[#8f1029]/20 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-12 text-center sm:py-16">
          <p className="mb-3 text-[10px] tracking-[.3em] text-[#c64a60]">
            COFFEE · ART · ETERNITY
          </p>

          <h2 className="abad-heading text-4xl text-white sm:text-5xl">
            کافه گالری ابد
          </h2>

          <p className="mx-auto mt-5 max-w-lg text-xs leading-8 text-[#a9949a] sm:text-sm">
            آنْچِه ما دَر زَندِگى اَنجام مى‌دَهيمْ، دَر اَبَديَّت بازتاب پیدا میکند
          </p>

          <div className="mx-auto mt-9 h-px max-w-xs bg-gradient-to-r from-transparent via-[#812037] to-transparent" />

          <a
            href="#home"
            className="mt-7 inline-block text-xs text-[#d77688] transition hover:text-white"
          >
            بازگشت به بالا ↑
          </a>

          <p className="mt-7 text-[10px] text-[#70565e]">
            کافه گالری ابد · گرگان
          </p>

          <p className="mt-5 text-xs text-[#d9a5af]">
            طراحی و توسعه توسط{" "}
            <a
              href="https://hiradcode.ir"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#ffd1d8] underline underline-offset-4 transition hover:text-white"
            >
              هیراد کد
            </a>
          </p>
        </div>
      </footer>

      {cart.length > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 left-5 z-40 rounded-full border border-[#ffb0bd]/30 bg-[#a20d24] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_35px_#0009]"
        >
          سبد سفارش · {cart.reduce((sum, entry) => sum + entry.quantity, 0).toLocaleString("fa-IR")}
        </button>
      )}

      {orderSuccess && (
        <div role="status" className="fixed bottom-5 right-5 z-40 rounded-lg border border-emerald-300/20 bg-[#153a2c] px-5 py-3 text-sm text-white shadow-xl">
          سفارش شما برای میز ثبت شد.
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-5" onClick={() => setCartOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-cart-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-white/10 bg-[#171012] p-5 text-[#f4e8e8] shadow-2xl sm:rounded-2xl sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-[10px] tracking-[.2em] text-[#d34b60]">YOUR ORDER</p>
                <h2 id="order-cart-title" className="abad-heading mt-1 text-3xl">سفارش شما</h2>
              </div>
              <button type="button" onClick={() => setCartOpen(false)} aria-label="بستن سبد" className="h-10 w-10 rounded-full border border-white/15 text-xl text-white hover:bg-white/10">×</button>
            </div>

            <ul className="mt-4 divide-y divide-white/10">
              {cart.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{entry.title}</p>
                    <p className="mt-1 text-xs text-[#b4a0a5]">{formatPrice(entry.price * entry.quantity)} تومان</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" onClick={() => changeQuantity(entry.id, -1)} aria-label={`کم‌کردن ${entry.title}`} className="h-8 w-8 rounded border border-white/20">−</button>
                    <span className="min-w-5 text-center text-sm">{entry.quantity.toLocaleString("fa-IR")}</span>
                    <button type="button" onClick={() => changeQuantity(entry.id, 1)} aria-label={`زیادکردن ${entry.title}`} className="h-8 w-8 rounded border border-white/20">+</button>
                  </div>
                </li>
              ))}
            </ul>

            <label htmlFor="order-table" className="mt-5 block text-sm font-semibold">شماره میز</label>
            <select
              id="order-table"
              value={table}
              onChange={(event) => setTable(event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/15 bg-[#211619] px-3 py-3 text-white outline-none focus:border-[#d34b60]"
            >
              <option value="">انتخاب شماره میز</option>
              {Array.from({ length: 20 }, (_, index) => index + 1).map((number) => (
                <option key={number} value={String(number)}>میز {number.toLocaleString("fa-IR")}</option>
              ))}
            </select>

            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 font-bold">
              <span>جمع کل</span>
              <span>{formatPrice(cart.reduce((sum, entry) => sum + entry.price * entry.quantity, 0))} تومان</span>
            </div>
            {orderError && <p role="alert" className="mt-3 text-sm text-[#ff9ca9]">{orderError}</p>}
            <button
              type="button"
              onClick={submitOrder}
              disabled={submitting || cart.length === 0}
              className="mt-5 w-full rounded-lg bg-[#a20d24] px-4 py-3 font-bold text-white transition hover:bg-[#c21b36] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "در حال ثبت سفارش..." : "ثبت سفارش"}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
