import cookieParser from "cookie-parser";
import { execFile } from "node:child_process";
import crypto from "node:crypto";
import express from "express";
import fs from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import multer from "multer";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { defaultContent } from "./defaultContent.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const PORT = Number(process.env.PORT || 1314);
const DATA_DIR = process.env.DATA_DIR || path.join(rootDir, "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const SESSION_SECRET =
  process.env.SESSION_SECRET || "dev-secret-change-this-before-sharing";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "981126";
const PUBLIC_UNLOCK_CODE = process.env.PUBLIC_UNLOCK_CODE || "991122";
const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";
const APP_REPOSITORY = process.env.APP_REPOSITORY || "";
const APP_BRANCH = process.env.APP_BRANCH || "main";
const APP_VERSION = process.env.APP_VERSION || "";
const APP_COMMIT_MESSAGE = process.env.APP_COMMIT_MESSAGE || "";
const APP_COMMIT_DATE = process.env.APP_COMMIT_DATE || "";

const execFileAsync = promisify(execFile);

const app = express();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureStorage() {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

function text(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function list(value, fallback = []) {
  return Array.isArray(value) ? value : fallback;
}

function id(value, fallback) {
  return text(value, fallback || crypto.randomUUID()).trim() || crypto.randomUUID();
}

function normalizeContent(input = {}) {
  const base = clone(defaultContent);
  return {
    site: {
      ...base.site,
      ...(input.site || {}),
      loverName: text(input.site?.loverName, base.site.loverName),
      ownerName: text(input.site?.ownerName, base.site.ownerName),
      anniversary: text(input.site?.anniversary, base.site.anniversary),
      unlockTitle: text(input.site?.unlockTitle, base.site.unlockTitle),
      unlockHint: text(input.site?.unlockHint, base.site.unlockHint),
      musicTitle: text(input.site?.musicTitle, base.site.musicTitle),
      musicArtist: text(input.site?.musicArtist, base.site.musicArtist),
      musicUrl: text(input.site?.musicUrl, base.site.musicUrl)
    },
    hero: {
      ...base.hero,
      ...(input.hero || {}),
      eyebrow: text(input.hero?.eyebrow, base.hero.eyebrow),
      title: text(input.hero?.title, base.hero.title),
      subtitle: text(input.hero?.subtitle, base.hero.subtitle),
      primaryAction: text(input.hero?.primaryAction, base.hero.primaryAction),
      secondaryAction: text(input.hero?.secondaryAction, base.hero.secondaryAction)
    },
    anniversaries: list(input.anniversaries, base.anniversaries).map((item, index) => ({
      id: id(item?.id, `anniversary-${index + 1}`),
      title: text(item?.title, "新的纪念日"),
      date: text(item?.date, base.site.anniversary),
      kind: ["count-up", "count-down"].includes(item?.kind) ? item.kind : "count-up"
    })),
    timeline: list(input.timeline, base.timeline).map((item, index) => ({
      id: id(item?.id, `timeline-${index + 1}`),
      date: text(item?.date, ""),
      title: text(item?.title, "新的回忆"),
      text: text(item?.text, "")
    })),
    gallery: list(input.gallery, base.gallery).map((item, index) => ({
      id: id(item?.id, `gallery-${index + 1}`),
      title: text(item?.title, "新的照片"),
      caption: text(item?.caption, ""),
      date: text(item?.date, ""),
      url: text(item?.url, "/assets/gallery-placeholder-1.svg")
    })),
    letter: {
      ...base.letter,
      ...(input.letter || {}),
      title: text(input.letter?.title, base.letter.title),
      greeting: text(input.letter?.greeting, base.letter.greeting),
      body: text(input.letter?.body, base.letter.body),
      signature: text(input.letter?.signature, base.letter.signature)
    },
    wishes: list(input.wishes, base.wishes).map((item, index) => ({
      id: id(item?.id, `wish-${index + 1}`),
      title: text(item?.title, "新的愿望"),
      text: text(item?.text, ""),
      status: text(item?.status, "想去")
    })),
    cards: list(input.cards, base.cards).map((item, index) => ({
      id: id(item?.id, `card-${index + 1}`),
      title: text(item?.title, "今日小卡片"),
      text: text(item?.text, "")
    }))
  };
}

async function readContent() {
  ensureStorage();
  if (!existsSync(CONTENT_FILE)) {
    await writeContent(defaultContent);
  }

  const raw = await fs.readFile(CONTENT_FILE, "utf8");
  return normalizeContent(JSON.parse(raw));
}

async function writeContent(content) {
  ensureStorage();
  const normalized = normalizeContent(content);
  const tmpFile = `${CONTENT_FILE}.${Date.now()}.tmp`;
  await fs.writeFile(tmpFile, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  await fs.rename(tmpFile, CONTENT_FILE);
  return normalized;
}

function hmac(value) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

function tokenFor(scope) {
  return `${scope}.${hmac(scope)}`;
}

function timingSafeStringEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyToken(token, scope) {
  return timingSafeStringEqual(token, tokenFor(scope));
}

function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: COOKIE_SECURE,
    maxAge
  };
}

async function gitValue(args) {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd: rootDir, timeout: 3000 });
    return stdout.trim();
  } catch {
    return "";
  }
}

function repositoryFromRemote(remote) {
  const match = String(remote).match(/github\.com[:/](?<owner>[^/]+)\/(?<repo>[^/.]+)(?:\.git)?$/i);
  return match?.groups ? `${match.groups.owner}/${match.groups.repo}` : "";
}

async function currentVersionInfo() {
  const sha = APP_VERSION || (await gitValue(["rev-parse", "HEAD"]));
  const remote = await gitValue(["remote", "get-url", "origin"]);
  const repository = APP_REPOSITORY || repositoryFromRemote(remote);
  const githubInfo =
    sha && repository && (!APP_COMMIT_MESSAGE || !APP_COMMIT_DATE)
      ? await githubCommitInfo(repository, sha)
      : {};
  return {
    sha,
    shortSha: sha ? sha.slice(0, 7) : "",
    message: APP_COMMIT_MESSAGE || githubInfo.message || (sha ? await gitValue(["log", "-1", "--pretty=%s"]) : ""),
    date: APP_COMMIT_DATE || githubInfo.date || (sha ? await gitValue(["log", "-1", "--pretty=%cI"]) : "")
  };
}

async function latestVersionInfo() {
  const remote = await gitValue(["remote", "get-url", "origin"]);
  const repository = APP_REPOSITORY || repositoryFromRemote(remote);
  if (!repository) {
    return { unavailableReason: "repository_not_configured" };
  }

  const latest = await githubCommitInfo(repository, APP_BRANCH);
  return { repository, branch: APP_BRANCH, ...latest };
}

async function githubCommitInfo(repository, ref) {
  const response = await fetch(`https://api.github.com/repos/${repository}/commits/${ref}`, {
    headers: {
      "Accept": "application/vnd.github+json",
      "User-Agent": "jshaorii-love-site"
    }
  });

  if (!response.ok) {
    return { unavailableReason: `github_${response.status}` };
  }

  const data = await response.json();
  const sha = text(data.sha);
  return {
    sha,
    shortSha: sha ? sha.slice(0, 7) : "",
    message: text(data.commit?.message).split("\n")[0],
    date: text(data.commit?.committer?.date || data.commit?.author?.date)
  };
}

function requireUnlocked(req, res, next) {
  if (verifyToken(req.cookies.love_unlock, "unlocked")) {
    next();
    return;
  }
  res.status(401).json({ error: "unlock_required" });
}

function requireAdmin(req, res, next) {
  if (verifyToken(req.cookies.love_admin, "admin")) {
    next();
    return;
  }
  res.status(401).json({ error: "admin_login_required" });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeExt = ext && ext.length <= 8 ? ext : "";
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${safeExt}`);
    }
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "audio/mpeg",
      "audio/mp4",
      "audio/ogg",
      "audio/wav",
      "audio/webm"
    ]);
    cb(null, allowed.has(file.mimetype));
  }
});

ensureStorage();

app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "1d" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, port: PORT });
});

app.post("/api/unlock", (req, res) => {
  const code = text(req.body?.code).trim();
  if (!timingSafeStringEqual(code, PUBLIC_UNLOCK_CODE)) {
    res.status(401).json({ error: "invalid_code" });
    return;
  }
  res.cookie("love_unlock", tokenFor("unlocked"), cookieOptions(1000 * 60 * 60 * 24 * 90));
  res.json({ ok: true });
});

app.post("/api/lock", (_req, res) => {
  res.clearCookie("love_unlock");
  res.json({ ok: true });
});

app.get("/api/public/meta", async (_req, res, next) => {
  try {
    const content = await readContent();
    res.json({
      loverName: content.site.loverName,
      unlockTitle: content.site.unlockTitle,
      unlockHint: content.site.unlockHint
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/public/content", requireUnlocked, async (_req, res, next) => {
  try {
    res.json(await readContent());
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/login", (req, res) => {
  const password = text(req.body?.password);
  if (!timingSafeStringEqual(password, ADMIN_PASSWORD)) {
    res.status(401).json({ error: "invalid_password" });
    return;
  }
  res.cookie("love_admin", tokenFor("admin"), cookieOptions(1000 * 60 * 60 * 12));
  res.json({ ok: true });
});

app.post("/api/admin/logout", (_req, res) => {
  res.clearCookie("love_admin");
  res.json({ ok: true });
});

app.get("/api/admin/content", requireAdmin, async (_req, res, next) => {
  try {
    res.json(await readContent());
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/version", requireAdmin, async (_req, res, next) => {
  try {
    const [current, latest] = await Promise.all([currentVersionInfo(), latestVersionInfo()]);
    const hasUpdate = Boolean(current.sha && latest.sha && current.sha !== latest.sha);
    res.json({ current, latest, hasUpdate });
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/content", requireAdmin, async (req, res, next) => {
  try {
    res.json(await writeContent(req.body));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/upload", requireAdmin, upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "unsupported_or_missing_file" });
    return;
  }
  res.json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size
  });
});

const distDir = path.join(rootDir, "dist");
if (existsSync(distDir)) {
  app.use(express.static(distDir, { maxAge: "1h" }));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
} else {
  app.get("*", (_req, res) => {
    res.status(404).json({
      error: "frontend_not_built",
      hint: "Run npm run build, then npm start."
    });
  });
}

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    res.status(400).json({ error: error.code });
    return;
  }
  res.status(500).json({ error: "server_error", message: error.message });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Jshaorii Love Site listening on http://0.0.0.0:${PORT}`);
});
