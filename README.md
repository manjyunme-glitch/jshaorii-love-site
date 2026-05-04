# Jshaorii Love Site

一个为 Jshaorii 准备的私密情侣网站。包含公开站点、入口口令、内容后台、图片/音乐上传、JSON 备份，以及 Docker 部署配置。

## 本地运行

```bash
npm install
npm run build
npm start
```

访问：

- 网站：`http://localhost:1314`
- 后台：`http://localhost:1314/981126`
- 默认入口口令：`991122`
- 默认后台密码：`981126`

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

如果只通过 Cloudflare HTTPS 域名访问，可以把 `COOKIE_SECURE` 改成 `true`。
