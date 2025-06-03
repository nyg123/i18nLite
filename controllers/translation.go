package controllers

import (
	"archive/zip"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"I18nLite/database"
	"I18nLite/models"

	"github.com/gin-gonic/gin"
	"github.com/leonelquinteros/gotext"
)

// GetTranslations 获取指定Key的所有翻译
func GetTranslations(c *gin.Context) {
	keyID := c.Param("keyId")

	var translations []models.Translation
	if err := database.DB.Where("key_id = ?", keyID).Find(&translations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取翻译列表失败"})
		return
	}

	c.JSON(
		http.StatusOK, gin.H{
			"code": 0,
			"msg":  "success",
			"data": translations,
		},
	)
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

	c.JSON(
		http.StatusOK, gin.H{
			"code": 0,
			"msg":  "创建成功",
			"data": translation,
		},
	)
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

	c.JSON(
		http.StatusOK, gin.H{
			"code": 0,
			"msg":  "更新成功",
			"data": translation,
		},
	)
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

	c.JSON(
		http.StatusOK, gin.H{
			"code": 0,
			"msg":  "删除成功",
		},
	)
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

	c.JSON(
		http.StatusOK, gin.H{
			"code": 0,
			"msg":  "批量更新成功",
		},
	)
}

// ImportPOFiles 批量导入PO文件
func ImportPOFiles(c *gin.Context) {
	projectIDStr := c.Param("projectId")
	projectID, err := strconv.ParseUint(projectIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的项目ID"})
		return
	}

	// 验证项目是否存在
	var project models.Project
	if err := database.DB.First(&project, projectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "项目不存在"})
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "获取上传文件失败"})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "没有上传文件"})
		return
	}

	var results []map[string]interface{}
	var totalKeys, totalTranslations, newKeys, updatedTranslations int

	// 开始事务
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, fileHeader := range files {
		result := map[string]interface{}{
			"filename": fileHeader.Filename,
			"success":  false,
			"message":  "",
			"stats": map[string]int{
				"keys":         0,
				"translations": 0,
				"new_keys":     0,
				"updated":      0,
			},
		}

		// 解析语言代码
		lang := extractLanguageFromFilename(fileHeader.Filename)
		if lang == "" {
			result["message"] = "无法从文件名解析语言代码，文件名应为类似 'en.po' 的格式"
			results = append(results, result)
			continue
		}

		// 打开文件
		file, err := fileHeader.Open()
		if err != nil {
			result["message"] = fmt.Sprintf("打开文件失败: %v", err)
			results = append(results, result)
			continue
		}
		defer file.Close()

		// 解析PO文件
		poEntries, err := parsePOFileWithGotext(file)
		if err != nil {
			result["message"] = fmt.Sprintf("解析PO文件失败: %v", err)
			results = append(results, result)
			continue
		}

		fileKeys := 0
		fileTranslations := 0
		fileNewKeys := 0
		fileUpdated := 0

		for _, entry := range poEntries {
			if entry.MsgID == "" || entry.MsgStr == "" {
				continue // 跳过空的条目
			}

			// 查找或创建Key
			var translationKey models.TranslationKey
			err := tx.Where("project_id = ? AND key_name = ?", projectID, entry.MsgID).First(&translationKey).Error

			if err != nil {
				// 创建新Key
				translationKey = models.TranslationKey{
					ProjectID: projectID,
					KeyName:   entry.MsgID,
					Comment:   entry.Comment,
				}
				if err := tx.Create(&translationKey).Error; err != nil {
					result["message"] = fmt.Sprintf("创建Key失败: %v", err)
					tx.Rollback()
					results = append(results, result)
					continue
				}
				fileNewKeys++
				newKeys++
			}
			fileKeys++
			totalKeys++

			// 查找或创建翻译
			var translation models.Translation
			err = tx.Where("key_id = ? AND lang = ?", translationKey.ID, lang).First(&translation).Error

			if err != nil {
				// 创建新翻译
				translation = models.Translation{
					KeyID:       translationKey.ID,
					Lang:        lang,
					Translation: entry.MsgStr,
				}
				if err := tx.Create(&translation).Error; err != nil {
					result["message"] = fmt.Sprintf("创建翻译失败: %v", err)
					tx.Rollback()
					results = append(results, result)
					continue
				}
			} else {
				// 更新翻译
				if err := tx.Model(&translation).Update("translation", entry.MsgStr).Error; err != nil {
					result["message"] = fmt.Sprintf("更新翻译失败: %v", err)
					tx.Rollback()
					results = append(results, result)
					continue
				}
				fileUpdated++
				updatedTranslations++
			}
			fileTranslations++
			totalTranslations++
		}

		result["success"] = true
		result["message"] = "导入成功"
		result["stats"] = map[string]int{
			"keys":         fileKeys,
			"translations": fileTranslations,
			"new_keys":     fileNewKeys,
			"updated":      fileUpdated,
		}
		results = append(results, result)
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "提交事务失败"})
		return
	}

	c.JSON(
		http.StatusOK, gin.H{
			"code": 0,
			"msg":  "PO文件批量导入完成",
			"data": map[string]interface{}{
				"results": results,
				"summary": map[string]int{
					"total_keys":           totalKeys,
					"total_translations":   totalTranslations,
					"new_keys":             newKeys,
					"updated_translations": updatedTranslations,
					"files_processed":      len(files),
				},
			},
		},
	)
}

// POEntry 表示PO文件中的一个条目
type POEntry struct {
	Comment string
	MsgID   string
	MsgStr  string
}

// parsePOFileWithGotext 使用gotext库解析PO文件内容
func parsePOFileWithGotext(file multipart.File) ([]POEntry, error) {
	// 读取文件内容到字节切片
	content, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("读取文件内容失败: %v", err)
	}

	// 创建一个新的Po对象
	po := gotext.NewPo()

	// 解析PO文件内容
	po.Parse(content)

	var entries []POEntry

	// 获取所有的翻译条目
	for _, translation := range po.GetDomain().GetTranslations() {
		msgid := translation.ID
		msgstr := translation.Get()

		// 跳过空的msgid（通常是文件头）
		if msgid == "" {
			continue
		}

		entry := POEntry{
			MsgID:  msgid,
			MsgStr: msgstr,
			// gotext库可能不直接提供注释，我们暂时留空
			// 如果需要注释，可能需要使用其他方法或保留部分自定义解析
			Comment: "",
		}

		entries = append(entries, entry)
	}

	return entries, nil
}

// extractLanguageFromFilename 从文件名中提取语言代码
func extractLanguageFromFilename(filename string) string {
	// 支持 en.po, zh-CN.po, zh_CN.po 等格式
	re := regexp.MustCompile(`([a-z]{2}(?:[-_][A-Z]{2})?).po$`)
	matches := re.FindStringSubmatch(filename)
	if len(matches) > 1 {
		// 将下划线转换为标准的语言代码格式
		lang := strings.ReplaceAll(matches[1], "_", "-")
		// 如果是两个字母的语言代码，直接返回
		if len(lang) == 2 {
			return lang
		}
		// 如果是带地区的代码，保持原样
		return lang
	}
	return ""
}

// ExportPOFiles 导出PO文件
func ExportPOFiles(c *gin.Context) {
	projectIDStr := c.Param("projectId")
	projectID, err := strconv.ParseUint(projectIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的项目ID"})
		return
	}

	// 验证项目是否存在
	var project models.Project
	if err := database.DB.First(&project, projectID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "项目不存在"})
		return
	}

	// 获取查询参数
	language := c.Query("lang")               // 可选：指定导出的语言
	format := c.DefaultQuery("format", "zip") // 默认为zip格式

	// 获取项目的所有Key和翻译
	var keys []models.TranslationKey
	if err := database.DB.Where("project_id = ?", projectID).
		Preload("Translations").
		Find(&keys).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取翻译数据失败"})
		return
	}

	// 获取项目支持的语言列表
	languages := []string{}
	if project.Languages != "" {
		for _, lang := range strings.Split(project.Languages, ",") {
			languages = append(languages, strings.TrimSpace(lang))
		}
	}

	// 如果指定了特定语言，只导出该语言
	if language != "" {
		languages = []string{language}
	}

	// 如果只有一个语言且格式不是zip，直接返回PO文件内容
	if len(languages) == 1 && format != "zip" {
		lang := languages[0]
		poContent := generatePOContent(project, keys, lang)

		// 设置响应头
		filename := fmt.Sprintf("%s_%s.po", project.Name, lang)
		c.Header("Content-Type", "application/octet-stream")
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))

		c.String(http.StatusOK, poContent)
		return
	}

	// 生成ZIP文件包含多个PO文件
	c.Header("Content-Type", "application/zip")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s_po_files.zip\"", project.Name))

	// 创建ZIP writer
	zipWriter := zip.NewWriter(c.Writer)
	defer zipWriter.Close()

	// 为每种语言生成PO文件
	for _, lang := range languages {
		poContent := generatePOContent(project, keys, lang)

		// 在ZIP中创建文件
		filename := fmt.Sprintf("%s.po", lang)
		fileWriter, err := zipWriter.Create(filename)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "创建ZIP文件失败"})
			return
		}

		_, err = fileWriter.Write([]byte(poContent))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "写入ZIP文件失败"})
			return
		}
	}
}

// generatePOContent 生成PO文件内容
func generatePOContent(project models.Project, keys []models.TranslationKey, language string) string {
	var content strings.Builder

	// 生成PO文件头
	content.WriteString("# Translation file for project: " + project.Name + "\n")
	content.WriteString("# Language: " + language + "\n")
	content.WriteString("# Generated at: " + time.Now().Format("2006-01-02 15:04:05") + "\n")
	content.WriteString("#\n")
	content.WriteString("msgid \"\"\n")
	content.WriteString("msgstr \"\"\n")
	content.WriteString("\"Content-Type: text/plain; charset=UTF-8\\n\"\n")
	content.WriteString("\"Language: " + language + "\\n\"\n")
	content.WriteString("\"MIME-Version: 1.0\\n\"\n")
	content.WriteString("\"Content-Transfer-Encoding: 8bit\\n\"\n")
	content.WriteString("\n")

	// 按照 KeyName (msgid) 排序，确保每次导出的顺序一致
	sort.Slice(keys, func(i, j int) bool {
		return keys[i].KeyName < keys[j].KeyName
	})

	// 生成翻译条目
	for _, key := range keys {
		// 添加注释（如果有）
		if key.Comment != "" {
			lines := strings.Split(key.Comment, "\n")
			for _, line := range lines {
				content.WriteString("# " + line + "\n")
			}
		}

		// 添加msgid
		content.WriteString("msgid \"" + escapePOString(key.KeyName) + "\"\n")

		// 查找对应语言的翻译
		var translation string
		for _, trans := range key.Translations {
			if trans.Lang == language {
				translation = trans.Translation
				break
			}
		}

		// 添加msgstr
		content.WriteString("msgstr \"" + escapePOString(translation) + "\"\n")
		content.WriteString("\n")
	}

	return content.String()
}

// escapePOString 转义PO文件字符串
func escapePOString(s string) string {
	// 转义特殊字符
	s = strings.ReplaceAll(s, "\\", "\\\\")
	s = strings.ReplaceAll(s, "\"", "\\\"")
	s = strings.ReplaceAll(s, "\n", "\\n")
	s = strings.ReplaceAll(s, "\r", "\\r")
	s = strings.ReplaceAll(s, "\t", "\\t")
	return s
}
