// 翻译页面专用JS
window.TranslationsPage = {
    currentProjectId: null,      // 初始化页面
    init: function() {
        layui.use(['table', 'form', 'layer', 'element', 'upload'], () => {
            // 获取layui组件
            const layer = layui.layer;
            
            this.parseUrlParams(layer);
            this.initPage();
            this.bindEvents();
              // 初始化翻译管理器
            TranslationManager.initKeysTable();
            
            if (this.currentProjectId) {
                // 先加载项目信息，再加载Keys确保语言列表已缓存
                this.loadProjectInfo().then(() => {
                    TranslationManager.loadKeys(this.currentProjectId);
                });
            }
        });
    },    // 解析URL参数
    parseUrlParams: function(layer) {
        const urlParams = new URLSearchParams(window.location.search);
        const projectIdStr = urlParams.get('projectId');
        
        if (!projectIdStr) {
            layer.msg('项目ID参数缺失，请从项目列表进入', {
                icon: 2,
                time: 3000
            }, function() {
                window.location.href = 'index.html';
            });
            return;
        }
        
        this.currentProjectId = parseInt(projectIdStr, 10);
        if (isNaN(this.currentProjectId)) {
            layer.msg('无效的项目ID参数', {
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
    },      // 加载项目信息
    loadProjectInfo: function() {
        return I18nUtils.request(`${I18nUtils.API_BASE_URL}/projects/detail/${this.currentProjectId}`)
            .then(response => response.json())
            .then((response) => {
                if (response.data) {
                    const project = response.data;
                    document.getElementById('current-project-name').textContent = project.name;
                    document.title = `翻译管理 - ${project.name} - I18nLite`;
                    
                    // 缓存项目语言列表，用于计算翻译进度
                    const languages = project.languages ? project.languages.split(',').map(lang => lang.trim()) : [];
                    I18nUtils.setProjectLanguages(languages);
                    
                    return project; // 返回项目数据
                }
            })
            .catch(() => {
                I18nUtils.showMessage('加载项目信息失败', 'error');
                throw new Error('加载项目信息失败');
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
          // 导入PO文件按钮
        const importPoBtn = document.getElementById('import-po-btn');
        if (importPoBtn) {
            importPoBtn.addEventListener('click', () => this.showImportPOModal());
        }

        // 导出PO文件按钮
        const exportPoBtn = document.getElementById('export-po-btn');
        if (exportPoBtn) {
            exportPoBtn.addEventListener('click', () => this.showExportPOModal());
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
        }        // 表单提交事件
        form.on('submit(key-submit)', (data) => {
            data.field.project_id = this.currentProjectId; // 现在已经是数字了
            TranslationManager.submitKey(data.field);
            return false;
        });
        
        form.on('submit(translation-submit)', (data) => {
            TranslationManager.submitTranslations(data.field);
            return false;
        });
    },      // 刷新页面
    refreshPage: function() {
        if (this.currentProjectId) {
            this.loadProjectInfo().then(() => {
                TranslationManager.loadKeys(this.currentProjectId);
            });
        }
        I18nUtils.showMessage('刷新完成', 'info');
    },// 显示导入PO文件弹窗
    showImportPOModal: function() {
        if (!this.currentProjectId) {
            I18nUtils.showMessage('请先选择项目', 'error');
            return;
        }

        const layer = layui.layer;
        layer.open({
            type: 1,
            title: '导入PO文件',
            content: layui.jquery('#import-po-modal'),
            area: ['600px', '400px'],
            success: () => {
                // 初始化文件上传
                this.initPOUpload();
            }        });
    },

    // 初始化PO文件上传
    initPOUpload: function() {
        // 直接使用已经初始化的layui upload组件
        const upload = layui.upload;
        if (!upload) {
            I18nUtils.showMessage('LayUI upload组件未加载', 'error');
            return;
        }
        
        this.selectedFiles = [];
        
        upload.render({
            elem: '#po-file-upload',
            url: '', // 这里不设置url，因为我们要手动处理
            accept: 'file',
            exts: 'po',
            multiple: true,
            auto: false, // 不自动上传
            choose: (obj) => {
                const files = obj.pushFile();
                
                // 清空之前的文件列表
                this.selectedFiles = [];
                const uploadList = document.querySelector('#po-upload-list .layui-upload-list');
                if (uploadList) {
                    uploadList.innerHTML = '';
                }
                
                // 显示文件列表
                obj.preview((index, file, result) => {
                    this.selectedFiles.push(file);
                    
                    const div = document.createElement('div');
                    div.innerHTML = `
                        <p>
                            <i class="layui-icon layui-icon-file"></i>
                            ${file.name}
                            <span style="color: #5FB878;"> (${(file.size/1024).toFixed(1)}KB)</span>
                        </p>
                    `;
                    uploadList.appendChild(div);
                });
                
                document.getElementById('po-upload-list').classList.remove('layui-hide');
            }
        });
        
        // 绑定开始导入按钮
        const startImportBtn = document.getElementById('start-import-btn');
        if (startImportBtn) {
            startImportBtn.onclick = () => this.startImportPO();
        }
    },    // 开始导入PO文件
    startImportPO: function() {
        if (!this.selectedFiles || this.selectedFiles.length === 0) {
            I18nUtils.showMessage('请选择要导入的PO文件', 'error');
            return;
        }

        // 直接使用已经初始化的layui layer组件
        const layer = layui.layer;
        if (!layer) {
            I18nUtils.showMessage('LayUI layer组件未加载', 'error');
            return;
        }

        const formData = new FormData();
        
        // 添加文件到FormData
        this.selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        // 显示加载动画
        const loadingIndex = layer.load(1, { shade: [0.5, '#fff'] });

        // 发送请求
        fetch(`${I18nUtils.API_BASE_URL}/projects/${this.currentProjectId}/import/po`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            layer.close(loadingIndex);
            
            if (data.code === 0) {
                this.showImportResults(data.data);
                // 关闭导入弹窗
                layer.closeAll();
                // 刷新页面数据
                this.refreshPage();
            } else {
                I18nUtils.showMessage(data.error || '导入失败', 'error');
            }
        })
        .catch(error => {
            layer.close(loadingIndex);
            console.error('导入PO文件失败:', error);
            I18nUtils.showMessage('导入PO文件失败，请检查网络连接', 'error');
        });
    },

    // 显示导入结果
    showImportResults: function(data) {
        // 直接使用已经初始化的layui layer组件
        const layer = layui.layer;
        if (!layer) {
            console.error('LayUI layer组件未加载');
            return;
        }

        const { results, summary } = data;
        
        let html = `
            <div style="padding: 20px;">
                <h3>导入结果</h3>
                <div style="margin: 15px 0; padding: 10px; background: #f2f2f2; border-radius: 4px;">
                    <p><strong>总计：</strong></p>
                    <p>• 处理文件数：${summary.files_processed} 个</p>
                    <p>• 总Key数：${summary.total_keys} 个</p>
                    <p>• 新增Key：${summary.new_keys} 个</p>
                    <p>• 翻译数：${summary.total_translations} 个</p>
                    <p>• 更新翻译：${summary.updated_translations} 个</p>
                </div>
                <h4>详细结果：</h4>
                <div style="max-height: 300px; overflow-y: auto;">
        `;
        
        results.forEach(result => {
            const statusClass = result.success ? 'success' : 'error';
            const statusText = result.success ? '成功' : '失败';
            const stats = result.stats;
            
            html += `
                <div style="margin: 10px 0; padding: 10px; border: 1px solid #e6e6e6; border-radius: 4px;">
                    <p><strong>${result.filename}</strong> - <span style="color: ${result.success ? '#5FB878' : '#FF5722'}">${statusText}</span></p>
                    <p style="color: #666; font-size: 12px;">${result.message}</p>
                    ${result.success ? `
                        <p style="font-size: 12px; color: #666;">
                            Key: ${stats.keys} 个 (新增: ${stats.new_keys}) | 
                            翻译: ${stats.translations} 个 (更新: ${stats.updated})
                        </p>
                    ` : ''}
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        layer.open({
            type: 1,
            title: 'PO文件导入结果',
            content: html,
            area: ['600px', '500px'],
            btn: ['确定'],
            yes: function(index) {
                layer.close(index);            }
        });
    },

    // 显示导出PO文件弹窗
    showExportPOModal: function() {
        if (!this.currentProjectId) {
            I18nUtils.showMessage('请先选择项目', 'error');
            return;
        }

        const layer = layui.layer;
        const form = layui.form;
        
        layer.open({
            type: 1,
            title: '导出PO文件',
            content: layui.jquery('#export-po-modal'),
            area: ['500px', '400px'],
            success: () => {
                // 初始化导出选项
                this.initExportOptions();
                // 监听导出格式变化
                form.on('radio(export-format)', (data) => {
                    this.toggleLanguageSelect(data.value);
                });
            }
        });
    },

    // 初始化导出选项
    initExportOptions: function() {
        // 加载项目支持的语言列表
        const languages = I18nUtils.getProjectLanguages();
        const select = document.getElementById('export-language');
        if (select && languages.length > 0) {
            select.innerHTML = '<option value="">请选择语言</option>';
            languages.forEach(lang => {
                const option = document.createElement('option');
                option.value = lang;
                option.textContent = lang;
                select.appendChild(option);
            });
            layui.form.render('select');
        }

        // 绑定开始导出按钮
        const startExportBtn = document.getElementById('start-export-btn');
        if (startExportBtn) {
            startExportBtn.onclick = () => this.startExportPO();
        }
    },

    // 切换语言选择显示/隐藏
    toggleLanguageSelect: function(format) {
        const languageSelectItem = document.getElementById('language-select-item');
        if (languageSelectItem) {
            if (format === 'single') {
                languageSelectItem.style.display = 'block';
            } else {
                languageSelectItem.style.display = 'none';
            }
        }
    },

    // 开始导出PO文件
    startExportPO: function() {
        const layer = layui.layer;
        
        // 获取导出选项
        const formatRadios = document.querySelectorAll('input[name="export-format"]:checked');
        const format = formatRadios.length > 0 ? formatRadios[0].value : 'zip';
        
        let url = `${I18nUtils.API_BASE_URL}/projects/${this.currentProjectId}/export/po?format=${format}`;
        
        // 如果是单个文件导出，需要选择语言
        if (format === 'single') {
            const language = document.getElementById('export-language').value;
            if (!language) {
                I18nUtils.showMessage('请选择要导出的语言', 'error');
                return;
            }
            url += `&lang=${encodeURIComponent(language)}`;
        }

        // 显示加载动画
        const loadingIndex = layer.load(1, { shade: [0.5, '#fff'] });

        // 创建一个隐藏的a标签来下载文件
        const link = document.createElement('a');
        link.href = url;
        link.style.display = 'none';
        document.body.appendChild(link);
        
        // 监听下载完成
        const cleanup = () => {
            layer.close(loadingIndex);
            document.body.removeChild(link);
        };

        // 触发下载
        link.click();
        
        // 由于无法直接监听下载完成，使用延时关闭加载动画
        setTimeout(() => {
            cleanup();
            layer.closeAll(); // 关闭导出弹窗
            I18nUtils.showMessage('导出请求已发送，请检查下载', 'success');
        }, 1000);
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('翻译管理页面已启动');
    window.TranslationsPage.init();
});
