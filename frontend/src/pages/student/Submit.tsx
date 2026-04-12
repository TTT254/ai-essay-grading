/**
 * 学生作文提交页面
 * 支持手写图片上传OCR和在线编辑，含草稿自动保存
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Upload, message, Spin, Typography, Space, Tabs, Modal, Tooltip } from 'antd';
import { InboxOutlined, SendOutlined, CameraOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuthStore } from '../../store/authStore';
import { useStudentStore } from '../../store/studentStore';
import './Submit.css';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const DRAFT_AUTO_SAVE_INTERVAL = 30000; // 30秒

const getDraftKey = (assignmentId: string, userId: string) =>
  `draft_${assignmentId}_${userId}`;

interface DraftData {
  content: string;
  savedAt: string;
}

const Submit: React.FC = () => {
  const navigate = useNavigate();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuthStore();
  const { submitEssay, uploadImage, ocrRecognize, isLoading } = useStudentStore();

  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [draftRestoreVisible, setDraftRestoreVisible] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<DraftData | null>(null);

  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  // 检查本地草稿
  useEffect(() => {
    if (!assignmentId || !user?.id) return;

    const key = getDraftKey(assignmentId, user.id);
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const draft: DraftData = JSON.parse(raw);
        if (draft.content && draft.content.trim()) {
          setPendingDraft(draft);
          setDraftRestoreVisible(true);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  }, [assignmentId, user?.id]);

  // 自动保存草稿
  const saveDraft = useCallback(() => {
    if (!assignmentId || !user?.id || !content.trim()) return;

    const key = getDraftKey(assignmentId, user.id);
    const draft: DraftData = {
      content,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(draft));
    setLastSavedAt(new Date());
  }, [assignmentId, user?.id, content]);

  useEffect(() => {
    autoSaveTimerRef.current = setInterval(saveDraft, DRAFT_AUTO_SAVE_INTERVAL);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [saveDraft]);

  const clearDraft = () => {
    if (!assignmentId || !user?.id) return;
    localStorage.removeItem(getDraftKey(assignmentId, user.id));
  };

  const handleRestoreDraft = () => {
    if (pendingDraft) {
      setContent(pendingDraft.content);
      setActiveTab('2');
    }
    setDraftRestoreVisible(false);
    setPendingDraft(null);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setDraftRestoreVisible(false);
    setPendingDraft(null);
  };

  const handleManualSave = () => {
    saveDraft();
    message.success('草稿已保存');
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        setImageUrl(url);
        message.success('图片上传成功');

        // 自动进行OCR识别
        setRecognizing(true);
        const text = await ocrRecognize(url);
        if (text) {
          setOcrResult(text);
          setContent(text);
          message.success('OCR识别成功');
          setActiveTab('2'); // 切换到编辑标签
        }
      }
    } catch {
      message.error('上传失败');
    } finally {
      setUploading(false);
      setRecognizing(false);
    }
    return false; // 阻止默认上传行为
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      message.warning('请输入作文内容');
      return;
    }

    if (!user?.id || !assignmentId) {
      message.error('缺少必要参数');
      return;
    }

    const success = await submitEssay(user.id, {
      assignment_id: assignmentId,
      content: content,
      image_url: imageUrl || undefined,
      ocr_result: ocrResult || undefined,
    });

    if (success) {
      clearDraft();
      message.success('提交成功！正在进行AI批改...');
      navigate('/student/history');
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: 'image/*',
    beforeUpload: handleImageUpload,
    showUploadList: false,
  };

  const formatSavedTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="page-container submit-page">
      <div className="page-header">
        <Title level={2}>提交作文</Title>
        <Text type="secondary">您可以上传手写作文图片进行OCR识别，或直接在线编辑</Text>
      </div>

      {/* 草稿恢复提示 */}
      <Modal
        title="发现未提交草稿"
        open={draftRestoreVisible}
        onOk={handleRestoreDraft}
        onCancel={handleDiscardDraft}
        okText="恢复草稿"
        cancelText="丢弃草稿"
      >
        <p>
          检测到您有未提交的草稿
          {pendingDraft?.savedAt && (
            <span>（保存于 {new Date(pendingDraft.savedAt).toLocaleString('zh-CN')}）</span>
          )}
          ，是否恢复？
        </p>
      </Modal>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: '1',
              label: (
                <span>
                  <CameraOutlined />
                  上传手写作文
                </span>
              ),
              children: (
                <div className="upload-section">
                  <Dragger {...uploadProps} disabled={uploading || recognizing}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
                    <p className="ant-upload-hint">
                      支持 JPG、PNG 等图片格式，上传后将自动进行OCR识别
                    </p>
                  </Dragger>

                  {(uploading || recognizing) && (
                    <div className="loading-overlay">
                      <Spin size="large" tip={recognizing ? "正在识别文字..." : "上传中..."} />
                    </div>
                  )}

                  {imageUrl && (
                    <div className="image-preview">
                      <Text strong>已上传图片：</Text>
                      <img src={imageUrl} alt="作文图片" style={{ maxWidth: '100%', marginTop: 16 }} />
                    </div>
                  )}

                  {ocrResult && (
                    <div className="ocr-result">
                      <Text strong>OCR识别结果：</Text>
                      <div className="ocr-text">{ocrResult}</div>
                      <Button
                        type="link"
                        onClick={() => setActiveTab('2')}
                      >
                        去编辑
                      </Button>
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: '2',
              label: '在线编辑',
              children: (
                <div className="editor-section">
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={modules}
                    placeholder="请输入作文内容..."
                    style={{ height: '400px', marginBottom: '60px' }}
                  />
                  <div className="word-count">
                    字数：{content.replace(/<[^>]*>/g, '').trim().length}
                  </div>
                </div>
              ),
            },
          ]}
        />

        <div className="submit-actions">
          <Space>
            {lastSavedAt && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                草稿已保存 {formatSavedTime(lastSavedAt)}
              </Text>
            )}
            <Button onClick={() => navigate('/student/tasks')}>
              取消
            </Button>
            <Tooltip title="保存草稿到本地">
              <Button
                icon={<SaveOutlined />}
                onClick={handleManualSave}
                disabled={!content.trim()}
              >
                保存草稿
              </Button>
            </Tooltip>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={isLoading}
              disabled={!content.trim()}
            >
              提交作文
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Submit;
