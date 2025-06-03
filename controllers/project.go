package controllers

import (
	"net/http"
	"strconv"

	"I18nLite/database"
	"I18nLite/models"

	"github.com/gin-gonic/gin"
)

// GetProjects 获取项目列表
func GetProjects(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	offset := (page - 1) * limit

	var projects []models.Project
	var total int64

	query := database.DB.Model(&models.Project{})
	if search != "" {
		query = query.Where("name LIKE ?", "%"+search+"%")
	}

	// 获取总数
	query.Count(&total)

	// 获取数据
	if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取项目列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":  0,
		"msg":   "success",
		"count": total,
		"data":  projects,
	})
}

// GetProject 获取单个项目详情
func GetProject(c *gin.Context) {
	id := c.Param("id")
	var project models.Project

	if err := database.DB.First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "项目不存在"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"msg":  "success",
		"data": project,
	})
}

// CreateProject 创建项目
func CreateProject(c *gin.Context) {
	var req models.ProjectCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project := models.Project{
		Name:        req.Name,
		Description: req.Description,
		Languages:   req.Languages,
	}

	if err := database.DB.Create(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建项目失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"msg":  "创建成功",
		"data": project,
	})
}

// UpdateProject 更新项目
func UpdateProject(c *gin.Context) {
	id := c.Param("id")
	var project models.Project

	if err := database.DB.First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "项目不存在"})
		return
	}

	var req models.ProjectUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updateData := models.Project{
		Name:        req.Name,
		Description: req.Description,
		Languages:   req.Languages,
	}

	if err := database.DB.Model(&project).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新项目失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"msg":  "更新成功",
		"data": project,
	})
}

// DeleteProject 删除项目
func DeleteProject(c *gin.Context) {
	id := c.Param("id")
	var project models.Project

	if err := database.DB.First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "项目不存在"})
		return
	}

	// GORM 会自动处理级联删除
	if err := database.DB.Delete(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除项目失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"msg":  "删除成功",
	})
}
