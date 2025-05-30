import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space, Breadcrumb, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined, SaveOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { keyAPI, translationAPI } from '../services/projectService';

const { Option } = Select;

const Translations = () => {
  const { projectId, keyId } = useParams();
  const navigate = useNavigate();
  const [translations, setTranslations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState(null);
  const [batchMode, setBatchMode] = useState(false);
  const [form] = Form.useForm();

  // 支持的语言列表
  const languages = [
    { code: 'zh-CN', name: '简体中文' },
    { code: 'zh-TW', name: '繁体中文' },
    { code: 'en-US', name: '英语' },
    { code: 'ja-JP', name: '日语' },
    { code: 'ko-KR', name: '韩语' },
    { code: 'fr-FR', name: '法语' },
    { code: 'de-DE', name: '德语' },
    { code: 'es-ES', name: '西班牙语' },
    { code: 'it-IT', name: '意大利语' },
    { code: 'pt-PT', name: '葡萄牙语' },
    { code: 'ru-RU', name: '俄语' },
    { code: 'ar-SA', name: '阿拉伯语' },
  ];

  useEffect(() => {
    fetchTranslations();
  }, [keyId]);

  const fetchTranslations = async () => {
    setLoading(true);
    try {
      const response = await keyAPI.getTranslations(keyId);
      setTranslations(response.data || []);
    } catch (error) {
      message.error('获取翻译列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTranslation(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (translation) => {
    setEditingTranslation(translation);
    form.setFieldsValue(translation);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await translationAPI.delete(id);
      message.success('删除成功');
      fetchTranslations();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingTranslation) {
        await translationAPI.update(editingTranslation.id, values);
        message.success('更新成功');
      } else {
        await keyAPI.createTranslation(keyId, values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchTranslations();
    } catch (error) {
      message.error(editingTranslation ? '更新失败' : '创建失败');
    }
  };

  const handleBatchUpdate = async () => {
    // 实现批量更新逻辑
    message.info('批量更新功能待实现');
  };

  const getLanguageName = (code) => {
    const lang = languages.find(l => l.code === code);
    return lang ? lang.name : code;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '语言',
      dataIndex: 'language_code',
      key: 'language_code',
      width: 120,
      render: (code) => (
        <span>
          {getLanguageName(code)} ({code})
        </span>
      ),
    },
    {
      title: '翻译内容',
      dataIndex: 'translation_value',
      key: 'translation_value',
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (text) => text ? new Date(text).toLocaleString() : '',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个翻译吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <HomeOutlined onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
        </Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate('/projects')} style={{ cursor: 'pointer' }}>
          项目管理
        </Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate(`/projects/${projectId}/keys`)} style={{ cursor: 'pointer' }}>
          Key管理
        </Breadcrumb.Item>
        <Breadcrumb.Item>翻译管理</Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>翻译管理 (Key ID: {keyId})</h2>
        <Space>
          <Button icon={<SaveOutlined />} onClick={handleBatchUpdate}>
            批量更新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建翻译
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={translations}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      <Modal
        title={editingTranslation ? '编辑翻译' : '新建翻译'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="language_code"
            label="语言"
            rules={[{ required: true, message: '请选择语言' }]}
          >
            <Select placeholder="请选择语言" showSearch>
              {languages.map(lang => (
                <Option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.code})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="translation_value"
            label="翻译内容"
            rules={[{ required: true, message: '请输入翻译内容' }]}
          >
            <Input.TextArea placeholder="请输入翻译内容" rows={6} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Translations;
