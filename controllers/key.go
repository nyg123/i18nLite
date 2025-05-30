package controllers

import (
	"net/http"
	"strconv"

	"I18nLite/database"
	"I18nLite/models"

	"github.com/gin-gonic/gin"
)

// GetKeys 获取指定项目的Key列表
func GetKeys(c *gin.Context) {
	projectID := c.Param("projectId")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	offset := (page - 1) * limit

	var keys []models.TranslationKey
	var total int64

	query := database.DB.Model(&models.TranslationKey{}).Where("project_id = ?", projectID)
	if search != "" {
		query = query.Where("key_name LIKE ?", "%"+search+"%")
	}

	// 获取总数
	query.Count(&total)

	// 获取数据，预加载翻译数据
	if err := query.Preload("Translations").Offset(offset).Limit(limit).Order("created_at DESC").Find(&keys).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取Key列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":  0,
		"msg":   "success",
		"count": total,
		"data":  keys,
	})
}

// CreateKey 在指定项目下新增Key
func CreateKey(c *gin.Context) {
	projectID := c.Param("projectId")

	var key models.TranslationKey
	if err := c.ShouldBindJSON(&key); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置项目ID
	projectIDInt, err := strconv.ParseUint(projectID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的项目ID"})
		return
	}
	key.ProjectID = projectIDInt

	if err := database.DB.Create(&key).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建Key失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"msg":  "创建成功",
		"data": key,
	})
}

// UpdateKey 更新Key信息
func UpdateKey(c *gin.Context) {
	id := c.Param("id")
	var key models.TranslationKey

	if err := database.DB.First(&key, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Key不存在"})
		return
	}

	var updateData models.TranslationKey
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Model(&key).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新Key失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"msg":  "更新成功",
		"data": key,
	})
}

// DeleteKey 删除Key
func DeleteKey(c *gin.Context) {
	id := c.Param("id")
	var key models.TranslationKey

	if err := database.DB.First(&key, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Key不存在"})
		return
	}

	// GORM 会自动处理级联删除
	if err := database.DB.Delete(&key).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除Key失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"msg":  "删除成功",
	})
}
