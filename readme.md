# I18nLite - 多语言管理工具

## 项目简介

I18nLite 是一个前后端分离的多语言管理工具，支持多项目、多语言的翻译管理。

## 技术栈

### 后端
- Go (Gin框架)
- MySQL数据库
- GORM ORM

### 前端
- Layui (UI框架)

### 部署
- Nginx (反向代理)
- Docker (可选)
## 本地开发环境启动

### 1. 准备工作

#### 安装依赖
- Go 1.24+
- MySQL 8.0+

#### 数据库准备
```sql
-- 创建数据库和用户
CREATE DATABASE i18n_lite CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'i18n_user'@'localhost' IDENTIFIED BY 'i18n_password';
GRANT ALL PRIVILEGES ON i18n_lite.* TO 'i18n_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. 后端启动

```bash
# 进入项目根目录
cd c:\www\tmp\I18nLite

# 下载Go依赖
go mod tidy

# 初始化数据库表结构 (首次运行前必须执行)
mysql -u i18n_user -pi18n_password i18n_lite < sql/init.sql

# 使用本地配置文件启动
$env:CONFIG_FILE="config/config.local.yaml"
go run main.go
```

后端服务将在 http://localhost:8000 启动

**重要：** 本地开发环境需要手动执行 `sql/init.sql` 文件来创建数据库表结构，或使用 `make init-db` 命令。

### 3. 前端访问

直接打开前端文件即可：
- 方式1：直接用浏览器打开 `web/index.html`
- 方式2：使用本地服务器（如 Live Server 扩展）运行前端文件

### 4. 访问应用

打开浏览器访问 http://localhost:3000

## Docker 方式启动

使用 Docker Compose 启动时，**无需手动执行 SQL 脚本**，MySQL 容器会自动初始化数据库表结构：

```bash
# 在项目根目录执行（一键启动，自动初始化）
docker-compose up -d

# 或使用 Makefile 命令
make run          # 重新构建并启动所有服务
make init         # 初始化项目（首次运行推荐）
```

**Docker 环境的优势：**
- 🚀 **自动初始化**：首次启动时自动执行 `sql/init.sql` 创建表结构
- 💾 **数据持久化**：数据保存在宿主机，容器重启不丢失数据  
- 🔄 **一键部署**：无需手动配置数据库和执行 SQL 脚本

## 启动方式对比

| 启动方式 | 数据库初始化 | 适用场景 | 特点 |
|---------|------------|---------|-----|
| **Docker Compose** | 🚀 自动执行 | 生产部署、团队开发 | 一键启动，自动化程度高 |
| **本地开发** | ⚠️ 需手动执行 | 个人开发、调试 | 灵活控制，便于调试 |

## Makefile 命令说明

项目提供了便捷的 Makefile 命令：

```bash
# 查看所有可用命令
make help

# Docker 开发相关
make run          # 重新构建并启动所有服务 (Docker)
make dev          # 开发模式启动 (前台运行，显示日志)
make rebuild      # 仅重新构建后端服务

# 本地开发数据库管理
make init-db      # 初始化数据库表结构 (本地环境)
make reset-db     # 重置数据库 (删除所有数据)
make backup-db    # 备份数据库

# 其他
make logs         # 查看所有服务日志 (Docker)
make status       # 查看容器状态 (Docker)
make clean        # 清理所有容器和镜像 (Docker)
```

**注意：** 
- Docker 环境的 Makefile 命令主要用于容器管理
- 本地开发环境的数据库命令需要手动执行

## 配置文件说明

### 本地开发配置 (config/config.local.yaml)
```yaml
server:
  port: 8000        # 后端服务端口
  mode: debug       # 运行模式: debug/release

database:
  host: localhost   # 数据库地址
  port: 3306       # 数据库端口
  username: i18n_user     # 数据库用户名
  password: i18n_password # 数据库密码
  database: i18n_lite     # 数据库名
```

### 环境变量覆盖
可以通过环境变量覆盖配置文件中的设置：

```bash
# 数据库配置
set DB_HOST=localhost
set DB_PORT=3306
set DB_USERNAME=i18n_user
set DB_PASSWORD=i18n_password
set DB_DATABASE=i18n_lite

# 服务器配置
set SERVER_PORT=8000
set GIN_MODE=debug

# 配置文件路径
set CONFIG_FILE=config/config.local.yaml
```

## API 接口

### 健康检查
- GET `/health` - 服务健康检查

### 项目管理
- GET `/api/projects` - 获取所有项目
- POST `/api/projects` - 创建项目
- PUT `/api/projects/:id` - 更新项目
- DELETE `/api/projects/:id` - 删除项目

### Key管理
- GET `/api/projects/:projectId/keys` - 获取项目的所有Key
- POST `/api/projects/:projectId/keys` - 创建Key
- PUT `/api/keys/:id` - 更新Key
- DELETE `/api/keys/:id` - 删除Key

### 翻译管理
- GET `/api/key-translations/:keyId` - 获取Key的所有翻译
- POST `/api/key-translations/:keyId` - 创建翻译
- PUT `/api/translations/:id` - 更新翻译
- DELETE `/api/translations/:id` - 删除翻译
- PUT `/api/key-translations/:keyId/batch` - 批量更新翻译

## 开发说明

### 目录结构
```
├── config/          # 配置文件
├── controllers/     # 控制器
├── database/        # 数据库连接
├── models/          # 数据模型
├── routes/          # 路由配置
├── sql/             # SQL脚本 (数据库表结构)
├── web/             # 前端静态文件
├── nginx/           # Nginx配置
└── main.go          # 入口文件
```

### 数据库初始化机制
- **表结构定义**：所有数据库表结构定义在 `sql/init.sql` 文件中
- **初始化方式**：需要手动执行 SQL 脚本或使用 Makefile 命令，不使用 GORM 自动迁移
- **开发优势**：
  - 更好的版本控制和表结构管理
  - 支持复杂的索引和约束定义
  - 更精确的字段类型控制
  - 便于数据库结构的审查和维护

### CORS 配置
后端已配置CORS，允许以下前端地址访问：
- http://localhost:3000
- http://localhost:8080
- http://127.0.0.1:3000
- http://127.0.0.1:8080

