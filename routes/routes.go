package routes

import (
	"I18nLite/controllers"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	// 配置CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:8080", "http://127.0.0.1:3000", "http://127.0.0.1:8080"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "I18nLite API Server is running",
		})
	})

	// API 路由组
	api := r.Group("/api")
	{
		// 项目管理 API
		projects := api.Group("/projects")
		{
			projects.GET("", controllers.GetProjects)
			projects.POST("", controllers.CreateProject)

			// Key 管理 API（使用项目ID作为路径参数）
			projects.GET("/:projectId/keys", controllers.GetKeys)
			projects.POST("/:projectId/keys", controllers.CreateKey)

			// 单个项目操作（使用不同的路径避免冲突）
			projects.GET("/detail/:id", controllers.GetProject)
			projects.PUT("/:id", controllers.UpdateProject)
			projects.DELETE("/:id", controllers.DeleteProject)

			// 导入导出 API
			projects.POST("/:projectId/import/po", controllers.ImportPOFiles)
			projects.GET("/:projectId/export/po", controllers.ExportPOFiles)
			// projects.POST("/:projectId/import/excel", controllers.ImportExcel)
			// projects.GET("/:projectId/export/excel", controllers.ExportExcel)
		}

		// Key 管理 API
		keys := api.Group("/keys")
		{
			keys.PUT("/:id", controllers.UpdateKey)
			keys.DELETE("/:id", controllers.DeleteKey)
		}

		// Key 翻译管理 API
		keyTranslations := api.Group("/key-translations")
		{
			keyTranslations.GET("/:keyId", controllers.GetTranslations)
			keyTranslations.POST("/:keyId", controllers.CreateTranslation)
			keyTranslations.PUT("/:keyId/batch", controllers.BatchUpdateTranslations)
		}

		// 翻译管理 API
		translations := api.Group("/translations")
		{
			translations.PUT("/:id", controllers.UpdateTranslation)
			translations.DELETE("/:id", controllers.DeleteTranslation)
		}
	}
}
