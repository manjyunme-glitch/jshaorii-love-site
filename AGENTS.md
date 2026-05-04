# 项目说明

## 本机约定

- 当前项目路径：`E:\jshaorii-love-site`。
- 当前环境是 Windows + PowerShell。
- 使用 Docker 时必须显式调用真实 Docker CLI：
  `& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" ...`
- 不要使用裸 `docker` 命令。本机的 `C:\Windows\System32\docker` 是 0 字节影子文件，可能会优先截获命令。
- 不要主动为 Docker 命令请求 escalated/sandbox 权限；Codex desktop 已经有完整主机访问权限。只有命令明确因为权限失败时再处理权限问题。

## 项目定位

- 这是一个为 `Jshaorii` 准备的私密情侣网站。
- 网站包含公开访问页、入口口令、内容后台、图片/音乐上传、JSON 内容备份和 Docker 部署配置。
- 公开页默认需要输入入口口令后才能访问完整内容。
- 后台路径是 `/981126`，用于编辑内容、上传媒体、导入导出 JSON。

## 技术栈

- 前端：React 18、Vite、lucide-react 图标。
- 后端：Node.js ESM、Express、cookie-parser、multer。
- 构建工具：Vite 6。
- 本地开发辅助：concurrently 同时运行 Vite 和 Node 服务。
- 容器运行时：Node 22 Alpine，多阶段 Docker 构建。

## 关键目录和文件

- `src/main.jsx`：React 入口，挂载 `App`。
- `src/App.jsx`：根据路径判断展示公开站点或后台。`/981126` 进入后台，其余路径进入公开站点。
- `src/components/PublicSite.jsx`：公开站点 UI，包括解锁页、首屏、纪念日、时间线、相册、情书、愿望、每日卡片、音乐条。
- `src/components/AdminApp.jsx`：后台 UI，包括登录、内容编辑、数组增删排序、图片/音乐上传、JSON 导入导出。
- `src/lib/api.js`：统一封装 `fetch`，默认带 `credentials: "include"`，支持 JSON 和 FormData。
- `src/styles.css`：全局样式、响应式布局、动画、字体和主题变量。
- `server/index.js`：Express 服务端、鉴权、内容读写、上传、静态文件托管。
- `server/defaultContent.js`：内容默认值和初始结构。
- `data/content.json`：当前实际内容数据。
- `data/uploads/`：上传图片和音乐的持久化目录，仓库只保留 `.gitkeep`。
- `public/assets/`：相册占位 SVG。
- `public/fonts/`：本地中文字体 `ZCOOLKuaiLe-Regular.ttf` 及授权文本。
- `Dockerfile`：先构建前端，再复制 `dist` 和 `server` 到生产镜像。
- `docker-compose.yml`：单服务部署，映射 `1314:1314`，挂载 `./data:/app/data`。

## 常用命令

- 安装依赖：`npm install`
- 本地开发：`npm run dev`
  - Vite 端口：`5173`
  - API 和上传代理到：`http://localhost:1314`
- 生产构建：`npm run build`
- 生产启动：`npm start`
- 预览构建产物：`npm run preview`
- Docker 部署：
  `& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" compose up -d --build`

## 默认访问方式

- 生产网站：`http://localhost:1314`
- 后台：`http://localhost:1314/981126`
- 默认公开入口口令：`991122`
- 默认后台密码：`981126`

## 环境变量

- `PORT`：服务监听端口，默认 `1314`。
- `DATA_DIR`：内容和上传文件目录。本地默认是项目内 `data`，Docker 默认是 `/app/data`。
- `PUBLIC_UNLOCK_CODE`：公开站点入口口令，默认 `991122`。
- `ADMIN_PASSWORD`：后台密码，默认 `981126`。
- `SESSION_SECRET`：Cookie HMAC 签名密钥，生产必须改成较长随机值。
- `COOKIE_SECURE`：是否设置 Secure Cookie，默认 `false`。如果只通过 HTTPS 域名访问，可以设为 `true`。

## 服务端行为

- 服务启动时会确保 `DATA_DIR/uploads` 存在。
- 如果 `DATA_DIR/content.json` 不存在，会用 `server/defaultContent.js` 写入初始内容。
- 内容写入会先写临时文件，再 rename 到 `content.json`，降低写坏文件的风险。
- 上传限制为单文件 25 MB。
- 上传支持类型：
  - 图片：`image/jpeg`、`image/png`、`image/webp`、`image/gif`、`image/svg+xml`
  - 音频：`audio/mpeg`、`audio/mp4`、`audio/ogg`、`audio/wav`、`audio/webm`
- 上传文件会按时间戳和随机字节重命名，公开路径形如 `/uploads/<filename>`。
- 生产启动前必须已有 `dist`，否则根路径会返回 `frontend_not_built`。

## API 概览

- `GET /api/health`：健康检查。
- `POST /api/unlock`：提交公开入口口令，成功后写入 `love_unlock` Cookie。
- `POST /api/lock`：清除公开解锁 Cookie。
- `GET /api/public/meta`：未解锁也可读取的解锁页元信息。
- `GET /api/public/content`：读取公开完整内容，需要 `love_unlock` Cookie。
- `POST /api/admin/login`：后台登录，成功后写入 `love_admin` Cookie。
- `POST /api/admin/logout`：清除后台 Cookie。
- `GET /api/admin/content`：后台读取完整内容，需要 `love_admin` Cookie。
- `PUT /api/admin/content`：后台保存完整内容，需要 `love_admin` Cookie。
- `POST /api/admin/upload`：后台上传图片或音频，需要 `love_admin` Cookie。

## 内容数据结构

`content.json` 的顶层结构：

- `site`：姓名、纪念日、解锁页文案、音乐标题/作者/地址。
- `hero`：公开页首屏文案和按钮文字。
- `anniversaries`：纪念日列表，`kind` 只能是 `count-up` 或 `count-down`。
- `timeline`：回忆时间线。
- `gallery`：相册列表，图片地址可以是 `/assets/...` 或 `/uploads/...`。
- `letter`：情书标题、称呼、正文和署名。
- `wishes`：愿望列表。
- `cards`：每日小卡片，公开页会按日期轮换展示。

服务端会用 `normalizeContent` 对传入内容做兜底和结构规范化。新增字段如果没有在 `normalizeContent` 中保留，保存后可能会丢失。

## 前端注意事项

- 公开站点通过 `PublicSite` 首次请求 `/api/public/content` 判断是否已解锁。
- 未解锁时会退回 `UnlockScreen`，并尝试读取 `/api/public/meta`。
- 纪念日计算使用 `+08:00` 时区构造日期。
- `todayCard` 基于 `Date.now() / 86400000` 按天轮换每日卡片。
- 后台编辑内容只更新前端状态，必须点击“保存”才会写入 `data/content.json`。
- JSON 导入只是导入到状态，也必须点击“保存”才会落盘。
- 上传按钮会立即上传文件，并把返回的 `/uploads/...` 地址写到当前编辑项。

## 样式和设计信息

- 页面整体是柔和、私密、情侣主题。
- 使用本地字体 `ZCOOL KuaiLe Local` 作为可爱标题字体。
- 主要主题变量在 `src/styles.css` 的 `:root` 中。
- 公开页有花瓣飘落动画、首屏照片卡、纪念日统计、时间线、相册、情书纸、愿望区和音乐条。
- 响应式断点主要是 `860px` 和 `600px`。
- 有 `prefers-reduced-motion` 兜底，会减少动画。

## Git 和生成物约定

- `node_modules/`、`dist/`、日志、浏览器临时 profile、截图和测试产物不应提交。
- `data/uploads/*` 不提交，保留 `data/uploads/.gitkeep`。
- `data/content.json` 当前在仓库中，是项目默认/当前内容数据。
- `.gitattributes` 指定文本自动 LF，常见图片和字体为 binary。

## 修改建议

- 改内容模型时，需要同步检查：
  - `server/defaultContent.js`
  - `server/index.js` 的 `normalizeContent`
  - `src/components/PublicSite.jsx`
  - `src/components/AdminApp.jsx`
  - `data/content.json`
- 改鉴权或 Cookie 时，需要同时考虑公开解锁 Cookie `love_unlock` 和后台 Cookie `love_admin`。
- 改上传能力时，需要同时修改 multer `fileFilter`、前端 `accept` 和必要的展示逻辑。
- 改 Docker 配置时，先检查 `docker-compose.yml` 中的环境变量和 `./data:/app/data` 挂载是否仍然正确。
