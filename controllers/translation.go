package controllers

import (
	"net/http"
	"strconv"

	"I18nLite/database"
	"I18nLite/models"

	"github.com/gin-gonic/gin"
)

// GetTranslations 获取指定Key的所有翻译
func GetTranslations(c *gin.Context) {
	keyID := c.Param("keyId")

	var translations []models.Translation
	if err := database.DB.Where("key_id = ?", keyID).Find(&translations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取翻译列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"msg":  "success",
		"data": translations,
	})
}

// CreateTranslation 新增翻译
func CreateTranslation(c *gin.Context) {
	keyID := c.Param("keyId")

	var translation models.Translation
	if err := c.ShouldBindJSON(&translation); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 设置KeyID
	keyIDInt, err := strconv.ParseUint(keyID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的Key ID"})
		return
	}
	translation.KeyID = keyIDInt

	if err := database.DB.Create(&translation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建翻译失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"msg":  "创建成功",
		"data": translation,
	})
}

// UpdateTranslation 更新翻译内容
func UpdateTranslation(c *gin.Context) {
	id := c.Param("id")
	var translation models.Translation

	if err := database.DB.First(&translation, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "翻译不存在"})
		return
	}

	var updateData models.Translation
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Model(&translation).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新翻译失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"msg":  "更新成功",
		"data": translation,
	})
}

// DeleteTranslation 删除翻译
func DeleteTranslation(c *gin.Context) {
	id := c.Param("id")
	var translation models.Translation

	if err := database.DB.First(&translation, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "翻译不存在"})
		return
	}

	if err := database.DB.Delete(&translation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除翻译失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"msg":  "删除成功",
	})
}

// BatchUpdateTranslations 批量更新某Key的所有语言翻译
func BatchUpdateTranslations(c *gin.Context) {
	keyID := c.Param("keyId")

	var request struct {
		Translations []models.Translation `json:"translations" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	keyIDInt, err := strconv.ParseUint(keyID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的Key ID"})
		return
	}

	// 开始事务
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, translation := range request.Translations {
		translation.KeyID = keyIDInt

		// 使用 ON DUPLICATE KEY UPDATE 的逻辑
		var existing models.Translation
		err := tx.Where("key_id = ? AND lang = ?", keyIDInt, translation.Lang).First(&existing).Error

		if err != nil {
			// 不存在，创建新的
			if err := tx.Create(&translation).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "批量更新翻译失败"})
				return
			}
		} else {
			// 存在，更新
			if err := tx.Model(&existing).Updates(translation).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "批量更新翻译失败"})
				return
			}
		}
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"code": 0,
		"msg":  "批量更新成功",
	})
}
