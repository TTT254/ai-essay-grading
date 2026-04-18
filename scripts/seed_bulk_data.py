#!/usr/bin/env python3
"""
批量生成测试数据 - 为教师和学生后台生成丰富的展示数据
使用 Supabase REST API + Auth Admin API 直接写入数据库
"""
import json
import uuid
import random
import time
import urllib.request
import urllib.error
from datetime import datetime, timedelta

# ============ 配置 ============
SUPABASE_URL = "https://ctcfcrdquyzxhlmbygfa.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0Y2ZjcmRxdXl6eGhsbWJ5Z2ZhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODEzODAwNCwiZXhwIjoyMDgzNzE0MDA0fQ.shXjait5XZiPtWRYCEvYNkfLMsrbEk6tLO_SiXq-LpE"

# 教师ID (李老师)
TEACHER_ID = "e66e0907-3dd5-4b34-9f09-1f95d6cc9f37"

# ============ 辅助函数 ============
def now_iso(days_offset: int = 0) -> str:
    """返回 (now + days_offset) 的 ISO 时间戳"""
    d = datetime.now() + timedelta(days=days_offset)
    return d.isoformat()


def new_uuid() -> str:
    return str(uuid.uuid4())


def rest_insert(table: str, rows: list[dict]) -> list[dict]:
    """逐条插入，返回成功插入的记录"""
    results = []
    for row in rows:
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        body = json.dumps(row).encode("utf-8")
        req = urllib.request.Request(url, data=body, headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                results.append(json.loads(resp.read().decode("utf-8")))
        except urllib.error.HTTPError as e:
            if e.code in (409, 23505):
                pass  # 已存在跳过
            else:
                print(f"    [!] 插入 {table} 失败: {e.code} {e.read().decode()[:100]}")
    return results


def rest_select(table: str, params: str = "") -> list[dict]:
    url = f"{SUPABASE_URL}/rest/v1/{table}?{params}"
    req = urllib.request.Request(url, headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def rest_delete(table: str, filter_key: str, filter_val: str) -> int:
    """按条件删除，返回删除数量"""
    # 先批量删除（忽略 FK 约束错误，FK 子表会阻塞）
    url = f"{SUPABASE_URL}/rest/v1/{table}?{filter_key}=eq.{filter_val}"
    req = urllib.request.Request(url, headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Prefer": "return=minimal",
    }, method="DELETE")
    try:
        urllib.request.urlopen(req)
    except Exception:
        pass
    # 逐条删除确保FK约束不阻塞
    rows = rest_select(table, "")
    deleted = 0
    for r in rows:
        rid = r.get("id")
        if not rid:
            continue
        url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{rid}"
        req = urllib.request.Request(url, headers={
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Prefer": "return=minimal",
        }, method="DELETE")
        try:
            urllib.request.urlopen(req)
            deleted += 1
        except Exception:
            pass
    return deleted


def admin_create_user(email: str, name: str) -> str | None:
    """通过 Auth Admin API 创建用户，返回 user_id（已存在则返回 None）"""
    url = f"{SUPABASE_URL}/auth/v1/admin/users"
    body = json.dumps({
        "email": email,
        "email_confirm": True,
        "user_metadata": {"name": name},
    }).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
    }, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8")).get("id")
    except urllib.error.HTTPError as e:
        if e.code in (409, 422):
            return None  # 已存在
        raise


def find_auth_user(email: str) -> str | None:
    """查询 auth.users 中的用户 ID"""
    url = f"{SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50"
    req = urllib.request.Request(url, headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
    })
    try:
        with urllib.request.urlopen(req) as resp:
            for u in json.loads(resp.read().decode()).get("users", []):
                if u.get("email") == email:
                    return u["id"]
    except Exception:
        pass
    return None


# ============ 作文内容库 ============
ESSAY_CONTENTS = [
    "春天来了，校园里万物复苏。柳树抽出嫩绿的新芽，桃花粉红似霞，小草从泥土里探出头来，贪婪地呼吸着春天的气息。操场上同学们欢快地奔跑着，笑声回荡在整个校园。",
    "我最敬佩的人是妈妈。她每天早起为我准备早餐，晚上还要陪我写作业。她虽然工作很忙，但总是抽出时间关心我的学习。每当我遇到困难，她总会鼓励我不要放弃。",
    "读《西游记》有感最近我读完了《西游记》，被孙悟空的勇敢和智慧深深吸引。他不畏艰险，保护唐僧西天取经，经历了九九八十一难，最终取得真经。我要学习他坚持不懈的精神。",
    "可爱的小动物我最喜欢的动物是小狗。它有一身金黄色的毛，圆圆的眼睛像两颗黑宝石。它非常聪明，会握手、会翻滚，每次我放学回家，它都会扑上来迎接我。",
    "我的学校我们的学校坐落在一条安静的小巷里。一进校门就能看到一座美丽的花坛，里面种满了各种各样的花。教学楼宽敞明亮，操场上铺着塑胶跑道。我爱我的学校！",
    "记一件有意义的事上周日，我和爸爸一起去敬老院看望爷爷奶奶。我们带去了水果和糕点，还为他们表演了节目。看着爷爷奶奶开心的笑容，我感到心里暖暖的。",
    "秋天到了，天高云淡，凉风习习。树叶变黄了，纷纷飘落下来，像一只只蝴蝶在空中飞舞。田野里稻谷金黄，农民伯伯正在忙着收割，一派丰收的景象。",
    "我最爱的季节我最喜欢夏天。夏天虽然很热，但我可以吃冰淇淋，去游泳馆游泳，还可以看萤火虫。夏天的夜晚，躺在院子里数星星，是最美好的时光。",
    "我的好朋友小明是我最好的朋友。他个子高高的，性格开朗，总是乐于助人。有一次我忘带铅笔盒，他毫不犹豫地把笔借给我。我俩经常一起讨论问题，互相帮助。",
    "一次难忘的旅行去年暑假，爸爸妈妈带我去了北京。我们游览了天安门广场、故宫和长城。最让我震撼的是长城，它像一条巨龙蜿蜒在山峦之间，我为祖国的伟大感到骄傲。",
    "保护环境，从我做起随着科技的发展，环境污染越来越严重。我们应该从小事做起，不乱扔垃圾，少用一次性筷子，多种树，让我们的家园更加美好。",
    "我的愿望我的愿望是长大后当一名医生。医生可以救死扶伤，帮助那些生病的人。特别是看到医生们抗击新冠疫情的事迹，我更加坚了这个愿望。我会努力学习，为实现梦想而奋斗。",
    "夏天的池塘夏天到了，校园的池塘里开满了荷花。有粉色的，有白色的，美丽极了。荷叶圆圆的，像一把把绿色的小伞。青蛙蹲在荷叶上呱呱地叫着，像在歌唱夏天。",
    "我的爸爸我的爸爸是一名工程师。他工作很忙，经常加班。但每个周末，他都会抽出时间陪我打篮球、下棋。他教会我做人的道理：做人要诚实，做事要认真。",
    "难忘的运动会上周学校举办了运动会，我参加了跑步比赛。枪声一响，我像离弦的箭一样冲了出去。虽然只得了第三名，但我学到了体育精神：重在参与，友谊第一，比赛第二。",
]

MISTAKE_TYPES = ["typo", "grammar", "punctuation", "logic", "structure", "other"]
MISTAKE_TYPES_CN = ["错别字", "语法错误", "标点符号", "逻辑问题", "结构问题", "其他"]
MISTAKE_CONTENTS = [
    "「金黄色的」应为「金色的」",
    "句子缺少主语",
    "逗号和句号混用",
    "段落之间缺少过渡",
    "中心思想不突出",
    "详略不当，重点部分写得太少",
    "用词重复，缺乏变化",
    "比喻不恰当",
]
CORRECT_CONTENTS = [
    "改为「金色的」",
    "添加主语「我」或「他」",
    "统一使用句号结尾",
    "添加「首先」「然后」等过渡词",
    "明确段落主题句",
    "突出重点段落",
    "使用同义词替换",
    "选择更贴切的比喻",
]

QUESTIONS = [
    "这篇作文有哪些优点？", "第二段怎么写得更好？",
    "语言表达上有什么建议？", "如何让开头更吸引人？",
    "结尾需要怎么改进？", "文章结构有什么问题？",
    "怎么写好人物描写？", "如何提升写作水平？",
]

# ============ 1. 清理旧数据 ============
print("=" * 60)
print("步骤1: 清理旧测试数据...")

# 按依赖顺序删除
for table in ["ai_conversations", "mistake_records", "grading_reports", "submissions", "assignments", "classes", "users"]:
    deleted = rest_delete(table, "id", "notnull")
    print(f"  清理 {table}: 删除 {deleted} 条记录")

print()

# ============ 2. 重建教师 ============
print("=" * 60)
print("步骤2: 重建教师记录...")

rest_insert("users", [{
    "id": TEACHER_ID,
    "email": "1806874707@qq.com",
    "name": "李老师",
    "role": "teacher",
}])
print("  教师记录已创建")

# ============ 3. 创建班级 ============
print("=" * 60)
print("步骤3: 创建班级...")

CLASS_DEFS = [
    {"id": "c0000000-0000-0000-0003-000000000001", "grade": 3, "name": "1班"},
    {"id": "c0000000-0000-0000-0003-000000000002", "grade": 3, "name": "2班"},
    {"id": "c0000000-0000-0000-0003-000000000003", "grade": 4, "name": "1班"},
    {"id": "c0000000-0000-0000-0003-000000000004", "grade": 5, "name": "1班"},
    {"id": "c0000000-0000-0000-0003-000000000005", "grade": 5, "name": "3班"},
    {"id": "c0000000-0000-0000-0003-000000000006", "grade": 6, "name": "1班"},
    {"id": "c0000000-0000-0000-0003-000000000007", "grade": 6, "name": "2班"},
]
for c in CLASS_DEFS:
    c["teacher_id"] = TEACHER_ID

CLASS_IDS = [c["id"] for c in CLASS_DEFS]
rest_insert("classes", CLASS_DEFS)
print("  创建了 {} 个班级: ".format(len(CLASS_DEFS)) + str([str(c["grade"]) + "年级" + c["name"] for c in CLASS_DEFS]))
print()

# ============ 4. 创建学生 ============
print("=" * 60)
print("步骤4: 创建学生数据...")

STUDENT_NAMES = [
    "张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十",
    "郑晓明", "陈思远", "林雨晨", "黄梓轩", "徐梦瑶", "杨浩然", "吴佳慧", "刘子涵",
    "陈俊杰", "李欣怡", "王志强", "张雅婷", "刘明轩", "陈怡然", "黄子墨", "徐诗涵",
    "杨浩宇", "吴思琪", "郑雅静", "孙晨曦", "周俊逸", "吴雨桐",
    "赵天宇", "钱思思", "孙诗琪", "周俊峰", "吴雅琴", "郑浩然",
    "王晓东", "张晓燕", "刘晓峰", "陈晓丽", "黄晓敏", "徐晓华",
    "杨晓涛", "吴晓霞", "郑晓龙", "孙晓燕", "周晓光",
    "赵雅婷", "钱俊杰", "孙怡然", "周子墨", "吴诗涵",
    "郑浩宇", "陈思琪", "林雅静", "黄晨曦", "徐俊逸",
]

print(f"  创建 {len(STUDENT_NAMES)} 个学生...")
created_student_ids = []
for i, name in enumerate(STUDENT_NAMES):
    email = f"student{i+1:03d}@example.com"
    auth_id = admin_create_user(email, name)
    if not auth_id:
        auth_id = find_auth_user(email)
    if not auth_id:
        auth_id = new_uuid()

    row = {
        "id": auth_id,
        "email": email,
        "name": name,
        "role": "student",
        "class_id": CLASS_IDS[i % len(CLASS_IDS)],
    }
    try:
        rest_insert("users", [row])
        created_student_ids.append(auth_id)
    except Exception:
        pass

print(f"  成功创建 {len(created_student_ids)} 个学生")
print()

# ============ 5. 创建作业 ============
print("=" * 60)
print("步骤5: 创建作业...")

ASSIGNMENT_TITLES = [
    "记一件有意义的事", "可爱的动物", "春天来了", "我最敬佩的人",
    "读后感：《西游记》", "难忘的运动会", "保护环境从我做起", "我的学校",
    "一次难忘的旅行", "我最爱的季节", "秋天的校园", "我的愿望",
    "夏天的池塘", "我的好朋友", "记一次春游", "母亲的爱",
    "假如我是", "我的爸爸", "未来的学校", "难忘的一天",
]

ASSIGNMENT_IDS = []
for i, title in enumerate(ASSIGNMENT_TITLES):
    aid = new_uuid()
    ASSIGNMENT_IDS.append(aid)
    row = {
        "id": aid,
        "title": title,
        "description": f"请围绕「{title}」写一篇不少于400字的作文，注意内容具体、语句通顺。",
        "teacher_id": TEACHER_ID,
        "class_id": CLASS_IDS[i % len(CLASS_IDS)],
        "deadline": now_iso(random.randint(-30, 60)),
        "word_count_min": random.choice([300, 400, 500, 600]),
        "word_count_max": random.choice([600, 800, 1000]),
    }
    rest_insert("assignments", [row])

print(f"  成功创建 {len(ASSIGNMENT_IDS)} 个作业")
print()

# ============ 6. 创建提交 + 批改报告 ============
print("=" * 60)
print("步骤6: 创建提交和批改报告...")

created_sub_ids = []
report_count = 0

# 60个学生 × 分配给其班级的作业（最多5个）
for sid in created_student_ids[:60]:
    # 找到该学生的班级
    user_rows = rest_select("users", f"id=eq.{sid}")
    if not user_rows:
        continue
    cls_id = user_rows[0].get("class_id")
    if not cls_id:
        continue

    # 用班级索引来匹配
    class_idx_map = {cid: idx for idx, cid in enumerate(CLASS_IDS)}
    cid_idx = class_idx_map.get(cls_id, 0)

    # 该班级的作业（按班级索引分配）
    class_assignments = [aid for j, aid in enumerate(ASSIGNMENT_IDS) if j % len(CLASS_IDS) == cid_idx][:5]

    for aid in class_assignments:
        if random.random() < 0.4:
            continue  # 40%概率不提交

        sub_id = new_uuid()
        created_sub_ids.append(sub_id)
        content = random.choice(ESSAY_CONTENTS)
        word_count = random.randint(350, 950)
        submitted_days_ago = random.randint(1, 60)
        status = random.choice(["submitted", "submitted", "graded", "published"])
        is_graded = status in ("graded", "published")

        rest_insert("submissions", [{
            "id": sub_id,
            "assignment_id": aid,
            "student_id": sid,
            "content": content,
            "word_count": word_count,
            "status": status,
            "submitted_at": now_iso(-submitted_days_ago),
            "created_at": now_iso(-submitted_days_ago),
        }])

        if is_graded:
            total_score = round(random.uniform(55, 95), 1)
            content_score = round(random.uniform(22, 33), 1)
            structure_score = round(random.uniform(15, 24), 1)
            language_score = round(random.uniform(15, 24), 1)
            writing_score = round(total_score - content_score - structure_score - language_score, 1)
            writing_score = max(6, min(15, writing_score))

            scores = {
                "content": content_score,
                "structure": structure_score,
                "language": language_score,
                "writing": writing_score,
            }

            errors = [
                {"type": "用词不当", "position": "第2段", "description": "「金黄色的」可改为「金色的」", "severity": "minor"},
                {"type": "语句不通", "position": "第3段", "description": "句子缺少主语", "severity": "minor"},
            ] if random.random() < 0.5 else []

            rest_insert("grading_reports", [{
                "id": new_uuid(),
                "submission_id": sub_id,
                "ai_total_score": total_score,
                "ai_scores": scores,
                "ai_errors": errors,
                "ai_comment": "这篇作文结构完整，内容较为充实。继续保持良好的写作习惯，注意细节描写。",
                "final_total_score": total_score,
                "final_scores": scores,
                "final_comment": "这篇作文结构完整，内容较为充实。继续保持良好的写作习惯，注意细节描写。",
                "graded_at": now_iso(-submitted_days_ago + 1),
                "reviewed_at": now_iso(-submitted_days_ago + 1),
                "published_at": now_iso(-submitted_days_ago + random.randint(2, 10)) if status == "published" else None,
            }])
            report_count += 1

print(f"  成功创建 {len(created_sub_ids)} 个提交记录, {report_count} 个批改报告")
print()

# ============ 7. 创建错题记录 ============
print("=" * 60)
print("步骤7: 创建错题记录...")

mistake_count = 0
for sid in created_student_ids[:40]:
    for _ in range(random.randint(1, 3)):
        mtype_idx = random.randint(0, len(MISTAKE_TYPES) - 1)
        content_idx = random.randint(0, len(MISTAKE_CONTENTS) - 1)
        days_ago = random.randint(1, 30)
        rest_insert("mistake_records", [{
            "id": new_uuid(),
            "student_id": sid,
            "mistake_type": MISTAKE_TYPES[mtype_idx],
            "mistake_content": MISTAKE_CONTENTS[content_idx],
            "correct_content": CORRECT_CONTENTS[content_idx],
            "frequency": random.randint(1, 5),
            "last_occurred_at": now_iso(-days_ago),
            "created_at": now_iso(-days_ago - random.randint(0, 10)),
        }])
        mistake_count += 1

print(f"  成功创建 {mistake_count} 个错题记录")
print()

# ============ 8. 创建 AI 对话记录 ============
print("=" * 60)
print("步骤8: 创建 AI 对话记录...")

QUESTIONS = [
    "这篇作文有哪些优点？", "第二段怎么写得更好？",
    "语言表达上有什么建议？", "如何让开头更吸引人？",
    "结尾需要怎么改进？", "文章结构有什么问题？",
    "怎么写好人物描写？", "如何提升写作水平？",
]

AI_RESPONSES = [
    "好的，根据您这篇作文的内容，我来给您一些具体的建议：\n\n1. 内容方面：您的作文内容具体，能围绕主题展开描写。\n\n2. 语言方面：建议多使用比喻、拟人等修辞手法，让文章更生动。\n\n3. 结构方面：注意段落之间的过渡，使文章更流畅。\n\n希望这些建议对您有帮助，继续加油！",
    "这篇作文整体写得不错！有以下几点建议供您参考：\n\n• 开头可以更加简洁有力，直接点明主题\n• 中间部分可以增加一些细节描写，让文章更生动\n• 结尾需要升华主题，总结全文\n\n继续保持写作热情！",
    "关于这篇作文，我有几点看法：\n\n1. 立意明确，能围绕主题展开叙述\n2. 语言流畅，用词较为准确\n3. 可以增加一些修辞手法，如比喻、拟人等\n4. 注意段落之间的逻辑衔接\n\n加油！",
]

conv_count = 0
for sid in created_student_ids[:30]:
    for _ in range(random.randint(1, 4)):
        question = random.choice(QUESTIONS)
        answer = random.choice(AI_RESPONSES)
        days_ago = random.randint(1, 20)
        # messages 字段是一个 JSON 数组，每条消息包含 role 和 content
        messages = [
            {"role": "user", "content": question},
            {"role": "assistant", "content": answer},
        ]
        rest_insert("ai_conversations", [{
            "id": new_uuid(),
            "student_id": sid,
            "submission_id": random.choice(created_sub_ids) if created_sub_ids else None,
            "messages": messages,
            "created_at": now_iso(-days_ago),
            "updated_at": now_iso(-days_ago),
        }])
        conv_count += 1

print(f"  成功创建 {conv_count} 条对话记录")
print()

# ============ 9. 更新班级学生数量 ============
print("=" * 60)
print("步骤9: 更新班级学生数量...")

for cid in CLASS_IDS:
    rows = rest_select("users", f"class_id=eq.{cid}&role=eq.student")
    count = len(rows)
    url = f"{SUPABASE_URL}/rest/v1/classes?id=eq.{cid}"
    body = json.dumps({"student_count": count}).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }, method="PATCH")
    try:
        urllib.request.urlopen(req)
    except Exception:
        pass

print("  班级学生数量已更新")
print()

# ============ 验证 ============
print("=" * 60)
print("验证数据统计:")
for table in ["classes", "users", "assignments", "submissions", "grading_reports", "mistake_records", "ai_conversations"]:
    rows = rest_select(table)
    print(f"  {table}: {len(rows)} 条")

print()
print("班级详情:")
for cid in CLASS_IDS:
    cls = next((c for c in CLASS_DEFS if c["id"] == cid), None)
    if not cls:
        continue
    user_count = len(rest_select("users", f"class_id=eq.{cid}&role=eq.student"))
    assignment_count = len([aid for j, aid in enumerate(ASSIGNMENT_IDS) if j % len(CLASS_IDS) == CLASS_IDS.index(cid)])
    print(f"  {cls['grade']}年级{cls['name']}: {user_count} 名学生, {assignment_count} 个作业")

print()
print("登录账号:")
print(f"  教师: 1806874707@qq.com / Test123456!")
print(f"  学生1: student001@example.com / (在 auth.users 已创建)")
