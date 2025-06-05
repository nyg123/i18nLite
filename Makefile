# I18nLite Makefile
# 用于快速管理 Docker Compose 项目

.PHONY: help build run stop clean restart logs rebuild dev down up

# 默认目标
.DEFAULT_GOAL := help

# 帮助信息
help: ## 显示帮助信息
	@echo "I18nLite 项目管理命令:"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# 构建镜像
build: ## 构建所有镜像
	docker-compose build

# 重新构建并运行 (推荐的开发命令)
run: ## 停止现有容器，重新构建并启动所有服务
	docker-compose down
	docker-compose up --build -d
	@echo "✅ 服务已启动:"
	@echo "   - 前端: http://localhost:3000"
	@echo "   - API:  http://localhost:8000"
	@echo "   - MySQL: localhost:3306"

# 快速重建后端服务
rebuild: ## 仅重新构建并重启后端服务
	docker-compose stop backend
	docker-compose rm -f backend
	docker-compose up --build -d backend
	@echo "✅ 后端服务已重新构建并启动"

# 开发模式 (前台运行，显示日志)
dev: ## 重新构建并以开发模式启动 (前台运行)
	docker-compose down
	docker-compose up --build

# 启动服务
up: ## 启动所有服务
	docker-compose up -d

# 停止服务
stop: ## 停止所有服务
	docker-compose stop

# 停止并删除容器
down: ## 停止并删除所有容器
	docker-compose down

# 重启服务
restart: ## 重启所有服务
	docker-compose restart

# 查看日志
logs: ## 查看所有服务日志
	docker-compose logs -f

# 查看后端日志
logs-backend: ## 查看后端服务日志
	docker-compose logs -f backend

# 查看前端日志
logs-nginx: ## 查看 Nginx 日志
	docker-compose logs -f nginx

# 清理所有内容
clean: ## 停止并删除所有容器、网络、卷和镜像
	docker-compose down -v --rmi all
	docker system prune -f

# 强制重建 (清理缓存)
force-rebuild: ## 强制重新构建 (不使用缓存)
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

# 进入后端容器
shell-backend: ## 进入后端容器的 shell
	docker-compose exec backend sh

# 进入 MySQL 容器
shell-mysql: ## 进入 MySQL 容器的 shell
	docker-compose exec mysql mysql -u i18n_user -p i18n_lite

# 查看容器状态
status: ## 查看所有容器状态
	docker-compose ps

# 初始化项目 (首次运行)
init: ## 初始化项目 (首次运行)
	@echo "🚀 初始化 I18nLite 项目..."
	docker-compose down -v
	docker-compose up --build -d
	@echo "✅ 项目初始化完成!"
	@echo "   - 前端: http://localhost:3000"
	@echo "   - API:  http://localhost:8000"
	@echo "   - MySQL: localhost:3306"

# 备份数据库
backup-db: ## 备份数据库
	@echo "📦 备份数据库..."
	docker-compose exec mysql mysqldump -u i18n_user -p i18n_lite > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ 数据库备份完成"
