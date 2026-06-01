import {
  ArrowDown,
  ArrowUp,
  Download,
  Heart,
  ImagePlus,
  LogOut,
  Music,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { apiRequest, downloadJson } from "../lib/api.js";
import { defaultContent } from "../../server/defaultContent.js";

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function idValue(value, fallback) {
  return stringValue(value).trim() || fallback;
}

function objectValue(value, fallback) {
  return isPlainObject(value) ? value : fallback;
}

function arrayValue(value, fallback) {
  return Array.isArray(value) ? value : fallback;
}

function normalizeContentDraft(input) {
  if (!isPlainObject(input)) {
    throw new Error("JSON 顶层必须是对象。");
  }

  const site = objectValue(input.site, {});
  const hero = objectValue(input.hero, {});
  const letter = objectValue(input.letter, {});

  return {
    site: {
      ...defaultContent.site,
      loverName: stringValue(site.loverName, defaultContent.site.loverName),
      ownerName: stringValue(site.ownerName, defaultContent.site.ownerName),
      anniversary: stringValue(site.anniversary, defaultContent.site.anniversary),
      unlockTitle: stringValue(site.unlockTitle, defaultContent.site.unlockTitle),
      unlockHint: stringValue(site.unlockHint, defaultContent.site.unlockHint),
      musicTitle: stringValue(site.musicTitle, defaultContent.site.musicTitle),
      musicArtist: stringValue(site.musicArtist, defaultContent.site.musicArtist),
      musicUrl: stringValue(site.musicUrl, defaultContent.site.musicUrl)
    },
    hero: {
      ...defaultContent.hero,
      eyebrow: stringValue(hero.eyebrow, defaultContent.hero.eyebrow),
      title: stringValue(hero.title, defaultContent.hero.title),
      subtitle: stringValue(hero.subtitle, defaultContent.hero.subtitle),
      primaryAction: stringValue(hero.primaryAction, defaultContent.hero.primaryAction),
      secondaryAction: stringValue(hero.secondaryAction, defaultContent.hero.secondaryAction)
    },
    anniversaries: arrayValue(input.anniversaries, defaultContent.anniversaries).map((item, index) => {
      const draft = objectValue(item, {});
      return {
        id: idValue(draft.id, `anniversary-${index + 1}`),
        title: stringValue(draft.title, "新的纪念日"),
        date: stringValue(draft.date, defaultContent.site.anniversary),
        kind: ["count-up", "count-down"].includes(draft.kind) ? draft.kind : "count-up"
      };
    }),
    timeline: arrayValue(input.timeline, defaultContent.timeline).map((item, index) => {
      const draft = objectValue(item, {});
      return {
        id: idValue(draft.id, `timeline-${index + 1}`),
        date: stringValue(draft.date),
        title: stringValue(draft.title, "新的回忆"),
        text: stringValue(draft.text)
      };
    }),
    gallery: arrayValue(input.gallery, defaultContent.gallery).map((item, index) => {
      const draft = objectValue(item, {});
      return {
        id: idValue(draft.id, `gallery-${index + 1}`),
        title: stringValue(draft.title, "新的照片"),
        caption: stringValue(draft.caption),
        date: stringValue(draft.date),
        url: stringValue(draft.url, "/assets/gallery-placeholder-1.svg")
      };
    }),
    letter: {
      ...defaultContent.letter,
      title: stringValue(letter.title, defaultContent.letter.title),
      greeting: stringValue(letter.greeting, defaultContent.letter.greeting),
      body: stringValue(letter.body, defaultContent.letter.body),
      signature: stringValue(letter.signature, defaultContent.letter.signature)
    },
    wishes: arrayValue(input.wishes, defaultContent.wishes).map((item, index) => {
      const draft = objectValue(item, {});
      return {
        id: idValue(draft.id, `wish-${index + 1}`),
        title: stringValue(draft.title, "新的愿望"),
        text: stringValue(draft.text),
        status: stringValue(draft.status, "想去")
      };
    }),
    cards: arrayValue(input.cards, defaultContent.cards).map((item, index) => {
      const draft = objectValue(item, {});
      return {
        id: idValue(draft.id, `card-${index + 1}`),
        title: stringValue(draft.title, "今日小卡片"),
        text: stringValue(draft.text)
      };
    })
  };
}

function updateAt(list, index, patch) {
  return list.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
}

function move(list, index, direction) {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function Field({ label, children }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiRequest("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password })
      });
      await onLogin();
    } catch {
      setError("后台密码不正确。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login">
      <form onSubmit={submit} className="admin-login-card">
        <div className="unlock-badge">
          <Heart size={18} />
          <span>Jshaorii Admin</span>
        </div>
        <h1>维护这座小花园</h1>
        <p>登录后可以替换照片、编辑故事、上传音乐和导入导出 JSON。</p>
        <Field label="后台密码">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        {error && <p className="form-error">{error}</p>}
        <button className="button primary full-button" disabled={loading}>
          <Heart size={18} />
          <span>{loading ? "登录中" : "进入后台"}</span>
        </button>
      </form>
    </main>
  );
}

function ArrayToolbar({ onAdd }) {
  return (
    <button className="button secondary small-button" type="button" onClick={onAdd}>
      <Plus size={16} />
      <span>新增</span>
    </button>
  );
}

function RowActions({ index, count, onMove, onRemove }) {
  return (
    <div className="row-actions">
      <button
        type="button"
        className="icon-button"
        onClick={() => onMove(index, -1)}
        disabled={index === 0}
        aria-label="上移"
      >
        <ArrowUp size={16} />
      </button>
      <button
        type="button"
        className="icon-button"
        onClick={() => onMove(index, 1)}
        disabled={index === count - 1}
        aria-label="下移"
      >
        <ArrowDown size={16} />
      </button>
      <button type="button" className="icon-button danger" onClick={() => onRemove(index)} aria-label="删除">
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function UploadButton({ accept, onUploaded, icon = "image" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await apiRequest("/api/admin/upload", {
        method: "POST",
        body: form
      });
      onUploaded(result.url);
    } catch (uploadError) {
      setError(`上传失败：${uploadError.message}`);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  const Icon = icon === "music" ? Music : ImagePlus;

  return (
    <div className="upload-control">
      <input ref={inputRef} hidden type="file" accept={accept} onChange={upload} />
      <button type="button" className="button secondary small-button" onClick={() => inputRef.current?.click()} disabled={loading}>
        <Icon size={16} />
        <span>{loading ? "上传中" : "上传"}</span>
      </button>
      {error && <span className="upload-error">{error}</span>}
    </div>
  );
}

function SiteEditor({ content, setContent }) {
  const site = content.site;
  const hero = content.hero;

  function updateSite(patch) {
    setContent((current) => ({ ...current, site: { ...current.site, ...patch } }));
  }

  function updateHero(patch) {
    setContent((current) => ({ ...current, hero: { ...current.hero, ...patch } }));
  }

  return (
    <section className="admin-section">
      <div className="admin-section-heading">
        <h2>基础信息</h2>
      </div>
      <div className="admin-grid two">
        <Field label="她的名字">
          <input value={site.loverName} onChange={(event) => updateSite({ loverName: event.target.value })} />
        </Field>
        <Field label="你的署名">
          <input value={site.ownerName} onChange={(event) => updateSite({ ownerName: event.target.value })} />
        </Field>
        <Field label="开始纪念日">
          <input type="date" value={site.anniversary} onChange={(event) => updateSite({ anniversary: event.target.value })} />
        </Field>
        <Field label="解锁页标题">
          <input value={site.unlockTitle} onChange={(event) => updateSite({ unlockTitle: event.target.value })} />
        </Field>
      </div>
      <Field label="解锁页提示">
        <textarea value={site.unlockHint} onChange={(event) => updateSite({ unlockHint: event.target.value })} />
      </Field>
      <div className="admin-grid two">
        <Field label="首屏小标题">
          <input value={hero.eyebrow} onChange={(event) => updateHero({ eyebrow: event.target.value })} />
        </Field>
        <Field label="首屏标题">
          <input value={hero.title} onChange={(event) => updateHero({ title: event.target.value })} />
        </Field>
      </div>
      <Field label="首屏文案">
        <textarea value={hero.subtitle} onChange={(event) => updateHero({ subtitle: event.target.value })} />
      </Field>
      <div className="admin-grid two">
        <Field label="主按钮文字">
          <input value={hero.primaryAction} onChange={(event) => updateHero({ primaryAction: event.target.value })} />
        </Field>
        <Field label="副按钮文字">
          <input value={hero.secondaryAction} onChange={(event) => updateHero({ secondaryAction: event.target.value })} />
        </Field>
      </div>
    </section>
  );
}

function AnniversariesEditor({ content, setContent }) {
  function update(index, patch) {
    setContent((current) => ({
      ...current,
      anniversaries: updateAt(current.anniversaries, index, patch)
    }));
  }

  function add() {
    setContent((current) => ({
      ...current,
      anniversaries: [
        ...current.anniversaries,
        { id: makeId("anniversary"), title: "新的纪念日", date: current.site.anniversary, kind: "count-up" }
      ]
    }));
  }

  function remove(index) {
    setContent((current) => ({
      ...current,
      anniversaries: current.anniversaries.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function moveItem(index, direction) {
    setContent((current) => ({
      ...current,
      anniversaries: move(current.anniversaries, index, direction)
    }));
  }

  return (
    <section className="admin-section">
      <div className="admin-section-heading">
        <h2>纪念日</h2>
        <ArrayToolbar onAdd={add} />
      </div>
      {content.anniversaries.map((item, index) => (
        <article className="editor-card" key={item.id}>
          <RowActions index={index} count={content.anniversaries.length} onMove={moveItem} onRemove={remove} />
          <div className="admin-grid three">
            <Field label="名称">
              <input value={item.title} onChange={(event) => update(index, { title: event.target.value })} />
            </Field>
            <Field label="日期">
              <input type="date" value={item.date} onChange={(event) => update(index, { date: event.target.value })} />
            </Field>
            <Field label="计数方式">
              <select value={item.kind} onChange={(event) => update(index, { kind: event.target.value })}>
                <option value="count-up">已经过去</option>
                <option value="count-down">距离还有</option>
              </select>
            </Field>
          </div>
        </article>
      ))}
    </section>
  );
}

function TimelineEditor({ content, setContent }) {
  function update(index, patch) {
    setContent((current) => ({ ...current, timeline: updateAt(current.timeline, index, patch) }));
  }

  function add() {
    setContent((current) => ({
      ...current,
      timeline: [...current.timeline, { id: makeId("timeline"), date: "", title: "新的回忆", text: "" }]
    }));
  }

  function remove(index) {
    setContent((current) => ({ ...current, timeline: current.timeline.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function moveItem(index, direction) {
    setContent((current) => ({ ...current, timeline: move(current.timeline, index, direction) }));
  }

  return (
    <section className="admin-section">
      <div className="admin-section-heading">
        <h2>记忆时间线</h2>
        <ArrayToolbar onAdd={add} />
      </div>
      {content.timeline.map((item, index) => (
        <article className="editor-card" key={item.id}>
          <RowActions index={index} count={content.timeline.length} onMove={moveItem} onRemove={remove} />
          <div className="admin-grid two">
            <Field label="日期">
              <input type="date" value={item.date} onChange={(event) => update(index, { date: event.target.value })} />
            </Field>
            <Field label="标题">
              <input value={item.title} onChange={(event) => update(index, { title: event.target.value })} />
            </Field>
          </div>
          <Field label="故事">
            <textarea value={item.text} onChange={(event) => update(index, { text: event.target.value })} />
          </Field>
        </article>
      ))}
    </section>
  );
}

function GalleryEditor({ content, setContent }) {
  function update(index, patch) {
    setContent((current) => ({ ...current, gallery: updateAt(current.gallery, index, patch) }));
  }

  function add() {
    setContent((current) => ({
      ...current,
      gallery: [
        ...current.gallery,
        { id: makeId("gallery"), title: "新的照片", caption: "", date: "", url: "/assets/gallery-placeholder-1.svg" }
      ]
    }));
  }

  function remove(index) {
    setContent((current) => ({ ...current, gallery: current.gallery.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function moveItem(index, direction) {
    setContent((current) => ({ ...current, gallery: move(current.gallery, index, direction) }));
  }

  return (
    <section className="admin-section">
      <div className="admin-section-heading">
        <h2>照片相册</h2>
        <ArrayToolbar onAdd={add} />
      </div>
      {content.gallery.map((item, index) => (
        <article className="editor-card media-editor" key={item.id}>
          <RowActions index={index} count={content.gallery.length} onMove={moveItem} onRemove={remove} />
          <img src={item.url} alt={item.title} />
          <div>
            <div className="admin-grid two">
              <Field label="标题">
                <input value={item.title} onChange={(event) => update(index, { title: event.target.value })} />
              </Field>
              <Field label="日期">
                <input type="date" value={item.date} onChange={(event) => update(index, { date: event.target.value })} />
              </Field>
            </div>
            <Field label="说明">
              <textarea value={item.caption} onChange={(event) => update(index, { caption: event.target.value })} />
            </Field>
            <div className="inline-actions">
              <Field label="图片地址">
                <input value={item.url} onChange={(event) => update(index, { url: event.target.value })} />
              </Field>
              <UploadButton accept="image/*" onUploaded={(url) => update(index, { url })} />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function LetterEditor({ content, setContent }) {
  function update(patch) {
    setContent((current) => ({ ...current, letter: { ...current.letter, ...patch } }));
  }

  return (
    <section className="admin-section">
      <div className="admin-section-heading">
        <h2>情书房间</h2>
      </div>
      <Field label="标题">
        <input value={content.letter.title} onChange={(event) => update({ title: event.target.value })} />
      </Field>
      <Field label="称呼">
        <input value={content.letter.greeting} onChange={(event) => update({ greeting: event.target.value })} />
      </Field>
      <Field label="正文">
        <textarea rows={7} value={content.letter.body} onChange={(event) => update({ body: event.target.value })} />
      </Field>
      <Field label="署名">
        <input value={content.letter.signature} onChange={(event) => update({ signature: event.target.value })} />
      </Field>
    </section>
  );
}

function WishesEditor({ content, setContent }) {
  function update(index, patch) {
    setContent((current) => ({ ...current, wishes: updateAt(current.wishes, index, patch) }));
  }

  function add() {
    setContent((current) => ({
      ...current,
      wishes: [...current.wishes, { id: makeId("wish"), title: "新的愿望", text: "", status: "想去" }]
    }));
  }

  function remove(index) {
    setContent((current) => ({ ...current, wishes: current.wishes.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function moveItem(index, direction) {
    setContent((current) => ({ ...current, wishes: move(current.wishes, index, direction) }));
  }

  return (
    <section className="admin-section">
      <div className="admin-section-heading">
        <h2>愿望胶囊</h2>
        <ArrayToolbar onAdd={add} />
      </div>
      {content.wishes.map((item, index) => (
        <article className="editor-card" key={item.id}>
          <RowActions index={index} count={content.wishes.length} onMove={moveItem} onRemove={remove} />
          <div className="admin-grid two">
            <Field label="愿望">
              <input value={item.title} onChange={(event) => update(index, { title: event.target.value })} />
            </Field>
            <Field label="状态">
              <input value={item.status} onChange={(event) => update(index, { status: event.target.value })} />
            </Field>
          </div>
          <Field label="说明">
            <textarea value={item.text} onChange={(event) => update(index, { text: event.target.value })} />
          </Field>
        </article>
      ))}
    </section>
  );
}

function CardsEditor({ content, setContent }) {
  function update(index, patch) {
    setContent((current) => ({ ...current, cards: updateAt(current.cards, index, patch) }));
  }

  function add() {
    setContent((current) => ({
      ...current,
      cards: [...current.cards, { id: makeId("card"), title: "今日小卡片", text: "" }]
    }));
  }

  function remove(index) {
    setContent((current) => ({ ...current, cards: current.cards.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function moveItem(index, direction) {
    setContent((current) => ({ ...current, cards: move(current.cards, index, direction) }));
  }

  return (
    <section className="admin-section">
      <div className="admin-section-heading">
        <h2>每日小卡片</h2>
        <ArrayToolbar onAdd={add} />
      </div>
      {content.cards.map((item, index) => (
        <article className="editor-card" key={item.id}>
          <RowActions index={index} count={content.cards.length} onMove={moveItem} onRemove={remove} />
          <div className="admin-grid two">
            <Field label="标题">
              <input value={item.title} onChange={(event) => update(index, { title: event.target.value })} />
            </Field>
            <Field label="内容">
              <input value={item.text} onChange={(event) => update(index, { text: event.target.value })} />
            </Field>
          </div>
        </article>
      ))}
    </section>
  );
}

function MusicEditor({ content, setContent }) {
  function updateSite(patch) {
    setContent((current) => ({ ...current, site: { ...current.site, ...patch } }));
  }

  return (
    <section className="admin-section">
      <div className="admin-section-heading">
        <h2>音乐入口</h2>
      </div>
      <div className="admin-grid two">
        <Field label="歌名">
          <input value={content.site.musicTitle} onChange={(event) => updateSite({ musicTitle: event.target.value })} />
        </Field>
        <Field label="歌手/备注">
          <input value={content.site.musicArtist} onChange={(event) => updateSite({ musicArtist: event.target.value })} />
        </Field>
      </div>
      <div className="inline-actions">
        <Field label="音乐地址">
          <input value={content.site.musicUrl} onChange={(event) => updateSite({ musicUrl: event.target.value })} />
        </Field>
        <UploadButton accept="audio/*" icon="music" onUploaded={(url) => updateSite({ musicUrl: url })} />
      </div>
    </section>
  );
}

function formatVersionDate(value) {
  if (!value) return "未知";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day} ${byType.hour}:${byType.minute}:${byType.second} +0800`;
}

function VersionChecker() {
  const [checking, setChecking] = useState(false);
  const [version, setVersion] = useState(null);
  const [error, setError] = useState("");

  async function checkVersion() {
    setChecking(true);
    setError("");
    try {
      setVersion(await apiRequest("/api/admin/version"));
    } catch (checkError) {
      setError(`检查失败：${checkError.message}`);
    } finally {
      setChecking(false);
    }
  }

  const display = version?.hasUpdate ? version.latest : version?.current;
  const currentLabel = version?.current?.shortSha || "未知版本";

  return (
    <section className="admin-section version-section">
      <div className="version-toolbar">
        <span className="version-current">v{currentLabel}</span>
        <button className="button primary small-button" type="button" onClick={checkVersion} disabled={checking}>
          <RefreshCw size={16} />
          <span>{checking ? "检查中" : "检查更新"}</span>
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
      {version && (
        <div className={version.hasUpdate ? "version-result update" : "version-result"}>
          <p>{version.hasUpdate ? "发现新版本，可以重新拉取镜像部署。" : "当前已经是最新版本。"}</p>
          <dl>
            <div>
              <dt>{version.hasUpdate ? "最新版本" : "当前版本"}：</dt>
              <dd>{display?.sha || display?.shortSha || "未知"}</dd>
            </div>
            <div>
              <dt>提交信息：</dt>
              <dd>{display?.message || "未知"}</dd>
            </div>
            <div>
              <dt>提交时间：</dt>
              <dd>{formatVersionDate(display?.date)}</dd>
            </div>
          </dl>
          {version.latest?.unavailableReason && (
            <span className="empty-note">暂时无法读取 GitHub 最新版本：{version.latest.unavailableReason}</span>
          )}
        </div>
      )}
    </section>
  );
}

export default function AdminApp() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const importRef = useRef(null);

  function updateContent(nextContent) {
    setDirty(true);
    setContent(nextContent);
  }

  async function load() {
    setLoading(true);
    try {
      const data = await apiRequest("/api/admin/content");
      setContent(data);
      setDirty(false);
    } catch {
      setContent(null);
      setDirty(false);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!content) return;
    setSaving(true);
    setMessage("");
    try {
      const data = await apiRequest("/api/admin/content", {
        method: "PUT",
        body: JSON.stringify(content)
      });
      setContent(data);
      setDirty(false);
      setMessage("已保存。");
    } catch (error) {
      setMessage(`保存失败：${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    if (dirty && !window.confirm("还有未保存内容，确定退出后台吗？")) {
      return;
    }
    await apiRequest("/api/admin/logout", { method: "POST" });
    setContent(null);
    setDirty(false);
  }

  async function importJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const raw = await file.text();
      setContent(normalizeContentDraft(JSON.parse(raw)));
      setDirty(true);
      setMessage("JSON 已导入并完成结构兜底，记得点击保存。");
    } catch (error) {
      setMessage(`导入失败：${error.message}`);
    } finally {
      event.target.value = "";
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!dirty) return undefined;

    function warnBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);

  if (loading) {
    return <main className="loading-page">正在进入后台...</main>;
  }

  if (!content) {
    return <Login onLogin={load} />;
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <span className="eyebrow">Content Studio</span>
          <div className="admin-title-row">
            <h1>Jshaorii Love Site 后台</h1>
            <span className={dirty ? "save-state dirty" : "save-state"}>
              {dirty ? "有未保存修改" : "已同步"}
            </span>
          </div>
        </div>
        <div className="admin-header-actions">
          <a className="button secondary small-button" href="/">
            <Heart size={16} />
            <span>查看网站</span>
          </a>
          <button className="button primary small-button" onClick={save} disabled={saving || !dirty}>
            <Save size={16} />
            <span>{saving ? "保存中" : "保存"}</span>
          </button>
          <button className="icon-button" onClick={logout} aria-label="退出后台">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {message && <p className="admin-message">{message}</p>}

      <VersionChecker />

      <section className="admin-section import-export">
        <div>
          <h2>JSON 导入导出</h2>
          <p>适合备份、迁移 NAS，或批量编辑内容。</p>
        </div>
        <div className="admin-header-actions">
          <input hidden ref={importRef} type="file" accept="application/json" onChange={importJson} />
          <button className="button secondary small-button" onClick={() => importRef.current?.click()}>
            <Upload size={16} />
            <span>导入</span>
          </button>
          <button className="button secondary small-button" onClick={() => downloadJson("jshaorii-love-content.json", content)}>
            <Download size={16} />
            <span>导出</span>
          </button>
        </div>
      </section>

      <SiteEditor content={content} setContent={updateContent} />
      <AnniversariesEditor content={content} setContent={updateContent} />
      <TimelineEditor content={content} setContent={updateContent} />
      <GalleryEditor content={content} setContent={updateContent} />
      <LetterEditor content={content} setContent={updateContent} />
      <WishesEditor content={content} setContent={updateContent} />
      <CardsEditor content={content} setContent={updateContent} />
      <MusicEditor content={content} setContent={updateContent} />
    </main>
  );
}
