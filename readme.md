# 多语言管理工具（MVP）

一个本地部署、轻量级的多语言文件管理系统，支持 `.po` 和 Excel 格式的导入导出，便于维护项目中不同语言的翻译文件。该项目基于 Golang + Layui 构建，采用三层架构：**项目管理 → Key管理 → 翻译管理**，支持 ISO 639-1 标准语言代码。

---

## 📦 技术栈

- **后端**：Golang (Gin) + MySQL
- **前端**：Layui
- **导入导出支持库**：
    - `.po` 文件：[`leonelquinteros/gotext`](https://github.com/leonelquinteros/gotext)
    - `.xlsx` 文件：[`xuri/excelize`](https://github.com/xuri/excelize)
- **部署方式**：Docker（预留登录权限模块）

---

## 🎯 MVP 功能列表

### 📂 项目管理模块

- [x] 创建新项目
- [x] 删除项目（级联删除所有Key和翻译）
- [x] 编辑项目信息（名称、描述）
- [x] 查看项目列表（分页展示）
- [x] 搜索项目名称

### 🔑 Key 管理模块

- [x] 添加新的翻译 Key（在指定项目下）
- [x] 删除已有 Key（级联删除所有翻译）
- [x] 编辑 Key 信息（Key名称、注释）
- [x] 查看 Key 列表（按项目筛选、分页展示）
- [x] 搜索 Key 名称

### 🌐 翻译管理模块

- [x] 添加/编辑指定 Key 的翻译内容
- [x] 删除某语言的翻译
- [x] 支持 ISO 639-1 标准语言代码（如：en、zh、fr、de）
- [x] 批量编辑某 Key 的所有语言翻译
- [x] Inline 表格编辑译文内容

### 📁 文件导入导出

- [x] 支持 `.po` 文件导入，解析多语言内容
- [x] 支持 Excel 文件导入（第一行为标题：Key、注释、多语言列）
- [x] 支持将当前数据导出为 `.po` 文件（按语言拆分）
- [x] 支持将当前数据导出为 Excel 表格（多语言列）

### 🌐 前端交互流程

1. **项目列表页** → 点击项目进入Key管理
2. **Key列表页** → 点击Key进入翻译管理  
3. **翻译编辑页** → 多语言编辑界面

---

### 🛠 后端 API 接口

#### 项目管理 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET  | `/api/projects` | 获取项目列表（支持分页、搜索） |
| POST | `/api/projects` | 创建新项目 |
| PUT  | `/api/projects/:id` | 更新项目信息 |
| DELETE | `/api/projects/:id` | 删除项目（级联删除） |

#### Key 管理 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET  | `/api/projects/:projectId/keys` | 获取指定项目的Key列表（支持分页、搜索） |
| POST | `/api/projects/:projectId/keys` | 在指定项目下新增 Key |
| PUT  | `/api/keys/:id` | 更新 Key 信息 |
| DELETE | `/api/keys/:id` | 删除 Key（级联删除翻译） |

#### 翻译管理 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET  | `/api/keys/:keyId/translations` | 获取指定Key的所有翻译 |
| POST | `/api/keys/:keyId/translations` | 新增翻译 |
| PUT  | `/api/translations/:id` | 更新翻译内容 |
| DELETE | `/api/translations/:id` | 删除翻译 |

#### 导入导出 API

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/projects/:projectId/import/po` | 导入 `.po` 文件到指定项目 |
| POST | `/api/projects/:projectId/import/excel` | 导入 `.xlsx` 文件到指定项目 |
| GET  | `/api/projects/:projectId/export/po?lang=en` | 导出指定项目某语言的 `.po` 文件 |
| GET  | `/api/projects/:projectId/export/excel` | 导出指定项目的全量 Excel 文件 |

---

### 🐬 数据库设计（MySQL）

#### 表：`projects`（项目表）

| 字段名       | 类型         | 描述             |
|--------------|--------------|------------------|
| id           | bigint       | 主键             |
| name         | varchar(128) | 项目名称         |
| description  | text         | 项目描述         |
| created_at   | datetime     | 创建时间         |
| updated_at   | datetime     | 更新时间         |

#### 表：`translation_keys`（Key表）

| 字段名       | 类型         | 描述             |
|--------------|--------------|------------------|
| id           | bigint       | 主键             |
| project_id   | bigint       | 项目ID（外键）   |
| key_name     | varchar(255) | 翻译 Key         |
| comment      | text         | 注释             |
| created_at   | datetime     | 创建时间         |
| updated_at   | datetime     | 更新时间         |

#### 表：`translations`（翻译表）

| 字段名       | 类型         | 描述                    |
|--------------|--------------|-------------------------|
| id           | bigint       | 主键                    |
| key_id       | bigint       | Key ID（外键）          |
| lang         | char(2)      | 语言代码（ISO 639-1）   |
| translation  | text         | 译文内容                |
| created_at   | datetime     | 创建时间                |
| updated_at   | datetime     | 更新时间                |

#### 索引建议

- `projects`: `name` 唯一索引
- `translation_keys`: `project_id + key_name` 唯一索引
- `translations`: `key_id + lang` 唯一索引

#### 外键关系

- `translation_keys.project_id` → `projects.id`（级联删除）
- `translations.key_id` → `translation_keys.id`（级联删除）

---

## 🌟 页面导航流程

```
首页（项目列表）
    ↓ [点击项目]
Key管理页面（显示该项目下的所有Key）
    ↓ [点击Key]
翻译管理页面（编辑该Key的所有语言翻译）
```

### 页面功能说明

1. **项目列表页**：
   - 显示所有项目卡片
   - 支持创建、编辑、删除项目
   - 搜索项目名称

2. **Key管理页**：
   - 面包屑导航：首页 > 项目名
   - 显示当前项目下的所有Key
   - 支持添加、编辑、删除Key
   - 搜索Key名称
   - 导入/导出功能（针对当前项目）

3. **翻译管理页**：
   - 面包屑导航：首页 > 项目名 > Key名
   - 显示当前Key的所有语言翻译
   - 支持添加、编辑、删除翻译
   - ISO 639-1 语言选择器

---

## 🌍 支持的语言代码（ISO 639-1）

| 代码 | 语言 | 代码 | 语言 |
|------|------|------|------|
| en   | English | zh   | 中文 |
| fr   | Français | de   | Deutsch |
| es   | Español | ja   | 日本語 |
| ko   | 한국어 | ru   | Русский |
| pt   | Português | it   | Italiano |
| ar   | العربية | hi   | हिन्दी |

---

## 🐳 Docker 使用（本地运行）

```bash
# 构建镜像
docker build -t i18n-manager .

# 运行服务
docker run -p 8080:8080 --name i18n-manager \
  -v /path/to/local/files:/data \
  -e MYSQL_DSN="user:password@tcp(host:port)/dbname" \
  i18n-manager
