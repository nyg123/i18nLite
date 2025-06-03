// 工具函数模块
window.I18nUtils = {
    // API配置
    API_BASE_URL: 'http://localhost:8000/api',
    
    // 格式化日期时间
    formatDateTime: function(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN');
    },    // 获取翻译状态
    getTranslationStatus: function(keyData) {
        const progress = this.getTranslationProgress(keyData);
        if (progress === 100) {
            return {class: 'translation-complete', text: '已完成'};
        } else if (progress > 0) {
            return {class: 'translation-partial', text: '部分完成'};
        } else {
            return {class: 'translation-empty', text: '未翻译'};
        }
    },    // 获取翻译进度
    getTranslationProgress: function(keyData) {
        // 获取当前项目的语言数
        const projectLanguages = this.getProjectLanguages();
        const languageCount = projectLanguages.length;
        
        if (languageCount === 0) {
            // 如果语言列表还没有加载，暂时返回0，避免除零错误
            return 0;
        }
        
        // 计算已翻译的语言数
        const translationCount = keyData.translations ? keyData.translations.length : 0;
        const progress = Math.round((translationCount / languageCount) * 100);
        
        return Math.min(progress, 100);
    },

    // 获取当前项目的语言列表（需要从全局状态或缓存中获取）
    getProjectLanguages: function() {
        // 从全局缓存中获取当前项目的语言列表
        if (window.I18nApp && window.I18nApp.currentProjectLanguages) {
            return window.I18nApp.currentProjectLanguages;
        }
        // 如果还没有加载，返回空数组
        return [];
    },

    // 设置当前项目的语言列表
    setProjectLanguages: function(languages) {
        window.I18nApp = window.I18nApp || {};
        window.I18nApp.currentProjectLanguages = languages;
    },

    // 显示消息
    showMessage: function(message, type = 'success') {
        const iconMap = {
            success: 1,
            error: 2,
            warning: 3,
            info: 0
        };
        layui.layer.msg(message, {icon: iconMap[type] || 1});
    },

    // 确认对话框
    confirm: function(message, callback, title = '确认操作') {
        layui.layer.confirm(message, {icon: 3, title: title}, function(index) {
            callback();
            layui.layer.close(index);
        });
    },

    // HTTP请求封装
    request: function(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const finalOptions = Object.assign(defaultOptions, options);
        
        if (finalOptions.body && typeof finalOptions.body === 'object') {
            finalOptions.body = JSON.stringify(finalOptions.body);
        }
        
        return fetch(url, finalOptions);
    }
};
