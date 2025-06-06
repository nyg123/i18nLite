package database

import (
	"fmt"
	"log"

	"I18nLite/config"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init() {
	cfg := config.Cfg.Database

	// 直接连接到指定的数据库
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

	log.Println("数据库连接成功")
}
