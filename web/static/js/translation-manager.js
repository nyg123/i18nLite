// 翻译管理模块
window.TranslationManager = {
    keysTable: null,
    
    // 初始化Keys表格
    initKeysTable: function() {
        const table = layui.table;
        
        this.keysTable = table.render({
            elem: '#keys-table',
            cols: [[
                {field: 'id', title: 'ID', width: 80, align: 'center'},
                {field: 'key_name', title: 'Key名称', width: 200},
                {field: 'description', title: '描述', minWidth: 200},
                {field: 'translation_status', title: '翻译状态', width: 120, align: 'center', templet: function(d) {
                    const status = I18nUtils.getTranslationStatus(d);
                    return `<span class="translation-status ${status.class}"></span>${status.text}`;
                }},
                {field: 'translation_progress', title: '翻译进度', width: 120, templet: function(d) {
                    const progress = I18nUtils.getTranslationProgress(d);
                    return `
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span style="font-size: 12px; color: #666;">${progress}%</span>
                    `;
                }},
                {field: 'created_at', title: '创建时间', width: 160, templet: function(d) {
                    return I18nUtils.formatDateTime(d.created_at);
                }},
                {title: '操作', width: 200, align: 'center', toolbar: '#keyOperations'}
            ]],
            data: [],
            page: true,
            limit: 10,
            limits: [10, 20, 50],
            text: {
                none: '<div class="empty-state"><i class="layui-icon layui-icon-file"></i><p>暂无Key数据</p><p>请先选择项目，然后添加翻译Key</p></div>'
            }
        });

        this.initKeyOperationsTemplate();
        this.bindKeyTableEvents();
    },

    // 初始化Key操作模板
    initKeyOperationsTemplate: function() {
        if (!document.getElementById('keyOperations')) {
            const script = document.createElement('script');
            script.type = 'text/html';
            script.id = 'keyOperations';
            script.innerHTML = `
                <div class="action-buttons">
                    <a class="layui-btn layui-btn-xs layui-btn-normal" lay-event="translate">翻译</a>
                    <a class="layui-btn layui-btn-xs" lay-event="edit">编辑</a>
                    <a class="layui-btn layui-btn-xs layui-btn-danger" lay-event="del">删除</a>
                </div>
            `;
            document.body.appendChild(script);
        }
    },

    // 绑定Key表格事件
    bindKeyTableEvents: function() {
        const table = layui.table;
        
        table.on('tool(keys-table)', (obj) => {
            const data = obj.data;
            if (obj.event === 'edit') {
                this.editKey(data);
            } else if (obj.event === 'del') {
                this.deleteKey(data);
            } else if (obj.event === 'translate') {
                this.editTranslations(data);
            }
        });
    },

    // 加载Keys
    loadKeys: function(projectId) {
        I18nUtils.request(`${I18nUtils.API_BASE_URL}/projects/${projectId}/keys`)
            .then(response => response.json())
            .then((response) => {
                this.keysTable.reload({
                    data: response.data || []
                });
            })
            .catch(() => {
                I18nUtils.showMessage('加载Key列表失败', 'error');
            });
    },

    // 新建Key
    addKey: function() {
        const currentProjectId = window.I18nApp.getCurrentProject();
        if (!currentProjectId) {
            I18nUtils.showMessage('请先选择一个项目', 'warning');
            return;
        }        layui.layer.open({
            type: 1,
            title: '新建Key',
            content: layui.jquery('#key-form-modal'),
            area: ['500px', '350px'],
            btn: false,
            success: function() {
                document.getElementById('key-form').reset();
                document.getElementById('key-id').value = '';
                document.getElementById('key-project-id').value = currentProjectId;
                layui.form.render();
            }
        });
    },

    // 编辑Key
    editKey: function(data) {        layui.layer.open({
            type: 1,
            title: '编辑Key',
            content: layui.jquery('#key-form-modal'),
            area: ['500px', '350px'],
            btn: false,
            success: function() {
                document.getElementById('key-form').reset();
                document.getElementById('key-id').value = data.id;
                document.getElementById('key-project-id').value = data.project_id;
                document.querySelector('input[name="key_name"]').value = data.key_name;
                document.querySelector('textarea[name="description"]').value = data.description;
                layui.form.render();
            }
        });
    },

    // 删除Key
    deleteKey: function(data) {
        I18nUtils.confirm('确定要删除这个Key吗？', () => {
            I18nUtils.request(`${I18nUtils.API_BASE_URL}/keys/${data.id}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (response.ok) {
                    I18nUtils.showMessage('删除成功');
                    this.loadKeys(window.I18nApp.getCurrentProject());
                } else {
                    I18nUtils.showMessage('删除失败', 'error');
                }
            })
            .catch(() => {
                I18nUtils.showMessage('删除失败', 'error');
            });
        }, '确认删除');
    },

    // 提交Key表单
    submitKey: function(data) {
        const isEdit = !!data.id;
        const url = isEdit ? 
            `${I18nUtils.API_BASE_URL}/keys/${data.id}` : 
            `${I18nUtils.API_BASE_URL}/projects/${data.project_id}/keys`;
        const method = isEdit ? 'PUT' : 'POST';

        I18nUtils.request(url, {
            method: method,
            body: data
        })
        .then(response => {
            if (response.ok) {
                I18nUtils.showMessage(isEdit ? '更新成功' : '创建成功');
                layui.layer.closeAll();
                this.loadKeys(window.I18nApp.getCurrentProject());
            } else {
                I18nUtils.showMessage(isEdit ? '更新失败' : '创建失败', 'error');
            }
        })
        .catch(() => {
            I18nUtils.showMessage(isEdit ? '更新失败' : '创建失败', 'error');
        });
    },    // 编辑翻译
    editTranslations: function(keyData) {
        const currentProjectId = window.I18nApp.getCurrentProject();
        
        // 首先获取项目的语言列表
        I18nUtils.request(`${I18nUtils.API_BASE_URL}/projects/detail/${currentProjectId}`)
            .then(response => response.json())
            .then((projectResponse) => {
                const project = projectResponse.data;
                const languages = project.languages ? project.languages.split(',') : [];
                
                // 获取当前Key的翻译
                return I18nUtils.request(`${I18nUtils.API_BASE_URL}/key-translations/${keyData.id}`)
                    .then(response => response.json())
                    .then((translationResponse) => {
                        const translations = translationResponse.data || [];
                        this.showTranslationModal(keyData, languages, translations);
                    });
            })
            .catch(() => {
                I18nUtils.showMessage('获取翻译数据失败', 'error');
            });
    },

    // 显示翻译编辑弹窗
    showTranslationModal: function(keyData, languages, translations) {
        const translationInputs = document.getElementById('translation-inputs');
        translationInputs.innerHTML = '';

        languages.forEach((lang) => {
            const langCode = lang.trim();
            const translation = translations.find(t => t.language === langCode);
            const value = translation ? translation.content : '';

            const editorDiv = document.createElement('div');
            editorDiv.className = 'translation-editor';
            editorDiv.innerHTML = `
                <div class="translation-editor-header">${langCode}</div>
                <div class="translation-editor-body">
                    <textarea name="translations[${langCode}]" placeholder="请输入${langCode}的翻译内容" class="layui-textarea">${value}</textarea>
                </div>
            `;
            translationInputs.appendChild(editorDiv);
        });        layui.layer.open({
            type: 1,
            title: `编辑翻译 - ${keyData.key_name}`,
            content: layui.jquery('#translation-form-modal'),
            area: ['600px', '500px'],
            btn: false,
            success: function() {
                document.getElementById('translation-key-id').value = keyData.id;
                layui.form.render();
            }
        });
    },

    // 提交翻译
    submitTranslations: function(data) {
        const keyId = data.key_id;
        const translations = [];

        // 解析翻译数据
        Object.keys(data).forEach((key) => {
            if (key.startsWith('translations[')) {
                const language = key.match(/translations\[(.+)\]/)[1];
                const content = data[key];
                if (content.trim()) {
                    translations.push({
                        language: language,
                        content: content
                    });
                }
            }
        });

        I18nUtils.request(`${I18nUtils.API_BASE_URL}/key-translations/${keyId}/batch`, {
            method: 'PUT',
            body: {translations: translations}
        })
        .then(response => {
            if (response.ok) {
                I18nUtils.showMessage('翻译保存成功');
                layui.layer.closeAll();
                this.loadKeys(window.I18nApp.getCurrentProject());
            } else {
                I18nUtils.showMessage('翻译保存失败', 'error');
            }
        })
        .catch(() => {
            I18nUtils.showMessage('翻译保存失败', 'error');
        });
    },

    // 搜索Keys
    search: function(keyword) {
        const currentProjectId = window.I18nApp.getCurrentProject();
        if (!currentProjectId) {
            I18nUtils.showMessage('请先选择项目', 'warning');
            return;
        }
        
        if (keyword.trim()) {
            this.keysTable.reload({
                where: {search: keyword}
            });
        } else {
            this.loadKeys(currentProjectId);
        }
    }
};
