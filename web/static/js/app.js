// 主应用模块
window.I18nApp = {
    currentProjectId: null,
    
    // 初始化应用
    init: function() {
        layui.use(['table', 'form', 'layer', 'element', 'laydate'], () => {
            this.initPage();
            this.bindEvents();
            
            // 初始化各个管理器
            ProjectManager.initProjectsTable();
            TranslationManager.initKeysTable();
        });
    },

    // 初始化页面
    initPage: function() {
        this.loadProjectSelect();
        this.showPage('projects');
    },

    // 设置当前项目
    setCurrentProject: function(projectId) {
        this.currentProjectId = projectId;
    },

    // 获取当前项目
    getCurrentProject: function() {
        return this.currentProjectId;
    },    // 页面切换 - 修复null pointer错误
    showPage: function(page) {
        document.querySelectorAll('.page-content').forEach((content) => {
            content.style.display = 'none';
        });
        document.getElementById(`${page}-page`).style.display = 'block';
        
        if (page === 'projects' && ProjectManager.projectsTable) {
            ProjectManager.refresh();
        } else if (page === 'translations') {
            this.loadProjectSelect();
        }
    },

    // 加载项目选择器
    loadProjectSelect: function() {
        I18nUtils.request(`${I18nUtils.API_BASE_URL}/projects`)
            .then(response => response.json())
            .then((response) => {
                const select = document.getElementById('project-select');
                select.innerHTML = '<option value="">请选择项目</option>';
                
                if (response.data && response.data.length > 0) {
                    response.data.forEach((project) => {
                        const option = document.createElement('option');
                        option.value = project.id;
                        option.textContent = project.name;
                        select.appendChild(option);
                    });
                }
                layui.form.render('select');
            })
            .catch(() => {
                I18nUtils.showMessage('加载项目列表失败', 'error');
            });
    },    // 绑定事件
    bindEvents: function() {
        const form = layui.form;
        
        // 导航切换
        document.querySelectorAll('.layui-nav-item a').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('href').substring(1);
                this.showPage(page);
                
                // 更新导航状态
                document.querySelectorAll('.layui-nav-item').forEach((item) => {
                    item.classList.remove('layui-this');
                });
                link.parentNode.classList.add('layui-this');
            });
        });

        // 新建项目按钮
        const addProjectBtn = document.getElementById('add-project-btn');
        if (addProjectBtn) {
            addProjectBtn.addEventListener('click', () => ProjectManager.addProject());
        }

        // 新建Key按钮
        const addKeyBtn = document.getElementById('add-key-btn');
        if (addKeyBtn) {
            addKeyBtn.addEventListener('click', () => TranslationManager.addKey());
        }

        // 项目选择
        form.on('select(project-select)', (data) => {
            this.currentProjectId = data.value;
            if (this.currentProjectId) {
                TranslationManager.loadKeys(this.currentProjectId);
            } else {
                TranslationManager.keysTable.reload({data: []});
            }
        });

        // 搜索项目
        const searchProjectBtn = document.getElementById('search-project-btn');
        if (searchProjectBtn) {
            searchProjectBtn.addEventListener('click', () => {
                const keyword = document.getElementById('project-search').value;
                ProjectManager.search(keyword);
            });
        }

        // 搜索Key
        const searchKeyBtn = document.getElementById('search-key-btn');
        if (searchKeyBtn) {
            searchKeyBtn.addEventListener('click', () => {
                const keyword = document.getElementById('key-search').value;
                TranslationManager.search(keyword);
            });
        }

        // 刷新按钮
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshCurrentPage());
        }

        // 表单提交事件
        form.on('submit(project-submit)', (data) => {
            ProjectManager.submitProject(data.field);
            return false;
        });

        form.on('submit(key-submit)', (data) => {
            TranslationManager.submitKey(data.field);
            return false;
        });

        form.on('submit(translation-submit)', (data) => {
            TranslationManager.submitTranslations(data.field);
            return false;
        });
    },    // 刷新当前页面
    refreshCurrentPage: function() {
        const visiblePage = document.querySelector('.page-content[style*="block"]');
        if (visiblePage && visiblePage.id === 'projects-page') {
            ProjectManager.refresh();
            this.loadProjectSelect();
        } else if (visiblePage && visiblePage.id === 'translations-page') {
            if (this.currentProjectId) {
                TranslationManager.loadKeys(this.currentProjectId);
            }
        }
        I18nUtils.showMessage('刷新完成', 'info');
    }
};

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
    console.log('I18nLite 前端应用已启动');
    window.I18nApp.init();
});
