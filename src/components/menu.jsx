import React from "react";
import numeral from "numeral";

const menuItems = [
  // سرد
  {
    category: "نوشیدنی سرد",
    title: "آیس آمریکانو",
    desc: "",
    price: "80000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "آیس لاته",
    desc: "",
    price: "120000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "آیس لاته طعم داره",
    desc: "سیروب شکلات + کارامل + وانیل + فندق",
    price: "130000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "آفوگاتو",
    desc: "",
    price: "120000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "شیک شکلات",
    desc: "",
    price: "150000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "شیک سوداد",
    desc: "اسپرسو + بیسکوییت مادر + سیروب فندق + بستنی",
    price: "210000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "شیک اورئو",
    desc: "",
    price: "180000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "لیموناد",
    desc: "",
    price: "110000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "موهیتو",
    desc: "",
    price: "120000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "دوای غم های گذرا",
    desc: "سیروب رز + پنیرک + تخم شربتی +سودا + لیمو",

    price: "120000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "دوای دلتنگی",
    desc: "سیروب لوندر + آبوئه ورا + آب سیب + بهار نارنج",
    price: "110000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "پا تختی",
    desc: "سیروب پرتقال ورز + تخم شربتی +سودا + شیرینی زبان",
    price: "90000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "شوق دیدار",
    desc: "سیروب وانیل + لیمو + آب لیمو+ بلوبلری",
    price: "140000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی سرد",
    title: "کیک بستنی",
    desc: "",
    price: "145000",
    image: "/imgs/album.webp",
  },
  //   گرم
  {
    category: "نوشیدنی گرم",
    title: "چای",
    desc: "",
    price: "65000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "اسپرسو",
    desc: "",
    price: "70000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "آمریکانو",
    desc: "",
    price: "80000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "لاته",
    desc: "",
    price: "120000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "لاته طعم دار",
    desc: "سیروب شکلات + کارامل + وانیل + فندق",
    price: "130000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "کاپوچینو کلاسیک",
    desc: "",
    price: "115000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "کاپوچینو پرمیوم",
    desc: "",
    price: "100000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "هات چاکلت",
    desc: "",
    price: "120000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "وایت چاکلت",
    desc: "",
    price: "110000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "چاکلت لاوا",
    desc: "",
    price: "130000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "چای ماسالا",
    desc: "",
    price: "110000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "چای کرک",
    desc: "",
    price: "110000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "درتی بیسکوییت",
    desc: "",
    price: "150000",
    image: "/imgs/album.webp",
  },
  {
    category: "نوشیدنی گرم",
    title: "دمنوش درازنو",
    desc: "لیمو +  آویشن + چای ترش + به همراه نبات و خرما",
    price: "80000",
    image: "/imgs/album.webp",
  },
  //   غذا
  {
    category: "غذا",
    title: "نیمرو",
    desc: "",
    price: "90000",
    image: "/imgs/album.webp",
  },
  {
    category: "غذا",
    title: "املت",
    desc: "",
    price: "95000",
    image: "/imgs/album.webp",
  },
  {
    category: "غذا",
    title: "سیب زمینی ساده",
    desc: "",
    price: "150000",
    image: "/imgs/album.webp",
  },
  {
    category: "غذا",
    title: "سیب زمینی با سس قارچی",
    desc: "",
    price: "175000",
    image: "/imgs/album.webp",
  },
  {
    category: "غذا",
    title: "پنینی مرغ",
    desc: "",
    price: "190000",
    image: "/imgs/album.webp",
  },
  {
    category: "غذا",
    title: "ماکارونی",
    desc: "فقط سه شنبه ها",
    price: "145000",
    image: "/imgs/album.webp",
    class:
      "relative border-2 border-yellow-400 text-white rounded-xl flex flex-col items-center p-3 justify-between min-h-36 shadow-[0_0_15px_rgba(255,215,0,0.6)] before:absolute before:inset-0 before:rounded-xl before:border-[3px] before:border-yellow-500 before:blur-sm before:opacity-60 before:animate-pulse",
    class2:
      "relative bg-[#7a2b2b] text-[11px] px-2 py-1 rounded-md mb-2 text-center leading-relaxed border-2 border-[#c49a3a] shadow-[0_0_10px_rgba(196,154,58,0.6)] before:absolute before:inset-0 before:rounded-md before:border-[2px] before:border-[#ffcc5c] before:blur-[1px] before:opacity-70 before:animate-pulse w-full",
  },
  {
    category: "غذا",
    title: "طعم سوم",
    desc: "سیب زمینی + فیله مرغ مزه دار شده + قارچ + سرکه بالزامیک",
    price: "240000",
    image: "/imgs/album.webp",
  },
  // {
  //   category: "غذا",
  //   title: "سالاد سزار",
  //   desc: "",
  //   price: "190000",
  //   image: "/imgs/album.webp",
  // },
];

export default function Menu() {
  return (
    <div className="flex flex-col items-center bg-[#8B0000] min-h-screen p-4 text-white">
      <h1 className="text-7xl ordi text-black font-extrabold mb-2">کافه ابد</h1>
      <div className="flex flex-col items-center my-2">
        <p className="text-sm text-center text-[#cfcfcf] my-1 font-bold">
          آنْچِه ما دَر زَندِگى اَنجام مى‌دَهيمْ، <b />
          دَر اَبَديَّت بازتاب پیدا میکند
        </p>
        <span className="block w-full h-[2px] bg-[#4e4e4e] rounded-full"></span>
      </div>

      <h2 className="text-xl ordi text-[#000000] font-black my-6">منو</h2>

      {/* navigation بالا */}
      <div className="flex mb-6 w-full justify-center sticky top-0 z-50 bg-[#e2e2e2] backdrop-blur-md shadow-md rounded-b-xl overflow-hidden">
        <a
          href="#hot"
          className="flex-1 px-3 py-2 text-center text-[#8B0000] text-sm font-semibold hover:bg-[#8B0000]/10 transition-colors"
        >
          نوشیدنی گرم
        </a>
        <a
          href="#cold"
          className="flex-1 px-3 py-2 text-center text-[#8B0000] text-sm font-semibold hover:bg-[#8B0000]/10 transition-colors"
        >
          نوشیدنی سرد
        </a>
        <a
          href="#food"
          className="flex-1 px-3 py-2 text-center text-[#8B0000] text-sm font-semibold hover:bg-[#8B0000]/10 transition-colors"
        >
          غذا
        </a>
      </div>

      {/* سکشن نوشیدنی گرم */}
      <h2 id="hot" className="text-4xl ordi mt-5 font-bold text-black mb-10">
        نوشیدنی گرم
      </h2>
      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-6">
        {menuItems
          .filter((item) => item.category === "نوشیدنی گرم")
          .map((item, index) => (
            <div
              key={index}
              className="bg-[#661212 border-2 border-black text-[#ffffff] rounded-xl flex flex-col items-center p-3 justify-between min-h-36"
            >
              <h3 className="text-base font-semibold mb-2 yekan">
                {item.title}
              </h3>
              <img
                src={item.image}
                alt={item.desc}
                className="hidden h-20 object-contain mb-2 w-auto"
              />

              {item.desc ? (
                <div className="bg-[#7a2b2b] text-[11px] px-2 py-1 rounded-md mb-2 text-center leading-relaxed shadow-inner border border-[#8a3a3a] w-full">
                  {item.desc}
                </div>
              ) : (
                <p className="h-16 flex items-center">
                  <img
                    src="/imgs/warm.webp"
                    alt="cup coffee"
                    className="w-10"
                  />
                </p>
              )}

              <span className="font-bold">
                {numeral(item.price).format("0,0")} تومان
              </span>
            </div>
          ))}
      </div>

      {/* سکشن نوشیدنی سرد */}
      <h2 id="cold" className="text-4xl ordi font-bold text-black mt-20 mb-10">
        نوشیدنی سرد
      </h2>
      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-6">
        {menuItems
          .filter((item) => item.category === "نوشیدنی سرد")
          .map((item, index) => (
            <div
              key={index}
              className="bg-[#661212 border-2 border-black text-[#ffffff] rounded-xl flex flex-col items-center p-3 justify-between min-h-36"
            >
              <h3 className="text-base font-semibold mb-2 yekan">
                {item.title}
              </h3>
              <img
                src={item.image}
                alt={item.desc}
                className="hidden h-20 object-contain mb-2 w-auto"
              />

              {item.desc ? (
                <div className="bg-[#7a2b2b] text-[11px] px-2 py-1 rounded-md mb-2 text-center leading-relaxed shadow-inner border border-[#8a3a3a] w-full">
                  {item.desc}
                </div>
              ) : (
                <p className="h-16 flex items-center">
                  <img src="/imgs/cold.webp" alt="lomonad" className="w-10" />
                </p>
              )}

              <span className="font-bold">
                {numeral(item.price).format("0,0")} تومان
              </span>
            </div>
          ))}
      </div>

      {/* سکشن غذا */}
      <h2 id="food" className="text-4xl ordi mt-20 mb-10 font-bold text-black">
        غذا
      </h2>
      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-6">
        {menuItems
          .filter((item) => item.category === "غذا")
          .map((item, index) => (
            <div
              key={index}
              className={
                item.class ??
                "bg-[#661212 border-2 border-black text-[#ffffff] rounded-xl flex flex-col items-center p-3 justify-between min-h-36"
              }
            >
              <h3 className="text-base font-semibold mb-2 yekan">
                {item.title}
              </h3>
              <img
                src={item.image}
                alt={item.desc}
                className="hidden h-20 object-contain mb-2 w-auto"
              />

              {item.desc ? (
                <div
                  className={
                    item.class2 ??
                    "bg-[#7a2b2b] text-[11px] px-2 py-1 rounded-md mb-2 text-center leading-relaxed shadow-inner border border-[#8a3a3a] w-full"
                  }
                >
                  {item.desc}
                </div>
              ) : (
                <p className="h-16 flex items-center">
                  <img src="/imgs/food.webp" alt="food" className="w-10" />
                </p>
              )}

              <span className="font-bold">
                {numeral(item.price).format("0,0")} تومان
              </span>
            </div>
          ))}
      </div>
      <footer className="bg-gradient-to-b from-[#8B0000] to-[#5a0000] border-2 rounded-xl border-[#272727] text-[#FFDAB9] text-center leading-relaxed px-6 py-10 mt-12 font-vazir">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <img
              src="/imgs/abadCG.webp"
              alt="ابد"
              className="w-32 h-32 border border-[#FFD700]/70 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
            />
          </div>
          <p className="mb-5 text-base md:text-lg drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            در دل خیابان‌های کهن گرگان، جایی میان خاطرات یک خانه‌ی قدیمی و رؤیای
            یک گالری، «ابد» متولد شد؛ مکانی که زمان، آرام در آن رنگ می‌بازد و هر
            جرعه‌ قهوه، سفری‌ست به عمق روح.
          </p>
          <p className="mb-5 text-base md:text-lg drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            اینجا هنر در هوا جاری‌ست؛ موسیقی از دل دیوارهای سپید و پنجره‌هایی که
            رو به میدان گشوده‌اند می‌گذرد، و نگاهت در رفت‌وآمد زندگی، آرام گره
            می‌خورد. جایی که دوای دلتنگی‌ات را در فنجانی سرخ می‌نوشی و غم‌های
            گذرا را میان دست‌سازه‌ها جا می‌گذاری؛ آثاری که با دست و دل خلق
            شده‌اند تا قصه بگویند، بی‌آن‌که کلامی بگویند.
          </p>
          <p className="mb-5 text-base md:text-lg drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            «ابد» بیش از یک کافه است؛ روایت پیوند دیروز و امروز، گالری‌ای زنده
            از نگاه‌ها، لبخندها و مکث‌هایی که شاید کوتاه باشند، اما در دل، بلند
            و ابدی‌اند.
          </p>
          <p className="text-base md:text-lg drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
            فرق ازل و ابد در آن است که ازل را آغازی نیست و ابد را پایانی نیست… و
            ما، در «ابد»، گرد هم می‌آییم؛ تا در بی‌کرانگی هنر و دوستی، لحظه‌ای
            بایستیم… لحظه‌ای که هرچند کوتاه است، اما شاید، ابدی شود.
          </p>
        </div>
      </footer>
    </div>
  );
}
