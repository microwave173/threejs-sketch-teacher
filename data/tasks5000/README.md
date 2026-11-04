# 5,000 条动画任务

复用之前 Fixed5-anchor / IR4750 的完整任务池，**不是新增的 Three.js 教师轨迹**。任务 ID 和 prompt 原文保留，沿用原始 4,750／250 划分。

| 类别 | 数量 | 比例 |
|---|---:|---:|
| 物理运动 | 1,250 | 25% |
| 动物 | 1,250 | 25% |
| 人物 | 1,250 | 25% |
| 交通工具 | 750 | 15% |
| 几何与空间运动 | 500 | 10% |

- [tasks.json](tasks.json)：完整 5,000 题。
- [train4750.json](train4750.json)：原训练划分，建议用于教师造数据。
- [validation250.json](validation250.json)：原留出划分，用于后续对比，不混入训练。
- [split.json](split.json)：原始任务 ID → split 映射。
- [summary.json](summary.json)：总量、分类和唯一性统计。
- [provenance.json](provenance.json)：来源和 SHA-256 校验值。

## 使用

```bash
# 先检查少量任务
python run.py --tasks data/tasks5000/train4750.json --limit 4 --output outputs/train_probe4
# 确认后跑训练划分
python run.py --tasks data/tasks5000/train4750.json --output outputs/train4750
# 确实需要全量 5,000 题时
python run.py --tasks data/tasks5000/tasks.json --output outputs/all5000
```

命令在仓库根目录执行，API 并发由 `config.json` 控制。子集和全量使用不同输出目录。

原任务记录中的 `total_frames=5` 等旧渲染字段已移除；本项目生成连续时间 Three.js，默认渲染 60 个采样、4 秒，**不受 Fixed5 的帧数限制**。

这些任务复用了历史任务池；原留出划分不代表与所有过去实验都不存在语义重合。分类及难度来自之前的任务筛选，未针对 Three.js 重新逐题审核。
