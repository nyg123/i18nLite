package utils

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"I18nLite/config"
)

type LogLevel int

const (
	DEBUG LogLevel = iota
	INFO
	WARN
	ERROR
)

var levelNames = map[LogLevel]string{
	DEBUG: "DEBUG",
	INFO:  "INFO",
	WARN:  "WARN",
	ERROR: "ERROR",
}

type Logger struct {
	level  LogLevel
	logger *log.Logger
}

var defaultLogger *Logger

// Init 初始化日志系统
func InitLogger() {
	// 确保日志目录存在
	if config.Cfg.Log.File != "" {
		logDir := filepath.Dir(config.Cfg.Log.File)
		if err := os.MkdirAll(logDir, 0755); err != nil {
			log.Printf("创建日志目录失败: %v", err)
		}
	}

	// 解析日志级别
	level := parseLogLevel(config.Cfg.Log.Level)
	// 创建日志输出
	var output *os.File
	if config.Cfg.Log.File != "" {
		var err error
		output, err = os.OpenFile(config.Cfg.Log.File, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err != nil {
			log.Printf("打开日志文件失败: %v，使用标准输出", err)
			output = os.Stdout
		}
	} else {
		output = os.Stdout
	}

	defaultLogger = &Logger{
		level:  level,
		logger: log.New(output, "", log.LstdFlags),
	}
}

// parseLogLevel 解析日志级别字符串
func parseLogLevel(level string) LogLevel {
	switch strings.ToLower(level) {
	case "debug":
		return DEBUG
	case "info":
		return INFO
	case "warn", "warning":
		return WARN
	case "error":
		return ERROR
	default:
		return INFO
	}
}

// logf 通用日志输出函数
func logf(level LogLevel, format string, args ...interface{}) {
	if defaultLogger == nil {
		// 如果logger未初始化，直接使用标准log
		log.Printf("[%s] "+format, append([]interface{}{levelNames[level]}, args...)...)
		return
	}

	if level >= defaultLogger.level {
		defaultLogger.logger.Printf("[%s] "+format, append([]interface{}{levelNames[level]}, args...)...)
	}
}

// Debug 调试日志
func Debug(format string, args ...interface{}) {
	logf(DEBUG, format, args...)
}

// Info 信息日志
func Info(format string, args ...interface{}) {
	logf(INFO, format, args...)
}

// Warn 警告日志
func Warn(format string, args ...interface{}) {
	logf(WARN, format, args...)
}

// Error 错误日志
func Error(format string, args ...interface{}) {
	logf(ERROR, format, args...)
}

// 为了向后兼容，也可以提供Print方法
func Print(v ...interface{}) {
	Info(fmt.Sprint(v...))
}

func Printf(format string, args ...interface{}) {
	Info(format, args...)
}
