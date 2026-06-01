import {
  ArrowUp,
  CalendarHeart,
  Camera,
  Gift,
  Heart,
  LockKeyhole,
  LogOut,
  Mail,
  Music2,
  Pause,
  Play,
  Sparkles,
  Stars
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../lib/api.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const CHINA_TIME_OFFSET_MS = 8 * 60 * 60 * 1000;

function chinaDayNumber(timestamp = Date.now()) {
  return Math.floor((timestamp + CHINA_TIME_OFFSET_MS) / DAY_MS);
}

function dateDayNumber(date) {
  if (!date) return null;
  const timestamp = new Date(`${date}T00:00:00+08:00`).getTime();
  if (Number.isNaN(timestamp)) return null;
  return chinaDayNumber(timestamp);
}

function daysBetween(date) {
  const startDay = dateDayNumber(date);
  if (startDay === null) return 0;
  return Math.max(0, chinaDayNumber() - startDay);
}

function daysUntil(date) {
  const targetDay = dateDayNumber(date);
  if (targetDay === null) return 0;
  return Math.max(0, targetDay - chinaDayNumber());
}

function prettyDate(date) {
  if (typeof date !== "string" || !date) return "待填写";
  return date.replaceAll("-", ".");
}

function todayCard(cards = []) {
  if (!cards.length) return null;
  return cards[chinaDayNumber() % cards.length];
}

const defaultUnlockMeta = {
  loverName: "你",
  unlockTitle: "给你的小小宇宙",
  unlockHint: "输入属于我们的数字，就能打开这座只为你亮起的花园。"
};

const petalPattern = [
  { x: "4vw", delay: "-1.8s", duration: "18.5s", drift: "9vw", scale: 0.86, rotate: "18deg", alpha: 0.24, blur: "0px" },
  { x: "11vw", delay: "-12.4s", duration: "23s", drift: "13vw", scale: 0.68, rotate: "-24deg", alpha: 0.18, blur: "0.2px" },
  { x: "17vw", delay: "-6.7s", duration: "19.8s", drift: "7vw", scale: 0.54, rotate: "42deg", alpha: 0.16, blur: "0.6px" },
  { x: "24vw", delay: "-17.2s", duration: "26s", drift: "16vw", scale: 0.78, rotate: "-8deg", alpha: 0.2, blur: "0px" },
  { x: "31vw", delay: "-4.1s", duration: "21.5s", drift: "11vw", scale: 1.04, rotate: "31deg", alpha: 0.25, blur: "0.2px" },
  { x: "38vw", delay: "-20.6s", duration: "28s", drift: "18vw", scale: 0.6, rotate: "-35deg", alpha: 0.14, blur: "0.8px" },
  { x: "45vw", delay: "-9.3s", duration: "20.4s", drift: "8vw", scale: 0.72, rotate: "58deg", alpha: 0.2, blur: "0px" },
  { x: "52vw", delay: "-14.8s", duration: "24.2s", drift: "14vw", scale: 0.92, rotate: "-14deg", alpha: 0.22, blur: "0.3px" },
  { x: "59vw", delay: "-3.5s", duration: "18.8s", drift: "10vw", scale: 0.5, rotate: "9deg", alpha: 0.15, blur: "0.7px" },
  { x: "66vw", delay: "-22.1s", duration: "29s", drift: "17vw", scale: 0.82, rotate: "-48deg", alpha: 0.19, blur: "0.2px" },
  { x: "73vw", delay: "-7.9s", duration: "22.7s", drift: "12vw", scale: 1.12, rotate: "26deg", alpha: 0.26, blur: "0px" },
  { x: "81vw", delay: "-16.4s", duration: "25.6s", drift: "15vw", scale: 0.64, rotate: "-18deg", alpha: 0.17, blur: "0.5px" },
  { x: "89vw", delay: "-5.2s", duration: "20.8s", drift: "9vw", scale: 0.76, rotate: "66deg", alpha: 0.21, blur: "0px" },
  { x: "96vw", delay: "-19.7s", duration: "27.4s", drift: "13vw", scale: 0.58, rotate: "-28deg", alpha: 0.16, blur: "0.8px" },
  { x: "8vw", delay: "-25.5s", duration: "31s", drift: "21vw", scale: 0.48, rotate: "44deg", alpha: 0.12, blur: "1px" },
  { x: "28vw", delay: "-10.9s", duration: "24.8s", drift: "19vw", scale: 0.7, rotate: "-52deg", alpha: 0.17, blur: "0.4px" },
  { x: "49vw", delay: "-27.6s", duration: "33s", drift: "23vw", scale: 0.56, rotate: "12deg", alpha: 0.13, blur: "0.9px" },
  { x: "69vw", delay: "-13.1s", duration: "26.6s", drift: "18vw", scale: 0.88, rotate: "-6deg", alpha: 0.2, blur: "0.2px" },
  { x: "86vw", delay: "-29.4s", duration: "34s", drift: "20vw", scale: 0.62, rotate: "37deg", alpha: 0.15, blur: "0.7px" },
  { x: "15vw", delay: "-2.6s", duration: "17.2s", drift: "6vw", scale: 0.94, rotate: "-31deg", alpha: 0.22, blur: "0px" },
  { x: "42vw", delay: "-18.3s", duration: "27.8s", drift: "16vw", scale: 0.52, rotate: "71deg", alpha: 0.14, blur: "0.6px" },
  { x: "57vw", delay: "-8.6s", duration: "21.9s", drift: "9vw", scale: 0.74, rotate: "-20deg", alpha: 0.19, blur: "0.2px" },
  { x: "77vw", delay: "-23.7s", duration: "30.5s", drift: "22vw", scale: 0.66, rotate: "49deg", alpha: 0.16, blur: "0.5px" },
  { x: "93vw", delay: "-11.5s", duration: "23.5s", drift: "11vw", scale: 0.98, rotate: "-11deg", alpha: 0.23, blur: "0px" }
];

function UnlockScreen({ meta = defaultUnlockMeta, onUnlocked }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiRequest("/api/unlock", {
        method: "POST",
        body: JSON.stringify({ code })
      });
      await onUnlocked();
    } catch {
      setError("口令还不对，再试一次。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="unlock-page">
      <div className="dream-orbit dream-orbit-a" />
      <div className="dream-orbit dream-orbit-b" />
      <section className="unlock-panel fade-in">
        <div className="unlock-badge">
          <LockKeyhole size={18} />
          <span>Private Garden</span>
        </div>
        <h1>{meta.unlockTitle}</h1>
        <p>{meta.unlockHint}</p>
        <form onSubmit={submit} className="unlock-form">
          <label htmlFor="unlock-code">入口口令</label>
          <div className="unlock-row">
            <input
              id="unlock-code"
              type="password"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            <button type="submit" disabled={loading}>
              <Heart size={18} />
              <span>{loading ? "打开中" : "打开"}</span>
            </button>
          </div>
          {error && <p className="form-error">{error}</p>}
        </form>
      </section>
    </main>
  );
}

function EmptyPanel({ icon: Icon, title, text }) {
  return (
    <div className="soft-card empty-panel">
      <Icon size={22} />
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function LoadError({ message, onRetry }) {
  return (
    <main className="loading-page error-page">
      <div className="soft-card empty-panel">
        <Sparkles size={22} />
        <div>
          <h1>小宇宙暂时没有连上</h1>
          <p>{message}</p>
          <button type="button" className="button primary small-button" onClick={onRetry}>
            重新尝试
          </button>
        </div>
      </div>
    </main>
  );
}

function Hero({ content }) {
  const days = daysBetween(content.site.anniversary);
  const firstGallery = content.gallery[0] || {
    title: "新的照片",
    date: content.site.anniversary,
    url: "/assets/gallery-placeholder-1.svg"
  };

  return (
    <section className="hero-section">
      <div className="hero-copy fade-in">
        <span className="eyebrow">{content.hero.eyebrow}</span>
        <h1>{content.hero.title}</h1>
        <p>{content.hero.subtitle}</p>
        <div className="hero-actions">
          <a href="#timeline" className="button primary">
            <Sparkles size={18} />
            <span>{content.hero.primaryAction}</span>
          </a>
          <a href="#letter" className="button secondary">
            <Mail size={18} />
            <span>{content.hero.secondaryAction}</span>
          </a>
        </div>
      </div>
      <div className="hero-visual fade-in delay-1">
        <div className="polaroid">
          <img src={firstGallery?.url} alt={firstGallery?.title || "memory"} />
          <div>
            <strong>{firstGallery?.title || "新的照片"}</strong>
            <span>{prettyDate(firstGallery?.date)}</span>
          </div>
        </div>
        <div className="day-counter">
          <span>已经喜欢你</span>
          <strong>{days}</strong>
          <span>天</span>
        </div>
      </div>
    </section>
  );
}

function Stats({ content }) {
  return (
    <section className="stats-grid" aria-label="纪念日">
      {content.anniversaries.map((item) => {
        const value = item.kind === "count-down" ? daysUntil(item.date) : daysBetween(item.date);
        return (
          <article className="soft-card stat-card" key={item.id}>
            <CalendarHeart size={20} />
            <span>{item.title}</span>
            <strong>{value}</strong>
            <small>{item.kind === "count-down" ? "天后" : "天"}</small>
          </article>
        );
      })}
    </section>
  );
}

function Timeline({ items }) {
  return (
    <section className="page-section" id="timeline">
      <div className="section-heading">
        <span className="eyebrow">Memory Timeline</span>
        <h2>把每一次心动排成星河</h2>
      </div>
      {items.length ? (
        <div className="timeline">
          {items.map((item) => (
            <article className="timeline-item" key={item.id}>
              <time>{prettyDate(item.date)}</time>
              <div className="timeline-dot" />
              <div className="soft-card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyPanel icon={CalendarHeart} title="还没有回忆条目" text="去后台添加第一段故事后，这里会按时间线展示。" />
      )}
    </section>
  );
}

function Gallery({ items }) {
  return (
    <section className="page-section gallery-section">
      <div className="section-heading">
        <span className="eyebrow">Photo Room</span>
        <h2>替换成你们真实照片后，这里会更发光</h2>
      </div>
      {items.length ? (
        <div className="gallery-grid">
          {items.map((item) => (
            <article className="gallery-card" key={item.id}>
              <img src={item.url || "/assets/gallery-placeholder-1.svg"} alt={item.title} />
              <div>
                <span>{prettyDate(item.date)}</span>
                <h3>{item.title}</h3>
                <p>{item.caption}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyPanel icon={Camera} title="相册还空着" text="上传照片或填写图片地址后，公开页会自动生成照片墙。" />
      )}
    </section>
  );
}

function Letter({ letter }) {
  return (
    <section className="page-section letter-section" id="letter">
      <div className="letter-paper">
        <span className="eyebrow">Love Letter</span>
        <h2>{letter.title}</h2>
        <p className="letter-greeting">{letter.greeting}</p>
        <p className="typewriter">{letter.body}</p>
        <p className="letter-signature">{letter.signature}</p>
      </div>
    </section>
  );
}

function Wishes({ items, cards }) {
  const card = todayCard(cards);
  return (
    <section className="page-section wish-section">
      <div className="section-heading">
        <span className="eyebrow">Wish Capsule</span>
        <h2>未来也有很多格子，想和你一起填满</h2>
      </div>
      <div className="wish-layout">
        <div className="daily-card">
          <Stars size={24} />
          <span>{card?.title || "今日小卡片"}</span>
          <p>{card?.text || "今天也要好好被爱。"}</p>
        </div>
        {items.length ? (
          <div className="wish-list">
            {items.map((item) => (
              <article className="soft-card wish-card" key={item.id}>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
                <span>{item.status}</span>
              </article>
            ))}
          </div>
        ) : (
          <EmptyPanel icon={Gift} title="愿望胶囊还没有内容" text="在后台写下一个想一起完成的小事，它会出现在这里。" />
        )}
      </div>
    </section>
  );
}

function Music({ site, audioRef, onPlayStateChange }) {
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    setAutoplayBlocked(false);
    if (!site.musicUrl || !audioRef.current) return;

    async function playAudio() {
      if (!audioRef.current) return;
      await audioRef.current.play();
      setAutoplayBlocked(false);
      onPlayStateChange(true);
    }

    const playAttempt = playAudio();
    if (playAttempt?.catch) {
      playAttempt.catch(() => setAutoplayBlocked(true));
    }
  }, [site.musicUrl]);

  useEffect(() => {
    if (!autoplayBlocked) return undefined;

    async function resumeAfterGesture() {
      try {
        await audioRef.current?.play();
        setAutoplayBlocked(false);
      } catch {
        setAutoplayBlocked(true);
      }
    }

    window.addEventListener("pointerdown", resumeAfterGesture, { once: true });
    window.addEventListener("keydown", resumeAfterGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", resumeAfterGesture);
      window.removeEventListener("keydown", resumeAfterGesture);
    };
  }, [autoplayBlocked]);

  return (
    <section className="music-strip">
      <div>
        <Music2 size={22} />
        <div>
          <strong>{site.musicTitle}</strong>
          <span>{site.musicArtist}</span>
        </div>
      </div>
      {site.musicUrl ? (
        <div className="music-player">
          <audio
            ref={audioRef}
            controls
            src={site.musicUrl}
            preload="auto"
            onPlay={() => onPlayStateChange(true)}
            onPause={() => onPlayStateChange(false)}
            onEnded={() => onPlayStateChange(false)}
          />
          {autoplayBlocked && <span className="empty-note">浏览器拦截了自动播放，点一下播放就好。</span>}
        </div>
      ) : (
        <span className="empty-note">后台上传一首歌后会出现在这里</span>
      )}
    </section>
  );
}

function FloatingActions({ show, hasMusic, isMusicPlaying, onToggleMusic, onBackTop }) {
  return (
    <div className={show ? "floating-actions visible" : "floating-actions"} aria-hidden={!show}>
      {hasMusic && (
        <button
          type="button"
          className="floating-action-button music-toggle"
          onClick={onToggleMusic}
          aria-label={isMusicPlaying ? "暂停音乐" : "播放音乐"}
          tabIndex={show ? 0 : -1}
        >
          {isMusicPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
      )}
      <button
        type="button"
        className="floating-action-button back-top"
        onClick={onBackTop}
        aria-label="回到顶部"
        tabIndex={show ? 0 : -1}
      >
        <ArrowUp size={20} />
      </button>
    </div>
  );
}

export default function PublicSite() {
  const [content, setContent] = useState(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [unlockMeta, setUnlockMeta] = useState(defaultUnlockMeta);
  const [showFloatingActions, setShowFloatingActions] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef(null);

  async function loadContent() {
    setLoading(true);
    setLoadError("");
    try {
      const data = await apiRequest("/api/public/content");
      setContent(data);
      setLocked(false);
    } catch (error) {
      if (error.message === "unlock_required") {
        try {
          setUnlockMeta(await apiRequest("/api/public/meta"));
        } catch {
          setUnlockMeta(defaultUnlockMeta);
        }
        setLocked(true);
      } else {
        setLoadError(`读取内容失败：${error.message}`);
        setContent(null);
        setLocked(false);
      }
    } finally {
      setLoading(false);
    }
  }

  async function lockAgain() {
    await apiRequest("/api/lock", { method: "POST" });
    setLocked(true);
    setContent(null);
  }

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    function updateFloatingActions() {
      setShowFloatingActions(window.scrollY > 520);
    }

    updateFloatingActions();
    window.addEventListener("scroll", updateFloatingActions, { passive: true });
    return () => window.removeEventListener("scroll", updateFloatingActions);
  }, []);

  async function toggleMusic() {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      try {
        await audioRef.current.play();
        setIsMusicPlaying(true);
      } catch {
        setIsMusicPlaying(false);
      }
      return;
    }

    audioRef.current.pause();
    setIsMusicPlaying(false);
  }

  function backTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const floatingPetals = useMemo(() => petalPattern, []);

  if (loading) {
    return <main className="loading-page">正在把小宇宙点亮...</main>;
  }

  if (loadError) {
    return <LoadError message={loadError} onRetry={loadContent} />;
  }

  if (locked || !content) {
    return <UnlockScreen meta={unlockMeta} onUnlocked={loadContent} />;
  }

  return (
    <main className="public-page">
      <div className="petal-layer" aria-hidden="true">
        {floatingPetals.map((petal, index) => (
          <span
            key={`${petal.x}-${index}`}
            style={{
              "--x": petal.x,
              "--delay": petal.delay,
              "--duration": petal.duration,
              "--drift": petal.drift,
              "--scale": petal.scale,
              "--rotate-start": petal.rotate,
              "--alpha": petal.alpha,
              "--blur": petal.blur
            }}
          />
        ))}
      </div>
      <nav className="site-nav">
        <a href="/" className="brand-mark">
          <Heart size={18} />
          <span>{content.site.loverName}</span>
        </a>
        <div>
          <a href="#timeline">回忆</a>
          <a href="#letter">情书</a>
          <button onClick={lockAgain} className="icon-button" aria-label="重新上锁">
            <LogOut size={18} />
          </button>
        </div>
      </nav>
      <Music site={content.site} audioRef={audioRef} onPlayStateChange={setIsMusicPlaying} />
      <Hero content={content} />
      <Stats content={content} />
      <Timeline items={content.timeline} />
      <Gallery items={content.gallery} />
      <Letter letter={content.letter} />
      <Wishes items={content.wishes} cards={content.cards} />
      <footer className="site-footer">
        <Camera size={18} />
        <span>Made for {content.site.loverName}. Every placeholder can become a real memory.</span>
        <Gift size={18} />
      </footer>
      <FloatingActions
        show={showFloatingActions}
        hasMusic={Boolean(content.site.musicUrl)}
        isMusicPlaying={isMusicPlaying}
        onToggleMusic={toggleMusic}
        onBackTop={backTop}
      />
    </main>
  );
}
