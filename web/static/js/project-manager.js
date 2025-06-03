// 项目管理模块
window.ProjectManager = {
    projectsTable: null,
    
    // 初始化项目表格
    initProjectsTable: function() {
        const table = layui.table;        this.projectsTable = table.render({
            elem: '#projects-table',
            url: `${I18nUtils.API_BASE_URL}/projects`,            cols: [[
                {field: 'id', title: 'ID', width: 80, align: 'center'},
                {field: 'name', title: '项目名称', width: 200},
                {field: 'description', title: '项目描述', minWidth: 100},
                {field: 'languages', title: '支持语言', width: 150, templet: function(d) {
                    return d.languages ? d.languages.replace(/,/g, ', ') : '未设置';
                }},
                {field: 'created_at', title: '创建时间', width: 160, templet: function(d) {
                    return I18nUtils.formatDateTime(d.created_at);
                }},
                {field: 'updated_at', title: '更新时间', width: 160, templet: function(d) {
                    return I18nUtils.formatDateTime(d.updated_at);
                }},
                {title: '操作', width: 300, align: 'center', toolbar: '#projectOperations'}
            ]],
            page: true,
            limit: 10,
            limits: [10, 20, 50],
            loading: true,
            text: {
                none: '<div class="empty-state"><i class="layui-icon layui-icon-face-cry"></i><p>暂无项目数据</p><p>点击"新建项目"开始创建您的第一个项目</p></div>'
            },
            done: function(res, curr, count) {
                console.log('项目列表加载完成:', res);
            }
        });

        this.initProjectOperationsTemplate();
        this.bindProjectTableEvents();
    },

    // 初始化项目操作模板
    initProjectOperationsTemplate: function() {
        if (!document.getElementById('projectOperations')) {
            const script = document.createElement('script');
            script.type = 'text/html';
            script.id = 'projectOperations';
            script.innerHTML = `
                <div class="action-buttons">
                    <a class="layui-btn layui-btn-xs" lay-event="edit">编辑</a>
                    <a class="layui-btn layui-btn-xs layui-btn-normal" lay-event="manage">管理翻译</a>
                    <a class="layui-btn layui-btn-xs layui-btn-danger" lay-event="del">删除</a>
                </div>
            `;
            document.body.appendChild(script);
        }
    },

    // 绑定项目表格事件
    bindProjectTableEvents: function() {
        const table = layui.table;
        
        table.on('tool(projects-table)', (obj) => {
            const data = obj.data;
            if (obj.event === 'edit') {
                this.editProject(data);
            } else if (obj.event === 'del') {
                this.deleteProject(data);
            } else if (obj.event === 'manage') {
                this.manageTranslations(data);
            }
        });
    },    // 新建项目
    addProject: function() {
        layui.layer.open({
            type: 1,
            title: '新建项目',
            content: layui.jquery('#project-form-modal'),
            area: ['500px', '350px'],
            btn: false,
            success: function() {
                document.getElementById('project-form').reset();
                document.getElementById('project-id').value = '';
                layui.form.render();
            }
        });
    },    // 编辑项目
    editProject: function(data) {
        layui.layer.open({
            type: 1,
            title: '编辑项目',
            content: layui.jquery('#project-form-modal'),
            area: ['500px', '350px'],
            btn: false,            success: function() {
                document.getElementById('project-form').reset();
                document.getElementById('project-id').value = data.id;
                document.querySelector('input[name="name"]').value = data.name;
                document.querySelector('textarea[name="description"]').value = data.description;
                document.querySelector('input[name="languages"]').value = data.languages || '';
                layui.form.render();
            }
        });
    },

    // 删除项目
    deleteProject: function(data) {
        I18nUtils.confirm('确定要删除这个项目吗？删除后不可恢复！', () => {
            I18nUtils.request(`${I18nUtils.API_BASE_URL}/projects/${data.id}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (response.ok) {
                    I18nUtils.showMessage('删除成功');
                    this.refresh();
                    window.I18nApp.loadProjectSelect();
                } else {
                    I18nUtils.showMessage('删除失败', 'error');
                }
            })
            .catch(() => {
                I18nUtils.showMessage('删除失败', 'error');
            });
        }, '确认删除');
    },    // 管理翻译
    manageTranslations: function(data) {
        // 跳转到翻译管理页面，携带项目ID参数
        const url = `translations.html?projectId=${data.id}`;
        window.open(url, '_blank');
    },

    // 提交项目表单
    submitProject: function(data) {
        const isEdit = !!data.id;
        const url = isEdit ? 
            `${I18nUtils.API_BASE_URL}/projects/${data.id}` : 
            `${I18nUtils.API_BASE_URL}/projects`;
        const method = isEdit ? 'PUT' : 'POST';

        I18nUtils.request(url, {
            method: method,
            body: data
        })
        .then(response => {
            if (response.ok) {
                I18nUtils.showMessage(isEdit ? '更新成功' : '创建成功');
                layui.layer.closeAll();
                this.refresh();
                window.I18nApp.loadProjectSelect();
            } else {
                I18nUtils.showMessage(isEdit ? '更新失败' : '创建失败', 'error');
            }
        })
        .catch(() => {
            I18nUtils.showMessage(isEdit ? '更新失败' : '创建失败', 'error');
        });
    },

    // 搜索项目
    search: function(keyword) {
        if (keyword.trim()) {
            this.projectsTable.reload({
                where: {search: keyword}
            });
        } else {
            this.refresh();
        }
    },

    // 刷新项目表格
    refresh: function() {
        if (this.projectsTable) {
            this.projectsTable.reload();
        }
    }
};
