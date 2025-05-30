package database

import (
	"fmt"
	"log"

	"I18nLite/config"
	"I18nLite/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init() {
	cfg := config.Cfg.Database

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=%t&loc=%s",
		cfg.Username,
		cfg.Password,
		cfg.Host,
		cfg.Port,
		cfg.Database,
		cfg.Charset,
		cfg.ParseTime,
		cfg.Loc,
	)

	var logLevel logger.LogLevel
	switch config.Cfg.Log.Level {
	case "debug":
		logLevel = logger.Info
	default:
		logLevel = logger.Silent
	}

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		log.Fatalf("连接数据库失败: %v", err)
	}

	// 自动迁移数据库表
	if err := migrate(); err != nil {
		log.Fatalf("数据库迁移失败: %v", err)
	}

	log.Println("数据库连接成功")
}

func migrate() error {
	// 自动迁移表结构
	if err := DB.AutoMigrate(
		&models.Project{},
		&models.TranslationKey{},
		&models.Translation{},
	); err != nil {
		return err
	}

	// 创建复合唯一索引
	if err := DB.Exec("ALTER TABLE translation_keys ADD UNIQUE INDEX uk_project_key (project_id, key_name)").Error; err != nil {
		// 忽略已存在的索引错误
		log.Printf("创建 translation_keys 唯一索引: %v", err)
	}

	if err := DB.Exec("ALTER TABLE translations ADD UNIQUE INDEX uk_key_lang (key_id, lang)").Error; err != nil {
		// 忽略已存在的索引错误
		log.Printf("创建 translations 唯一索引: %v", err)
	}

	return nil
}
