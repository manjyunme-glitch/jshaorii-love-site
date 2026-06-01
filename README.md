# Jshaorii Love Site

一个为 Jshaorii 准备的私密情侣网站。项目包含公开站点、入口口令、内容后台、图片/音乐上传、JSON 备份，以及 Docker 部署配置。

## 最新版本记录

完整记录见 [VERSION_HISTORY.md](VERSION_HISTORY.md)。这里只保留最近三条实质性版本记录。

### v0.4.1 - 2026-06-01 - 维护体验与界面完善

- 修正公开页纪念日和每日卡片的北京时间换日逻辑。
- 后台新增未保存提示、JSON 导入兜底和上传失败提示。
- 优化公开页/后台视觉细节，并修复 `express` 依赖链 audit 风险。

## 本地运行

```bash
npm install
npm run dev
```

开发访问：

- 网站：`http://localhost:5173`
- 后台：`http://localhost:5173/981126`
- 默认入口口令：`991122`
- 默认后台密码：`981126`

生产模式：

```bash
npm run build
npm start
```

生产访问：

- 网站：`http://localhost:1314`
- 后台：`http://localhost:1314/981126`

## 两台电脑维护流程

第一次在新电脑上拉取：

```bash
git clone https://github.com/manjyunme-glitch/jshaorii-love-site.git
cd jshaorii-love-site
npm install
```

每次开始修改前：

```bash
git status -sb
git pull --ff-only
```

每次完成修改后：

```bash
npm run build
git status -sb
git add <changed-files>
git commit -m "描述这次修改"
git push
```

另一台电脑继续维护前，再执行 `git pull --ff-only`。如果两台电脑都改了 `data/content.json`，可能会出现冲突；推荐先在后台导出 JSON 备份，确认内容后再合并。

## 内容和上传文件

- `data/content.json` 当前提交在仓库中，用作默认/当前内容数据。
- `data/uploads/` 不提交到 Git，只保留 `.gitkeep`。
- 后台上传的图片和音乐会写入运行环境的 `data/uploads/`，换电脑或换 NAS 时需要单独迁移上传文件。
- `.env`、`.codex/`、`node_modules/`、`dist/` 不提交。

## NAS / Docker 部署

先修改 `docker-compose.yml` 里的 `ADMIN_PASSWORD`、`SESSION_SECRET`，再运行：

```bash
docker compose up -d --build
```

容器会监听 `1314`，Cloudflare Tunnel 指向：

```text
http://localhost:1314
```

持久化数据在：

- `data/content.json`
- `data/uploads/`

## 常用配置

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `PORT` | 服务监听端口 | `1314` |
| `DATA_DIR` | 内容和上传文件目录 | `/app/data` |
| `PUBLIC_UNLOCK_CODE` | 网站入口口令 | `991122` |
| `ADMIN_PASSWORD` | 后台密码 | `981126` |
| `SESSION_SECRET` | 登录 Cookie 签名密钥 | `change-me-long-random` |
| `COOKIE_SECURE` | 是否设置 Secure Cookie | `false` |
| `APP_REPOSITORY` | GitHub 仓库名，用于后台检查版本 | 自动从 Git remote 推断 |
| `APP_BRANCH` | 用于检查更新的分支 | `main` |

如果只通过 Cloudflare HTTPS 域名访问，可以把 `COOKIE_SECURE` 改成 `true`。生产环境必须把默认口令、后台密码和 `SESSION_SECRET` 改掉。
