# Welcome to Cloud Functions for Firebase for Python!
# To get started, simply uncomment the below code or create your own.
# Deploy with `firebase deploy`

from firebase_functions import https_fn
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app

# For cost control, you can set the maximum number of containers that can be
# running at the same time. This helps mitigate the impact of unexpected
# traffic spikes by instead downgrading performance. This limit is a per-function
# limit. You can override the limit for each function using the max_instances
# parameter in the decorator, e.g. @https_fn.on_request(max_instances=5).
set_global_options(max_instances=10)

# initialize_app()
#
#
# @https_fn.on_request()
# def on_request_example(req: https_fn.Request) -> https_fn.Response:
#     return https_fn.Response("Hello world!")
import os
import chromadb
import google.generativeai as genai
from firebase_functions import firestore_fn, https_fn
from firebase_admin import initialize_app, firestore

# 确保在函数内部初始化 Firebase 应用
initialize_app()

# 获取安全存储的 Gemini API 密钥
try:
    from firebase_functions.config import get_config
    config = get_config()
    # 请注意：这里需要根据您在命令行设置的配置名称来修改
    # 如果您运行的是 `firebase functions:config:set openai.api_key="your_key"`
    # 那么这里就是 config.openai.api_key
    gemini_api_key = config.openai.api_key
    genai.configure(api_key=gemini_api_key)
except Exception as e:
    print("无法从 Firebase Functions 配置中获取密钥，尝试从环境变量获取...")
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ChromaDB 的客户端，用于连接远程或本地实例
chroma_client = chromadb.Client()

# --- 辅助函数：生成向量嵌入 ---
def get_embedding(text: str) -> list[float]:
    """使用 Gemini API 将文本转换为向量嵌入。"""
    try:
        model = genai.GenerativeModel('models/embedding-001')
        result = model.embed_content(model_content=text, task_type="SEMANTIC_SIMILARITY")
        return result['embedding']
    except Exception as e:
        print(f"向量生成失败: {e}")
        return None

# --- 云函数：监听 Firestore 写入事件 ---
@firestore_fn.on_document_written(
    document="inspirations/{noteId}"
)
def on_inspiration_written(event: firestore_fn.CloudEvent[firestore_fn.DocumentSnapshot]) -> None:
    """
    监听 Firestore 中 'inspirations' 集合的新增或更新，
    自动生成向量嵌入并同步到 ChromaDB。
    """
    doc_snapshot = event.data
    note_id = doc_snapshot.id

    if not doc_snapshot.exists:
        print(f"笔记 {note_id} 被删除，跳过同步。")
        return

    note_data = doc_snapshot.to_dict()
    content = note_data.get("content", "")
    title = note_data.get("title", "")

    if not content.strip():
        print(f"笔记 {note_id} 内容为空，跳过同步。")
        return

    embedding = get_embedding(content)
    if not embedding:
        return

    collection = chroma_client.get_or_create_collection(name="vicebrain_embeddings")

    collection.upsert(
        embeddings=[embedding],
        metadatas=[{"title": title}],
        ids=[note_id]
    )
    print(f"笔记 {note_id} 已成功同步到 ChromaDB。")