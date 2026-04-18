/**
 * 学生作文提交页面
 * 支持手写图片上传OCR和在线编辑，含草稿自动保存、实时字数统计、写作建议侧边栏
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Upload, message, Spin, Typography, Space, Tabs, Modal, Tooltip } from 'antd';
import { InboxOutlined, SendOutlined, CameraOutlined, SaveOutlined, BulbOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
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

const WRITING_TIPS = [
  '开头要有吸引力，用生动的场景或问题引入主题',
  '注意段落结构，每段围绕一个中心意思展开',
  '多用具体的例子和细节，避免空洞的描述',
  '结尾要有总结或升华，呼应开头或点明主旨',
];

const getWordCountStatus = (count: number, min: number | undefined) => {
  if (!min) return { color: 'gray', pct: 0 };
  const pct = Math.min(Math.round((count / min) * 100), 100);
  if (count < min * 0.6) return { color: 'red', pct };
  if (count < min) return { color: 'orange', pct };
  return { color: 'green', pct };
};

const Submit: React.FC = () => {
  const navigate = useNavigate();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuthStore();
  const { submitEssay, uploadImage, ocrRecognize, isLoading, assignments } = useStudentStore();

  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [draftRestoreVisible, setDraftRestoreVisible] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<DraftData | null>(null);
  const [tipsCollapsed, setTipsCollapsed] = useState(false);

  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // TipTap editor instance
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: '请输入作文内容...' }),
    ],
    content: content,
    onUpdate: ({ editor: e }) => {
      setContent(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
      },
    },
  });

  // 当前作业信息（用于字数要求）
  const currentAssignment = assignments.find((a) => a.id === assignmentId);
  const wordCountMin = currentAssignment?.word_count_min;

  // 纯文本字数
  const plainText = content.replace(/<[^>]*>/g, '').trim();
  const wordCount = plainText.length;
  const wcStatus = getWordCountStatus(wordCount, wordCountMin);

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
      editor?.commands.setContent(pendingDraft.content);
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
          const htmlContent = `<p>${text.replace(/\n/g, '</p><p>')}</p>`;
          setContent(htmlContent);
          editor?.commands.setContent(htmlContent);
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

  const wcBarColor = wcStatus.color === 'green' ? '#52c41a' : wcStatus.color === 'orange' ? '#fa8c16' : wcStatus.color === 'red' ? '#f5222d' : '#d9d9d9';

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

      <div className="submit-layout">
        <div className="submit-main">
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
                      <EditorContent
                        editor={editor}
                        style={{ height: '400px', marginBottom: '60px' }}
                      />
                      {/* 实时字数统计 */}
                      <div className="word-count-bar-wrap">
                        <div className={`word-count-label ${wcStatus.color}`}>
                          <span>
                            已写 <strong>{wordCount}</strong> 字
                            {wordCountMin ? ` / 最少 ${wordCountMin} 字` : ''}
                          </span>
                          {wordCountMin && wordCount >= wordCountMin && (
                            <span style={{ fontSize: 12 }}>达标</span>
                          )}
                        </div>
                        {wordCountMin && (
                          <div className="word-count-progress">
                            <div
                              className="word-count-progress-inner"
                              style={{ width: `${wcStatus.pct}%`, background: wcBarColor }}
                            />
                          </div>
                        )}
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

        {/* 写作建议侧边栏 */}
        <div className={`writing-tips-panel${tipsCollapsed ? ' collapsed' : ''}`}>
          <div className="writing-tips-toggle" onClick={() => setTipsCollapsed(!tipsCollapsed)}>
            {!tipsCollapsed && (
              <>
                <span className="writing-tips-toggle-label">
                  <BulbOutlined style={{ marginRight: 6 }} />
                  写作建议
                </span>
                <LeftOutlined style={{ fontSize: 12, color: '#0066FF' }} />
              </>
            )}
            {tipsCollapsed && (
              <RightOutlined style={{ fontSize: 12, color: '#0066FF', margin: '0 auto' }} />
            )}
          </div>
          {!tipsCollapsed && (
            <div className="writing-tips-body">
              {WRITING_TIPS.map((tip, i) => (
                <div key={i} className="writing-tip-item">
                  <div className="writing-tip-dot" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Submit;
