import React from "react";
import numeral from "numeral";

const menuItems = [
  // سرد
  {
    category: "نوشیدنی سرد",
    title: "آیس لاته آمریکانو",
    name: "",
    price: "65000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "آیس لاته",
    name: "",
    price: "100000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "آیس لاته طعم داره",
    name: "سیروب شکلات + کارامل + وانیل + فندق",
    price: "115000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "آفاگاتو",
    name: "",
    price: "110000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "شیک شکلات",
    name: "",
    price: "135000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "شیک سوداد",
    name: "اسپرسو + بیسکوییت مادر + سیروب فندق + بستنی",
    price: "180000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "شیک اورء<",
    name: "",
    price: "170000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "لیموناد",
    name: "",
    price: "110000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "موهیتو",
    name: "",
    price: "120000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "دوای غم های گذرا",
    name: "سیروب رز + پنیرک + تخم شربتی +سودار + لیمو",

    price: "120000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "دوای دلتنگی",
    name: "سیروب لوندر + آلوئه ورا + آب سیب + بهار نارنج",
    price: "100000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "پا تختی",
    name: "سیروب پرتقال ورز + تخم شربتی +سودا + شیرینی زبان",
    price: "80000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "شوق دیدار",
    name: "سیروب وانیل + لیمو + آل لیمو+ بلوبلری",
    price: "130000",
    image: "/imgs/album.webp",
  },
  //   گرم
  {
    category: "نوشیدنی گرم",
    title: "چای",
    name: "",
    price: "55000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "اسپرسو",
    name: "",
    price: "60000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "آمریکانو",
    name: "",
    price: "65000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "لاته",
    name: "",
    price: "100000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "لاته طعم دار",
    name: "سیروب شکلات + کارامل + وانیل + فندق",
    price: "115000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "کاپوچینو کلاسیک",
    name: "",
    price: "950000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "کاپوچینو پرمیوم",
    name: "",
    price: "85000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "هات چاکلت",
    name: "",
    price: "95000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "وایت چاکلت",
    name: "",
    price: "80000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "چاکلت لاوا",
    name: "",
    price: "110000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "چای ماسالا",
    name: "",
    price: "100000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "چای کرک",
    name: "",
    price: "90000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "درتی بیسکوییت",
    name: "",
    price: "115000",
    image: "/imgs/album.webp",
  },
  //   غذا
  {
    category: "غذا",
    title: "نیمرو",
    name: "",
    price: "90000",
    image: "/imgs/album.webp",
  },
  {
    category: "غذا",
    title: "املت",
    name: "",
    price: "95000",
    image: "/imgs/album.webp",
  },
  {
    category: "غذا",
    title: "سیب زمینی ساده",
    name: "",
    price: "140000",
    image: "/imgs/album.webp",
  },
  {
    category: "غذا",
    title: "سیب زمینی با سس قارچی",
    name: "",
    price: "165000",
    image: "/imgs/album.webp",
  },
  {
    category: "غذا",
    title: "پنینی مرغ",
    name: "",
    price: "185000",
    image: "/imgs/album.webp",
  },
];

export default function Menu() {
  return (
    <div className="flex flex-col items-center bg-[#8B0000] min-h-screen p-4 font-vazir text-white">
      <h1 className="text-4xl text-orange-300 font-extrabold mb-2">کافه ابد</h1>
      <h2 className="text-xl text-orange-300 mb-6">منو</h2>

      {/* navigation بالا */}
      <div className="flex mb-6 w-full justify-evenly">
        <a
          href="#hot"
          className="px-3 py-1 bg-[#f9f2e9] text-[#8B0000] rounded-full text-sm w-1/4 text-center items-center justify-center flex"
        >
          نوشیدنی گرم
        </a>
        <a
          href="#cold"
          className="px-3 py-1 bg-[#f9f2e9] text-[#8B0000] rounded-full text-sm w-1/4 text-center items-center justify-center flex"
        >
          نوشیدنی سرد
        </a>
        <a
          href="#food"
          className="px-3 py-1 bg-[#f9f2e9] text-[#8B0000] rounded-full text-sm w-1/4 text-center items-center justify-center flex"
        >
          غذا
        </a>
      </div>

      {/* سکشن نوشیدنی گرم */}
      <h2 id="hot" className="text-lg font-bold text-orange-200 mb-2">
        نوشیدنی گرم
      </h2>
      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-6">
        {menuItems
          .filter((item) => item.category === "نوشیدنی گرم")
          .map((item, index) => (
            <div
              key={index}
              className="bg-[#661212] text-[#f9f2e9] rounded-xl flex flex-col items-center p-3 justify-between min-h-36"
            >
              <h3 className="text-sm font-semibold mb-2">{item.title}</h3>
              <img
                src={item.image}
                alt={item.name}
                className="hidden h-20 object-contain mb-2 w-auto"
              />

              {item.name ? (
                <div className="bg-[#7a2b2b] text-[11px] px-2 py-1 rounded-md mb-2 text-center leading-relaxed shadow-inner border border-[#8a3a3a] w-full">
                  {item.name}
                </div>
              ) : (
                <p className="h-16 flex items-center">
                  <img src="/imgs/warm.png" alt="cup coffee" className="w-10" />
                </p>
              )}

              <span className="font-bold">
                {numeral(item.price).format("0,0")} تومان
              </span>
            </div>
          ))}
      </div>

      {/* سکشن نوشیدنی سرد */}
      <h2 id="cold" className="text-lg font-bold text-orange-200 mb-2">
        نوشیدنی سرد
      </h2>
      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-6">
        {menuItems
          .filter((item) => item.category === "نوشیدنی سرد")
          .map((item, index) => (
            <div
              key={index}
              className="bg-[#661212] text-[#f9f2e9] rounded-xl flex flex-col items-center p-3 justify-between min-h-36"
            >
              <h3 className="text-sm font-semibold mb-2">{item.title}</h3>
              <img
                src={item.image}
                alt={item.name}
                className="hidden h-20 object-contain mb-2 w-auto"
              />

              {item.name ? (
                <div className="bg-[#7a2b2b] text-[11px] px-2 py-1 rounded-md mb-2 text-center leading-relaxed shadow-inner border border-[#8a3a3a] w-full">
                  {item.name}
                </div>
              ) : (
                <p className="h-16 flex items-center">
                  <img src="/imgs/cold.png" alt="lomonad" className="w-10" />
                </p>
              )}

              <span className="font-bold">
                {numeral(item.price).format("0,0")} تومان
              </span>
            </div>
          ))}
      </div>

      {/* سکشن غذا */}
      <h2 id="food" className="text-lg font-bold text-orange-200 mb-2">
        غذا
      </h2>
      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-6">
        {menuItems
          .filter((item) => item.category === "غذا")
          .map((item, index) => (
            <div
              key={index}
              className="bg-[#661212] text-[#f9f2e9] rounded-xl flex flex-col items-center p-3 justify-between min-h-36"
            >
              <h3 className="text-sm font-semibold mb-2">{item.title}</h3>
              <img
                src={item.image}
                alt={item.name}
                className="hidden h-20 object-contain mb-2 w-auto"
              />

              {item.name ? (
                <div className="bg-[#7a2b2b] text-[11px] px-2 py-1 rounded-md mb-2 text-center leading-relaxed shadow-inner border border-[#8a3a3a] w-full">
                  {item.name}
                </div>
              ) : (
                <p className="h-16 flex items-center">
                  <img src="/imgs/food.png" alt="food" className="w-10" />
                </p>
              )}

              <span className="font-bold">
                {numeral(item.price).format("0,0")} تومان
              </span>
            </div>
          ))}
      </div>
      <footer className="bg-[#8B0000] border-t border-[#FFD700]/40 text-[#FFDAB9] text-justify leading-loose px-6 py-8 mt-8 font-vazir">
        <div className="max-w-4xl mx-auto">
          {/* می‌تونی اینجا یه لوگوی کوچک بگذاری */}
          <div className="flex justify-center mb-4">
            <img
              src="/imgs/abadCG.webp"
              alt="ابد"
              className="w-40 h-40 rounded-xl border border-[#FFD700]/50 shadow-md"
            />
          </div>
          <p className="mb-4 drop-shadow-sm">
            در دل خیابان‌های کهن گرگان، جایی میان خاطرات یک خانه‌ی قدیمی و رؤیای
            یک گالری، «ابد» متولد شد؛ مکانی که زمان، آرام در آن رنگ می‌بازد و هر
            جرعه‌ قهوه، سفری‌ست به عمق روح.
          </p>
          <p className="mb-4 drop-shadow-sm">
            اینجا هنر در هوا جاری‌ست؛ موسیقی از دل دیوارهای سپید و پنجره‌هایی که
            رو به میدان گشوده‌اند می‌گذرد، و نگاهت در رفت‌وآمد زندگی، آرام گره
            می‌خورد. جایی که دوای دلتنگی‌ات را در فنجانی سرخ می‌نوشی و غم‌های
            گذرا را میان دست‌سازه‌ها جا می‌گذاری؛ آثاری که با دست و دل خلق
            شده‌اند تا قصه بگویند، بی‌آن‌که کلامی بگویند.
          </p>
          <p className="mb-4 drop-shadow-sm">
            «ابد» بیش از یک کافه است؛ روایت پیوند دیروز و امروز، گالری‌ای زنده
            از نگاه‌ها، لبخندها و مکث‌هایی که شاید کوتاه باشند، اما در دل، بلند
            و ابدی‌اند.
          </p>
          <p className="drop-shadow-sm">
            فرق ازل و ابد در آن است که ازل را آغازی نیست و ابد را پایانی نیست… و
            ما، در «ابد»، گرد هم می‌آییم؛ تا در بی‌کرانگی هنر و دوستی، لحظه‌ای
            بایستیم… لحظه‌ای که هرچند کوتاه است، اما شاید، ابدی شود.
          </p>
        </div>
      </footer>
    </div>
  );
}
