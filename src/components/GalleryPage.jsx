import { useEffect, useRef, useState } from "react";

async function fetchGallery() {
  const response = await fetch("/api/gallery");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "دریافت گالری ناموفق بود.");
  return data;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function GalleryVideoPlayer({ item }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      try {
        await video.play();
      } catch {
        setPlaying(false);
      }
    } else {
      video.pause();
    }
  }

  function seek(event) {
    const video = videoRef.current;
    const nextTime = Number(event.target.value);
    if (!video || !Number.isFinite(nextTime)) return;
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function changeVolume(event) {
    const nextVolume = Number(event.target.value);
    const video = videoRef.current;
    setVolume(nextVolume);
    setMuted(nextVolume === 0);
    if (video) {
      video.volume = nextVolume;
      video.muted = nextVolume === 0;
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setMuted(nextMuted);
    if (!nextMuted && video.volume === 0) {
      video.volume = 0.7;
      setVolume(0.7);
    }
  }

  async function toggleFullscreen() {
    const player = playerRef.current;
    if (!player) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (player.requestFullscreen) {
      await player.requestFullscreen();
    }
  }

  return (
    <div ref={playerRef} className="gallery-video-player group relative overflow-hidden bg-black text-white">
      <video
        ref={videoRef}
        src={item.url}
        playsInline
        preload="metadata"
        aria-label={item.caption || "ویدئوی گالری کافه ابد"}
        onClick={togglePlayback}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        className="gallery-video block max-h-[75vh] min-h-48 w-full cursor-pointer bg-black object-contain"
      />

      <button type="button" onClick={togglePlayback} aria-label={playing ? "توقف ویدئو" : "پخش ویدئو"} className={`gallery-video-button absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#d7354f]/70 bg-[#24070e]/85 text-xl text-[#ffe8ec] shadow-[0_0_28px_#a20d2455] transition hover:scale-105 hover:bg-[#a20d24] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ef8797] ${playing ? "pointer-events-none opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
        {playing ? <span aria-hidden="true" className="gallery-pause-icon"><i /><i /></span> : <span aria-hidden="true" className="gallery-play-icon" />}
      </button>

      <div className="gallery-video-controls absolute inset-x-0 bottom-0 border-t border-[#d7354f]/20 bg-gradient-to-t from-[#100b0df5] via-[#24070ee8] to-transparent px-3 pb-3 pt-8 opacity-100 transition sm:opacity-90 sm:group-hover:opacity-100">
        <input
          dir="ltr"
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={Math.min(currentTime, duration || 0)}
          onChange={seek}
          aria-label="موقعیت ویدئو"
          className="gallery-video-range mb-2 block w-full cursor-pointer"
          style={{ "--progress": `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />
        <div dir="ltr" className="flex items-center gap-2">
          <button type="button" onClick={togglePlayback} aria-label={playing ? "توقف" : "پخش"} title={playing ? "توقف" : "پخش"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d7354f]/50 bg-[#a20d24]/35 text-base text-[#ffe8ec] transition hover:bg-[#a20d24]">
            {playing ? <span aria-hidden="true" className="gallery-pause-icon"><i /><i /></span> : <span aria-hidden="true" className="gallery-play-icon" />}
          </button>
          <span dir="ltr" className="min-w-[76px] text-center text-[11px] tabular-nums text-white/90">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <button type="button" onClick={toggleMute} aria-label={muted ? "فعال‌کردن صدا" : "قطع صدا"} title={muted ? "فعال‌کردن صدا" : "قطع صدا"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d7354f]/40 bg-[#a20d24]/25 text-lg text-[#ffe8ec] transition hover:bg-[#a20d24]">
            {muted || volume === 0 ? "×" : "♫"}
          </button>
          <input dir="ltr" type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={changeVolume} aria-label="بلندی صدا" className="gallery-video-range hidden w-16 cursor-pointer sm:block" />
          <span className="flex-1" />
          <button type="button" onClick={toggleFullscreen} aria-label="تمام‌صفحه" title="تمام‌صفحه" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d7354f]/40 bg-[#a20d24]/25 text-lg text-[#ffe8ec] transition hover:bg-[#a20d24]">⛶</button>
        </div>
      </div>

      <style>{`
        .gallery-video-player button { -webkit-appearance: none; appearance: none; -webkit-tap-highlight-color: transparent; }
        .gallery-play-icon { display: block; width: 0; height: 0; margin-left: 3px; border-top: 7px solid transparent; border-bottom: 7px solid transparent; border-left: 10px solid #ffe8ec; }
        .gallery-video-button .gallery-play-icon { border-top-width: 10px; border-bottom-width: 10px; border-left-width: 15px; }
        .gallery-pause-icon { display: inline-flex; align-items: center; gap: 3px; }
        .gallery-pause-icon i { display: block; width: 3px; height: 12px; border-radius: 1px; background: #ffe8ec; }
        .gallery-video-button .gallery-pause-icon i { width: 4px; height: 18px; }
        .gallery-video-button:active { background: #a20d24; }
        .gallery-video-range { height: 4px; appearance: none; border-radius: 999px; background: linear-gradient(to right, #d7354f var(--progress, 0%), #ffffff55 var(--progress, 0%)); }
        .gallery-video-range::-webkit-slider-thumb { width: 11px; height: 11px; appearance: none; border-radius: 50%; background: #ffe8ec; box-shadow: 0 0 0 2px #d7354f; }
        .gallery-video-range::-moz-range-thumb { width: 9px; height: 9px; border: 2px solid #d7354f; border-radius: 50%; background: #ffe8ec; }
        .gallery-video-player:fullscreen, .gallery-video-player:-webkit-full-screen { position: fixed; inset: 0; z-index: 9999; display: flex; width: 100vw; height: 100vh; height: 100dvh; min-height: 100vh; min-height: 100dvh; align-items: center; justify-content: center; overflow: hidden; background: radial-gradient(ellipse at center, #301018 0%, #100b0d 76%); }
        .gallery-video-player:fullscreen .gallery-video, .gallery-video-player:-webkit-full-screen .gallery-video { display: block; width: 100%; height: 100%; max-height: 100vh; max-height: 100dvh; min-height: 0; object-fit: contain; }
        .gallery-video-player:fullscreen .gallery-video-controls, .gallery-video-player:-webkit-full-screen .gallery-video-controls { z-index: 2; padding-bottom: max(16px, env(safe-area-inset-bottom)); padding-right: max(16px, env(safe-area-inset-right)); padding-left: max(16px, env(safe-area-inset-left)); }
      `}</style>
    </div>
  );
}

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchGallery()
      .then((gallery) => active && setItems(gallery))
      .catch((loadError) => active && setError(loadError.message));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedImage) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedImage]);

  return (
    <main dir="rtl" className="min-h-screen bg-[#100b0d] text-[#f4e8e8]">
      <header className="relative z-10 border-b border-white/10 bg-[#100b0de8] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="/" className="font-[Lalezar] text-2xl text-white sm:text-3xl">
            کافه <span className="text-[#cf263f]">ابد</span>
          </a>
          <a href="/" className="text-sm text-[#e6b5bd] transition hover:text-white">بازگشت به منو</a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-16">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5 border-b border-[#762034] pb-6 sm:mb-12">
          <div>
            <p className="text-[10px] tracking-[.28em] text-[#d34b60]">ABAD · MOMENTS</p>
            <h1 className="mt-2 font-[Lalezar] text-4xl text-white sm:text-5xl">گالری ابد</h1>
            <p className="mt-2 text-sm text-[#b4a0a5]">لحظه‌هایی از کافه، هنر و آدم‌ها</p>
          </div>
          <span className="text-xs text-[#80636b]">{items.length.toLocaleString("fa-IR")} قاب</span>
        </div>

        {error ? (
          <p role="alert" className="border-r-2 border-[#d34b60] bg-[#1b1115] px-4 py-5 text-sm text-[#efb6bf]">{error}</p>
        ) : items.length === 0 ? (
          <div className="border border-dashed border-[#622034] px-5 py-20 text-center">
            <p className="font-[Lalezar] text-2xl text-white">هنوز قابی در گالری نیست</p>
            <p className="mt-2 text-sm text-[#a9949a]">به‌زودی لحظه‌های ابد اینجا ثبت می‌شوند.</p>
          </div>
        ) : (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {items.map((item, index) => (
              <article key={item.id} className="mb-5 break-inside-avoid overflow-hidden border border-white/10 bg-[#181114] animate-[gallery-in_.45s_ease_both]" style={{ animationDelay: `${Math.min(index * 55, 350)}ms` }}>
                {item.type === "video" ? (
                  <GalleryVideoPlayer item={item} />
                ) : (
                  <button type="button" onClick={() => setSelectedImage(item)} aria-label={`نمایش بزرگ تصویر: ${item.caption || "بدون کپشن"}`} className="group relative block w-full cursor-zoom-in overflow-hidden bg-[#211619] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ef8797]">
                    <img src={item.url} alt={item.caption || "تصویر کافه ابد"} loading="lazy" className="block max-h-[76vh] w-full object-cover transition duration-700 group-hover:scale-[1.035]" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-3xl text-white opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100" aria-hidden="true">⌕</span>
                  </button>
                )}
                {item.caption && <p className="px-4 py-3 text-sm leading-7 text-[#e6d6da]">{item.caption}</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-white/10 px-5 py-7 text-center text-xs text-[#80636b]">
        <p>COFFEE · ART · ETERNITY</p>
        <p className="mt-3 text-[#d9a5af]">
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
      </footer>

      {selectedImage && (
        <div role="dialog" aria-modal="true" aria-label="نمایش بزرگ تصویر" onClick={() => setSelectedImage(null)} className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/95 p-4 sm:p-8">
          <button type="button" onClick={() => setSelectedImage(null)} aria-label="بستن تصویر" className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center border border-white/25 bg-black/50 text-3xl text-white transition hover:bg-white/15">×</button>
          <img src={selectedImage.url} alt={selectedImage.caption || "تصویر کافه ابد"} onClick={(event) => event.stopPropagation()} className="max-h-full max-w-full cursor-default object-contain shadow-[0_20px_100px_#000]" />
          {selectedImage.caption && <p className="absolute bottom-5 right-5 left-5 mx-auto max-w-3xl text-center text-sm text-white drop-shadow-lg sm:bottom-8">{selectedImage.caption}</p>}
        </div>
      )}

      <style>{`@keyframes gallery-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } } @media (prefers-reduced-motion: reduce) { .animate-\\[gallery-in_\\.45s_ease_both\\] { animation: none; } }`}</style>
    </main>
  );
}
