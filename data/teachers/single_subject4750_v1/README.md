# 普通 Three.js 单主体动画教师 Trace

这批是一次生成完整 Three.js 动画的历史教师数据，包含原生 thinking 和最终代码，不是 Shape/Move 问答 Step1，也不是逐帧 SVG。

| 内容 | 数量 |
|---|---:|
| 原始任务池 | 5,000 |
| 已生成教师 trace | 4,750 |
| 经执行检查后实际用于 SFT | 4,733 |
| 执行检查排除 | 17 |
| 留出任务（只有 prompt，未生成教师答案） | 250 |

## 文件与读取

- `traces-00.jsonl.gz` 至 `traces-09.jsonl.gz`：每份 475 条，共约 55 MB。
- `tasks5000.json` / `train4750.json` / `heldout250.json`：本批真实任务和划分。与仓库历史 `data/tasks5000/` 是不同任务池，不能混用。
- `training_ids.json`：实际进入历史 SFT 的 4,733 个 ID。
- `execution_summary.json`：17 条排除项及执行错误；本地绝对路径前缀已去标识。
- `teacher_system.txt`：本批原始系统提示词。
- `manifest.json`：计数、类别、原始 JSONL 哈希、导出文件大小及 SHA256。

```python
from pathlib import Path
import gzip, json

root = Path("data/teachers/single_subject4750_v1")
accepted = set(json.loads((root / "training_ids.json").read_text()))
for shard in sorted(root.glob("traces-*.jsonl.gz")):
    with gzip.open(shard, "rt", encoding="utf-8") as f:
        for line in f:
            row = json.loads(line)
            # 若复用历史 SFT 筛选，跳过不在 accepted 中的样本。
            assistant = row["messages"][-1]
            thinking = assistant["reasoning_content"]
            answer = assistant["content"]
```

每条保留 `id`、`category`、`messages` 和 `provenance`；messages 为 system、user、assistant，assistant 分别保存 `reasoning_content` 与 `content`。原始代码和 thinking 未压缩、未修补。

## 生成设置与限制

- DeepSeek `deepseek-flash`，low thinking，输出上限 32,768 tokens；原始 800 条普通动画的系统风格沿用。
- 单次返回完整动画，接口为 `createAnimation({THREE, scene, camera})`，返回支持归一化时间的 `render(t)`。
- **5 条原始 API 结果的 thinking 为空**，如实保留；具体 ID 见 manifest，不合成补写。
- 执行检查通过不等于形状、运动语义或物理正确；训练样本仍可能含设计与计算错误。
- 250 条是既定 prompt 留出，不能据此宣称语义完全独立。
- 这份导出不含模型权重、服务器凭据、请求头或 API key。
