package models

import (
	"time"
)

// Project 项目表
type Project struct {
	ID          uint64    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string    `json:"name" gorm:"type:varchar(128);not null;uniqueIndex" binding:"required"`
	Description string    `json:"description" gorm:"type:text"`
	Languages   string    `json:"languages" gorm:"type:varchar(500);comment:支持的语言列表，逗号分隔"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// 关联关系
	TranslationKeys []TranslationKey `json:"translation_keys,omitempty" gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE"`
}

// ProjectCreateRequest 创建项目请求结构体
type ProjectCreateRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Languages   string `json:"languages" binding:"required"`
}

// ProjectUpdateRequest 更新项目请求结构体
type ProjectUpdateRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Languages   string `json:"languages" binding:"required"`
}

// TranslationKey Key表
type TranslationKey struct {
	ID        uint64    `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID uint64    `json:"project_id" gorm:"not null;index"`
	KeyName   string    `json:"key_name" gorm:"type:varchar(255);not null" binding:"required"`
	Comment   string    `json:"comment" gorm:"type:text"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// 关联关系
	Project      Project       `json:"project,omitempty" gorm:"foreignKey:ProjectID"`
	Translations []Translation `json:"translations,omitempty" gorm:"foreignKey:KeyID;constraint:OnDelete:CASCADE"`
}

// Translation 翻译表
type Translation struct {
	ID          uint64    `json:"id" gorm:"primaryKey;autoIncrement"`
	KeyID       uint64    `json:"key_id" gorm:"not null;index"`
	Lang        string    `json:"lang" gorm:"type:char(2);not null" binding:"required,len=2"`
	Translation string    `json:"translation" gorm:"type:text"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// 关联关系
	TranslationKey TranslationKey `json:"translation_key,omitempty" gorm:"foreignKey:KeyID"`
}

// 确保复合唯一索引
func init() {
	// 这些索引将在数据库迁移时创建
	// project_id + key_name 唯一索引 (在 TranslationKey 表)
	// key_id + lang 唯一索引 (在 Translation 表)
}
