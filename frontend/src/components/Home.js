import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Alert } from 'antd';
import { ProjectOutlined, KeyOutlined, GlobalOutlined } from '@ant-design/icons';
import { healthCheck } from '../services/projectService';

const Home = () => {
  const [status, setStatus] = useState('loading');
  const [serverInfo, setServerInfo] = useState(null);

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await healthCheck();
      setServerInfo(response);
      setStatus('success');
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div>
      <h1>I18nLite 多语言管理工具</h1>
      
      {status === 'error' && (
        <Alert
          message="服务器连接失败"
          description="无法连接到后端服务，请检查服务是否正常运行"
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      
      {status === 'success' && (
        <Alert
          message="服务器状态正常"
          description={serverInfo?.message || '后端服务正常运行'}
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="总项目数"
              value={0}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="总Key数"
              value={0}
              prefix={<KeyOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="总翻译数"
              value={0}
              prefix={<GlobalOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Card title="功能介绍" style={{ marginTop: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <h3>📁 项目管理</h3>
            <p>创建和管理多个国际化项目，支持不同产品线的独立管理。</p>
          </Col>
          <Col xs={24} md={12}>
            <h3>🔑 Key管理</h3>
            <p>管理翻译键值，支持层级结构和批量操作。</p>
          </Col>
          <Col xs={24} md={12}>
            <h3>🌍 多语言翻译</h3>
            <p>支持多种语言的翻译管理，实时编辑和预览。</p>
          </Col>
          <Col xs={24} md={12}>
            <h3>📥📤 导入导出</h3>
            <p>支持PO文件和Excel格式的批量导入导出。</p>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Home;
