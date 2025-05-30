// 工具函数模块
window.I18nUtils = {
    // API配置
    API_BASE_URL: 'http://localhost:8000/api',
    
    // 格式化日期时间
    formatDateTime: function(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN');
    },

    // 获取翻译状态
    getTranslationStatus: function(keyData) {
        // 这里应该根据实际的翻译数据来判断状态
        // 暂时返回模拟数据
        const statuses = [
            {class: 'translation-complete', text: '已完成'},
            {class: 'translation-partial', text: '部分完成'},
            {class: 'translation-empty', text: '未翻译'}
        ];
        return statuses[Math.floor(Math.random() * statuses.length)];
    },

    // 获取翻译进度
    getTranslationProgress: function(keyData) {
        // 这里应该根据实际的翻译数据来计算进度
        // 暂时返回模拟数据
        return Math.floor(Math.random() * 101);
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
