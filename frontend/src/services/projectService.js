import api from './api';

// 项目相关API
export const projectAPI = {
  // 获取所有项目
  getAll: () => api.get('/projects'),
  
  // 创建项目
  create: (data) => api.post('/projects', data),
  
  // 更新项目
  update: (id, data) => api.put(`/projects/${id}`, data),
  
  // 删除项目
  delete: (id) => api.delete(`/projects/${id}`),
  
  // 获取项目的所有Key
  getKeys: (projectId) => api.get(`/projects/${projectId}/keys`),
  
  // 创建Key
  createKey: (projectId, data) => api.post(`/projects/${projectId}/keys`, data),
};

// Key相关API
export const keyAPI = {
  // 更新Key
  update: (id, data) => api.put(`/keys/${id}`, data),
  
  // 删除Key
  delete: (id) => api.delete(`/keys/${id}`),
  
  // 获取Key的所有翻译
  getTranslations: (keyId) => api.get(`/keys/${keyId}/translations`),
  
  // 创建翻译
  createTranslation: (keyId, data) => api.post(`/keys/${keyId}/translations`, data),
  
  // 批量更新翻译
  batchUpdateTranslations: (keyId, data) => api.put(`/keys/${keyId}/translations/batch`, data),
};

// 翻译相关API
export const translationAPI = {
  // 更新翻译
  update: (id, data) => api.put(`/translations/${id}`, data),
  
  // 删除翻译
  delete: (id) => api.delete(`/translations/${id}`),
};

// 健康检查
export const healthCheck = () => api.get('/health');
