# 2000条稀疏运动标签训练数据

本目录是本轮LoRA **实际使用的完整2000条**训练序列：原1000＋新增1000，ID不重复。
DeepSeek low thinking从零生成完整Three.js；原生reasoning和代码共同监督，无reasoning压缩、无序列截断。

| 类别 | 数量 |
|---|---:|
| animal | 512 |
| human | 308 |
| vehicle | 369 |
| object | 298 |
| geometry | 292 |
| physics | 221 |

## 文件与恢复

- 8个gzip JSONL分片，每个250条；每行保留`id/category/messages/completion/token_counts/provenance`。
- `messages`是system＋任务user输入；`completion`是原生reasoning＋`</think>`＋完整JS＋结束标记。
- 机器可读label注释、实际命名语句和原始来源信息保留在数据中。
- [manifest.json](manifest.json)给出逐分片SHA256、类别数和原始训练文件SHA256；[tasks.json](tasks.json)仅包含对应任务。

```bash
python scripts/restore_movement_labels_data.py --output data/movement_labels_train.raw.jsonl
```

恢复结果与实际训练原文件逐字节相同，SHA256应为：
`a7070af6c3133de281ef776fc98bf9ded443136350df7e8c3cb8a1ee872db741`。

训练序列平均约12602 tokens，最大32656；system、任务输入不计算监督loss，原生thinking和完整JS计算loss。
模型权重、训练设置及加载方式见[模型说明](../../../models/movement_labels2000_2ep/README.md)。

## 数据边界

- 这些是合成教师输出，经过标签/有限几何/乱序时间调用检查；不代表全部形状、语义、物理已被人工确认正确。
- 与仓库历史训练任务存在来源重叠，不能将整批数据视作独立语义留出集。
- 数据来自DeepSeek教师；不将Qwen模型权重许可等同于所有合成数据的独立许可声明。
