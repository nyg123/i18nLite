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
-- 创建数据库
CREATE DATABASE i18n_lite CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
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

# 使用本地配置文件启动
set CONFIG_FILE=config/config.local.yaml
go run main.go
```

后端服务将在 http://localhost:8000 启动


### 4. 访问应用

打开浏览器访问 http://localhost:3000

## Docker 方式启动 (可选)

```bash
# 在项目根目录执行
docker-compose up -d
```

访问 http://localhost 即可使用应用

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
    web/             # 前端静态文件
├── nginx/           # Nginx配置
├── sql/             # SQL脚本
└── main.go          # 入口文件
```

### CORS 配置
后端已配置CORS，允许以下前端地址访问：
- http://localhost:3000
- http://localhost:8080
- http://127.0.0.1:3000
- http://127.0.0.1:8080

