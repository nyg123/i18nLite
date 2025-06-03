-- I18nLite 数据库初始化脚本

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS i18n_lite DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE i18n_lite;

-- 创建项目表
CREATE TABLE IF NOT EXISTS `projects` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `languages` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '支持的语言列表，逗号分隔',
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_projects_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建翻译Key表
CREATE TABLE IF NOT EXISTS `translation_keys` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `key_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_key` (`project_id`,`key_name`),
  KEY `idx_translation_keys_project_id` (`project_id`),
  CONSTRAINT `fk_translation_keys_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建翻译表
CREATE TABLE IF NOT EXISTS `translations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `key_id` bigint unsigned NOT NULL,
  `lang` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `translation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key_lang` (`key_id`,`lang`),
  KEY `idx_translations_key_id` (`key_id`),
  KEY `idx_translations_lang` (`lang`),
  CONSTRAINT `fk_translations_key` FOREIGN KEY (`key_id`) REFERENCES `translation_keys` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;