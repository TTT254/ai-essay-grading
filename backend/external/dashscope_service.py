"""
阿里云百炼 API 服务封装
使用 OpenAI SDK 兼容模式调用（胶水编程示例）

技术亮点：
1. 使用官方SDK，不自己封装HTTP调用
2. 统一接口，便于切换模型
3. 流式输出支持
"""
import os
from typing import List, Dict, Any, Optional
from openai import OpenAI
from core.config import settings


class DashScopeService:
    """阿里云百炼服务类"""

    def __init__(self):
        """初始化客户端"""
        self.client = OpenAI(
            api_key=settings.DASHSCOPE_API_KEY,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        )

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "qwen-plus",
        temperature: float = 0.7,
        max_tokens: int = 2000,
        stream: bool = False,
    ) -> Dict[str, Any] | Any:
        """
        对话补全（AI批改、对话辅导等场景）

        Args:
            messages: 对话消息列表，格式：[{"role": "user", "content": "..."}]
            model: 模型名称，默认 qwen-plus
            temperature: 温度参数，控制随机性
            max_tokens: 最大token数
            stream: 是否流式输出

        Returns:
            非流式：字典格式的响应
            流式：生成器对象
        """
        try:
            completion = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream,
                stream_options={"include_usage": True} if stream else None,
            )

            if stream:
                return completion  # 返回流式生成器

            # 非流式：返回解析后的内容
            return {
                "content": completion.choices[0].message.content,
                "model": completion.model,
                "usage": {
                    "prompt_tokens": completion.usage.prompt_tokens,
                    "completion_tokens": completion.usage.completion_tokens,
                    "total_tokens": completion.usage.total_tokens,
                },
            }
        except Exception as e:
            print(f"阿里云百炼API调用失败: {str(e)}")
            raise

    async def ocr_recognize(
        self, image_url: str, model: str = "qwen-vl-plus"
    ) -> Dict[str, Any]:
        """
        OCR 图像识别（手写作文识别）

        Args:
            image_url: 图片URL（Supabase Storage URL）
            model: 多模态模型，默认 qwen-vl-plus

        Returns:
            识别结果字典
        """
        try:
            completion = self.client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": image_url}},
                            {
                                "type": "text",
                                "text": "请识别这张图片中的所有文字，按原文顺序输出，不要添加任何解释。",
                            },
                        ],
                    }
                ],
            )

            text = completion.choices[0].message.content
            return {
                "text": text,
                "model": completion.model,
                "success": True,
            }
        except Exception as e:
            print(f"OCR识别失败: {str(e)}")
            return {
                "text": "",
                "error": str(e),
                "success": False,
            }

    async def grade_essay(
        self, essay_content: str, assignment_title: str = ""
    ) -> Dict[str, Any]:
        """
        作文批改（核心功能）

        Args:
            essay_content: 作文内容
            assignment_title: 作文题目（可选）

        Returns:
            批改结果，包含分数、错误列表、评语等
        """
        # 构建批改提示词
        prompt = f"""
你是一位专业的语文教师，请对以下作文进行详细批改。

作文题目：{assignment_title if assignment_title else "无"}
作文内容：
{essay_content}

请按照以下JSON格式输出批改结果（只输出JSON，不要其他内容）：
{{
  "total_score": 85,
  "scores": {{
    "content": 30,
    "structure": 25,
    "language": 20,
    "writing": 10
  }},
  "errors": [
    {{
      "type": "typo",
      "position": [10, 12],
      "original": "的地",
      "suggestion": "的",
      "description": "地得不分"
    }}
  ],
  "comment": "本文立意明确，结构清晰..."
}}

评分标准：
- content（思想内容，满分35）：主题明确、立意深刻、内容充实
- structure（结构安排，满分25）：结构完整、层次清晰、过渡自然
- language（语言表达，满分25）：语言流畅、用词准确、修辞恰当
- writing（文字书写，满分15）：书写规范、标点正确

错误类型（type）：
- typo: 错别字
- grammar: 语法错误、病句
- logic: 逻辑问题
- structure: 结构问题
"""

        try:
            result = await self.chat_completion(
                messages=[{"role": "user", "content": prompt}],
                model="qwen-plus",
                temperature=0.5,  # 降低随机性，提高稳定性
                max_tokens=3000,
            )

            # 解析JSON结果
            import json

            content = result["content"]

            # 尝试提取JSON（去除可能的markdown标记）
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            grading_result = json.loads(content)
            grading_result["success"] = True
            grading_result["model_usage"] = result["usage"]

            return grading_result

        except json.JSONDecodeError as e:
            print(f"JSON解析失败: {str(e)}")
            print(f"原始内容: {result.get('content', '')}")
            # 返回降级结果
            return {
                "total_score": 0,
                "scores": {"content": 0, "structure": 0, "language": 0, "writing": 0},
                "errors": [],
                "comment": "AI批改失败，请联系管理员。",
                "success": False,
                "error": f"JSON解析失败: {str(e)}",
            }
        except Exception as e:
            print(f"批改失败: {str(e)}")
            return {
                "total_score": 0,
                "scores": {"content": 0, "structure": 0, "language": 0, "writing": 0},
                "errors": [],
                "comment": f"批改失败: {str(e)}",
                "success": False,
                "error": str(e),
            }


# 创建全局实例
dashscope_service = DashScopeService()
