#!/bin/bash
# ============================================================
# Pal Universe — 国内一键部署脚本
# 用法: curl -fsSL https://raw.githubusercontent.com/.../setup.sh | bash
# 或:  ssh root@<ip> 'bash -s' < setup.sh
# ============================================================
set -euo pipefail

DOMAIN="${1:-paluniverse.cn}"
echo "🚀 Pal Universe 国内部署脚本"
echo "   域名: $DOMAIN"
echo ""

# ─── 1. 系统依赖 ────────────────────────────────
echo "📦 安装系统依赖..."
apt-get update -qq
apt-get install -y -qq docker.io docker-compose-v2 nginx certbot python3-certbot-nginx curl

# Docker 镜像源（国内加速）
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://mirror.ccs.tencentyun.com",
    "https://registry.cn-hangzhou.aliyuncs.com"
  ]
}
EOF
systemctl restart docker

# ─── 2. 防火墙 ──────────────────────────────────
echo "🔥 配置防火墙..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ─── 3. SSL 证书（Let's Encrypt）───────────────
echo "🔐 申请 SSL 证书..."
certbot certonly --nginx \
    --non-interactive \
    --agree-tos \
    --email admin@$DOMAIN \
    -d $DOMAIN -d www.$DOMAIN || {
    echo "⚠️  证书申请失败，请确保域名已解析到本机 IP"
    echo "   可稍后手动运行: certbot --nginx -d $DOMAIN"
}

# ─── 4. 克隆项目 ────────────────────────────────
echo "📂 拉取项目代码..."
if [ ! -d /opt/pal-universe ]; then
    git clone https://github.com/JoeSmile/pal-universe.git /opt/pal-universe
fi
cd /opt/pal-universe

# ─── 5. 环境变量 ───────────────────────────────
echo "📝 配置环境变量..."
cat > /opt/pal-universe/backend/.env.production << ENVEOF
POSTGRES_USER=paluniverse
POSTGRES_PASSWORD=$(openssl rand -base64 24)
POSTGRES_DB=paluniverse
POSTGRES_HOST=db
POSTGRES_PORT=5432
APP_ENV=production
DEBUG=false
OPENAI_API_KEY=${OPENAI_API_KEY:-your-deepseek-key}
DEFAULT_LLM_MODEL=deepseek-ai/deepseek-v4-flash
LANGFUSE_TRACING_ENABLED=false
ENVEOF
echo "   ✅ .env.production 已生成"
echo "   ⚠️  请编辑 OPENAI_API_KEY: vi backend/.env.production"

# ─── 6. SSL 证书链接（Nginx 容器用）────────────
echo "🔗 同步 SSL 证书到 infra/ssl..."
mkdir -p /opt/pal-universe/infra/ssl
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/pal-universe/infra/ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem  /opt/pal-universe/infra/ssl/

# ─── 7. 下载图片 ───────────────────────────────────
echo "🖼️  下载帕鲁图片..."
cd /opt/pal-universe
python3 scripts/download_images.py
# UI 元素/工作适性小图标已入库：frontend/public/images/ui/

# ─── 8. 启动 ────────────────────────────────────
echo "🐳 启动 Docker 服务..."
cd /opt/pal-universe/infra
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "🎉 部署完成！"
echo "   访问: https://$DOMAIN"
echo "   日志: docker compose -f infra/docker-compose.prod.yml logs -f"
echo "   更新: cd /opt/pal-universe && git pull && docker compose -f infra/docker-compose.prod.yml up -d --build"
