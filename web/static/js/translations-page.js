// 翻译页面专用JS
window.TranslationsPage = {
    currentProjectId: null,
    
    // 初始化页面
    init: function() {
        layui.use(['table', 'form', 'layer', 'element'], () => {
            this.parseUrlParams();
            this.initPage();
            this.bindEvents();
            
            // 初始化翻译管理器
            TranslationManager.initKeysTable();
            
            if (this.currentProjectId) {
                this.loadProjectInfo();
                TranslationManager.loadKeys(this.currentProjectId);
            }
        });
    },
    
    // 解析URL参数
    parseUrlParams: function() {
        const urlParams = new URLSearchParams(window.location.search);
        this.currentProjectId = urlParams.get('projectId');
        
        if (!this.currentProjectId) {
            layui.layer.msg('项目ID参数缺失，请从项目列表进入', {
                icon: 2,
                time: 3000
            }, function() {
                window.location.href = 'index.html';
            });
            return;
        }
    },
    
    // 初始化页面
    initPage: function() {
        // 设置当前项目ID到全局
        window.I18nApp = window.I18nApp || {};
        window.I18nApp.currentProjectId = this.currentProjectId;
        window.I18nApp.getCurrentProject = function() {
            return this.currentProjectId;
        }.bind(this);
    },
      // 加载项目信息
    loadProjectInfo: function() {
        I18nUtils.request(`${I18nUtils.API_BASE_URL}/projects/detail/${this.currentProjectId}`)
            .then(response => response.json())
            .then((response) => {
                if (response.data) {
                    document.getElementById('current-project-name').textContent = response.data.name;
                    document.title = `翻译管理 - ${response.data.name} - I18nLite`;
                }
            })
            .catch(() => {
                I18nUtils.showMessage('加载项目信息失败', 'error');
            });
    },
    
    // 绑定事件
    bindEvents: function() {
        const form = layui.form;
        
        // 新建Key按钮
        const addKeyBtn = document.getElementById('add-key-btn');
        if (addKeyBtn) {
            addKeyBtn.addEventListener('click', () => TranslationManager.addKey());
        }
        
        // 搜索Key
        const searchKeyBtn = document.getElementById('search-key-btn');
        if (searchKeyBtn) {
            searchKeyBtn.addEventListener('click', () => {
                const keyword = document.getElementById('key-search').value;
                TranslationManager.search(keyword);
            });
        }
        
        // 回车搜索
        const keySearchInput = document.getElementById('key-search');
        if (keySearchInput) {
            keySearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const keyword = e.target.value;
                    TranslationManager.search(keyword);
                }
            });
        }
        
        // 刷新按钮
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshPage());
        }
        
        // 表单提交事件
        form.on('submit(key-submit)', (data) => {
            data.field.project_id = this.currentProjectId; // 确保项目ID正确
            TranslationManager.submitKey(data.field);
            return false;
        });
        
        form.on('submit(translation-submit)', (data) => {
            TranslationManager.submitTranslations(data.field);
            return false;
        });
    },
    
    // 刷新页面
    refreshPage: function() {
        if (this.currentProjectId) {
            TranslationManager.loadKeys(this.currentProjectId);
            this.loadProjectInfo();
        }
        I18nUtils.showMessage('刷新完成', 'info');
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('翻译管理页面已启动');
    window.TranslationsPage.init();
});
