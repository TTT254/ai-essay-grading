/**
 * AI对话辅导页面 - 重新设计版
 */
import React, { useState, useEffect, useRef } from 'react';
import { Avatar, Button, Spin, Typography } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import './AIChat.css';

const { Text } = Typography;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const AIChat: React.FC = () => {
  const navigate = useNavigate();
  const { submissionId } = useParams<{ submissionId: string }>();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    if (!user?.id || !submissionId) return;

    setLoadingHistory(true);
    try {
      const data = await api.aiChat.getHistory(user.id, submissionId);
      // 后端返回 { success, data: [{question, answer, ...}] }
      // 转换为前端格式 [{role: 'user', content: question}, {role: 'assistant', content: answer}]
      const conversations = data?.data ?? [];
      const historyMessages = conversations.flatMap((item: any) => [
        {
          id: `history-user-${item.id}`,
          role: 'user' as const,
          content: item.question,
          timestamp: item.created_at ?? new Date().toISOString(),
        },
        {
          id: `history-ai-${item.id}`,
          role: 'assistant' as const,
          content: item.answer,
          timestamp: item.created_at ?? new Date().toISOString(),
        },
      ]);
      setMessages(historyMessages);
    } catch (err: unknown) {
      void err;
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !user?.id || !submissionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await api.aiChat.sendMessage(user.id, submissionId, inputValue);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      void err;
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我遇到了一些问题，请稍后再试。',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="ai-chat-layout">
      {/* Top bar */}
      <div className="chat-topbar">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="chat-back-btn"
        >
          返回
        </Button>
        <div className="chat-topbar-title">
          <RobotOutlined style={{ color: '#0066FF', marginRight: 8 }} />
          <span>AI写作辅导</span>
        </div>
        {submissionId && (
          <div className="chat-context-tag">
            <Text type="secondary" style={{ fontSize: 12 }}>
              作文 #{submissionId.slice(0, 8)}
            </Text>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="chat-messages-area">
        {loadingHistory ? (
          <div className="chat-loading">
            <Spin size="large" tip="加载历史消息..." />
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="chat-empty-icon">
              <RobotOutlined />
            </div>
            <div className="chat-empty-title">你好，我是AI写作助手</div>
            <div className="chat-empty-desc">
              我可以帮你分析作文中的问题，提供写作建议和改进方向。
            </div>
            <div className="chat-empty-hints">
              <span className="chat-hint-chip">这篇作文哪里可以改进？</span>
              <span className="chat-hint-chip">帮我分析文章结构</span>
              <span className="chat-hint-chip">如何提升语言表达？</span>
            </div>
          </div>
        ) : (
          <div className="chat-message-list">
            {messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.role}`}>
                {message.role === 'assistant' && (
                  <Avatar
                    icon={<RobotOutlined />}
                    className="chat-avatar ai-avatar"
                  />
                )}
                <div className="chat-bubble-wrap">
                  <div className={`chat-bubble ${message.role}`}>
                    {message.content}
                  </div>
                </div>
                {message.role === 'user' && (
                  <Avatar
                    icon={<UserOutlined />}
                    className="chat-avatar user-avatar"
                  />
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-message assistant">
                <Avatar
                  icon={<RobotOutlined />}
                  className="chat-avatar ai-avatar"
                />
                <div className="chat-bubble-wrap">
                  <div className="chat-bubble assistant typing-indicator">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        <div className="chat-input-inner">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={inputValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="输入问题... (Enter 发送，Shift+Enter 换行)"
            rows={1}
            disabled={loading}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={loading}
            disabled={!inputValue.trim()}
            className="chat-send-btn"
          />
        </div>
      </div>
    </div>
  );
};

export default AIChat;
