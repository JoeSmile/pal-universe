# Pal Universe — 你需要做的事情

> 这些是必须由你在本机或云服务器上手动操作的步骤。
> Cursor 和 Hermes 无法替你完成。

---

## □ 1. 注册域名（今天）

```
目标: paluniverse.cn
渠道: 阿里云 / 腾讯云 / GoDaddy
成本: ~¥30/年
操作: 搜索可用 → 购买 → 实名认证
```

然后立刻提交 ICP 备案。备案审批 1-3 周，等得起。

---

## □ 2. 购买云服务器

```
推荐: 腾讯云 Lighthouse
配置: 2 vCPU / 2GB RAM / 60GB SSD / 5Mbps
成本: ¥40/月
镜像: Ubuntu 22.04
```

买完后把域名解析到服务器 IP。

---

## □ 3. 登录服务器部署

```bash
ssh root@<服务器IP>

# 拉取部署脚本
curl -fsSL https://raw.githubusercontent.com/JoeSmile/pal-universe/main/infra/setup.sh -o setup.sh
bash setup.sh paluniverse.cn
```

脚本会自动完成：
- 安装 Docker + 配置国内镜像源
- 申请 SSL 证书
- git clone 项目代码
- 启动所有服务

---

## □ 4. 配置 AI Chat API Key

```bash
ssh root@<服务器IP>
vi /opt/pal-universe/backend/.env.production
```

把 `OPENAI_API_KEY` 改成你的 DeepSeek API Key。

```ini
OPENAI_API_KEY=sk-your-deepseek-key-here
DEFAULT_LLM_MODEL=deepseek-ai/deepseek-v4-flash
```

保存后重启：

```bash
cd /opt/pal-universe/infra
docker compose -f docker-compose.prod.yml restart backend
```

---

## □ 5. 开 Cursor 做开发任务

```
打开 cursor
→ 加载 pal-universe 项目
→ Cursor 自动检测 .specify/tasks/ 下的 task
→ 从 005-home-search 开始执行
→ 完成后会自动 git commit 并更新 task 状态
→ 告诉我一声，我继续验证
```

---

## □ 6. 跑图片下载脚本（你本机）

```bash
cd ~/Desktop/github/pal-universe
python3 scripts/download_images.py
```

下载 299 张帕鲁图标到 `frontend/public/images/pals/`。

---

## □ 7. GitHub Token（给 CI 用）

如果 CI 要从国内服务器拉代码，需要在 GitHub 配一个 Access Token：

```
GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
→ 生成 token → 勾选 repo 权限
→ 在服务器上配:
  git remote set-url origin https://<token>@github.com/JoeSmile/pal-universe.git
```

---

## □ 8. 当服务器需要更新时

```bash
ssh root@<服务器IP>
cd /opt/pal-universe
git pull
cd infra
docker compose -f docker-compose.prod.yml up -d --build
```

或者优化后给 `Makefile` 加一行 `make deploy`：

```bash
git push && ssh root@<IP> "cd /opt/pal-universe && git pull && cd infra && docker compose -f docker-compose.prod.yml up -d --build"
```

---

## 优先级排序

```
今天就能做的:
  □ 注册域名 + 提交备案
  □ 开 Cursor 执行 005-home-search

本周内:
  □ 买云服务器
  □ 部署 setup.sh
  □ 配 AI Chat API Key

不着急:
  □ 跑图片下载脚本
  □ GitHub Token
  □ 看服务器运行状态
```
