import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Breadcrumb } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, GlobalOutlined, HomeOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, keyAPI } from '../services/projectService';

const Keys = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchKeys();
  }, [projectId]);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const response = await projectAPI.getKeys(projectId);
      setKeys(response.data || []);
    } catch (error) {
      message.error('获取Key列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingKey(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (key) => {
    setEditingKey(key);
    form.setFieldsValue(key);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await keyAPI.delete(id);
      message.success('删除成功');
      fetchKeys();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingKey) {
        await keyAPI.update(editingKey.id, values);
        message.success('更新成功');
      } else {
        await projectAPI.createKey(projectId, values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchKeys();
    } catch (error) {
      message.error(editingKey ? '更新失败' : '创建失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Key名称',
      dataIndex: 'key_name',
      key: 'key_name',
    },
    {
      title: '默认值',
      dataIndex: 'default_value',
      key: 'default_value',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => text ? new Date(text).toLocaleString() : '',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            size="small"
            icon={<GlobalOutlined />}
            onClick={() => navigate(`/projects/${projectId}/keys/${record.id}/translations`)}
          >
            翻译
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个Key吗？"
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
        <Breadcrumb.Item>Key管理</Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Key管理 (项目ID: {projectId})</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建Key
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={keys}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      <Modal
        title={editingKey ? '编辑Key' : '新建Key'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="key_name"
            label="Key名称"
            rules={[{ required: true, message: '请输入Key名称' }]}
          >
            <Input placeholder="请输入Key名称，如：common.save" />
          </Form.Item>
          <Form.Item
            name="default_value"
            label="默认值"
            rules={[{ required: true, message: '请输入默认值' }]}
          >
            <Input placeholder="请输入默认值" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="请输入描述" rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Keys;
