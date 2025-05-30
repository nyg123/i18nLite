package main

import (
	"fmt"
	"log"

	"I18nLite/config"
	"I18nLite/database"
	"I18nLite/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化配置
	config.Init()

	// 设置Gin模式
	gin.SetMode(config.Cfg.Server.Mode)

	// 初始化数据库
	database.Init()

	// 创建Gin引擎
	r := gin.Default()

	// 设置路由
	routes.SetupRoutes(r)

	// 启动服务器
	port := fmt.Sprintf(":%d", config.Cfg.Server.Port)
	log.Printf("服务器启动在端口 %s", port)

	if err := r.Run(port); err != nil {
		log.Fatalf("启动服务器失败: %v", err)
	}
}
