package routes

import (
	"I18nLite/controllers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	// 静态文件服务
	r.Static("/static", "./web/static")
	r.LoadHTMLGlob("web/templates/*")

	// 首页
	r.GET("/", func(c *gin.Context) {
		c.HTML(200, "index.html", gin.H{
			"title": "多语言管理工具",
		})
	})

	// 项目管理页面
	r.GET("/projects", func(c *gin.Context) {
		c.HTML(200, "projects.html", gin.H{
			"title": "项目管理",
		})
	})

	// Key管理页面
	r.GET("/projects/:id/keys", func(c *gin.Context) {
		projectID := c.Param("id")
		c.HTML(200, "keys.html", gin.H{
			"title":     "Key管理",
			"projectId": projectID,
		})
	})

	// 翻译管理页面
	r.GET("/projects/:projectId/keys/:keyId/translations", func(c *gin.Context) {
		projectID := c.Param("projectId")
		keyID := c.Param("keyId")
		c.HTML(200, "translations.html", gin.H{
			"title":     "翻译管理",
			"projectId": projectID,
			"keyId":     keyID,
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
			projects.PUT("/:id", controllers.UpdateProject)
			projects.DELETE("/:id", controllers.DeleteProject)

			// Key 管理 API
			projects.GET("/:projectId/keys", controllers.GetKeys)
			projects.POST("/:projectId/keys", controllers.CreateKey)

			// 导入导出 API (待实现)
			// projects.POST("/:projectId/import/po", controllers.ImportPO)
			// projects.POST("/:projectId/import/excel", controllers.ImportExcel)
			// projects.GET("/:projectId/export/po", controllers.ExportPO)
			// projects.GET("/:projectId/export/excel", controllers.ExportExcel)
		}

		// Key 管理 API
		keys := api.Group("/keys")
		{
			keys.PUT("/:id", controllers.UpdateKey)
			keys.DELETE("/:id", controllers.DeleteKey)

			// 翻译管理 API
			keys.GET("/:keyId/translations", controllers.GetTranslations)
			keys.POST("/:keyId/translations", controllers.CreateTranslation)
			keys.PUT("/:keyId/translations/batch", controllers.BatchUpdateTranslations)
		}

		// 翻译管理 API
		translations := api.Group("/translations")
		{
			translations.PUT("/:id", controllers.UpdateTranslation)
			translations.DELETE("/:id", controllers.DeleteTranslation)
		}
	}
}
