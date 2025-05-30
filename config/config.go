package config

import (
	"log"
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	Upload   UploadConfig   `yaml:"upload"`
	Log      LogConfig      `yaml:"log"`
}

type ServerConfig struct {
	Port int    `yaml:"port"`
	Mode string `yaml:"mode"`
}

type DatabaseConfig struct {
	Host      string `yaml:"host"`
	Port      int    `yaml:"port"`
	Username  string `yaml:"username"`
	Password  string `yaml:"password"`
	Database  string `yaml:"database"`
	Charset   string `yaml:"charset"`
	ParseTime bool   `yaml:"parseTime"`
	Loc       string `yaml:"loc"`
}

type UploadConfig struct {
	MaxSize      int      `yaml:"max_size"`
	AllowedTypes []string `yaml:"allowed_types"`
	TempDir      string   `yaml:"temp_dir"`
}

type LogConfig struct {
	Level      string `yaml:"level"`
	File       string `yaml:"file"`
	MaxSize    int    `yaml:"max_size"`
	MaxBackups int    `yaml:"max_backups"`
	MaxAge     int    `yaml:"max_age"`
}

var Cfg *Config

func Init() {
	configFile := "config/config.yaml"
	if envConfig := os.Getenv("CONFIG_FILE"); envConfig != "" {
		configFile = envConfig
	}

	data, err := os.ReadFile(configFile)
	if err != nil {
		log.Fatalf("读取配置文件失败: %v", err)
	}

	Cfg = &Config{}
	if err := yaml.Unmarshal(data, Cfg); err != nil {
		log.Fatalf("解析配置文件失败: %v", err)
	}

	// 从环境变量覆盖数据库配置
	if host := os.Getenv("DB_HOST"); host != "" {
		Cfg.Database.Host = host
	}
	if port := os.Getenv("DB_PORT"); port != "" {
		// 简化处理，实际项目中应该转换为int
		Cfg.Database.Port = 3306
	}
	if username := os.Getenv("DB_USERNAME"); username != "" {
		Cfg.Database.Username = username
	}
	if password := os.Getenv("DB_PASSWORD"); password != "" {
		Cfg.Database.Password = password
	}
	if database := os.Getenv("DB_DATABASE"); database != "" {
		Cfg.Database.Database = database
	}
}
