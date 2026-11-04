# Three.js Sketch Teacher

**给 agent 的一句话（复制后把任务替换成你想画的内容）：**

> 请阅读 https://github.com/microwave173/threejs-sketch-teacher 的 README 和 AGENTS.md，克隆并安装运行环境，使用环境变量 DEEPSEEK_API_KEY，以仓库默认的 DeepSeek low thinking 流程为「四张多米诺骨牌依次倒下」生成一个完整 Three.js 3D 线稿动画；保留少笔画、简单运动表达清楚动作的风格约束，完成浏览器渲染、结构检查和 reasoning 压缩，输出 GIF、帧拼图、JS、原始及压缩 reasoning，并给我结果网页路径。使用新的输出目录，失败时按项目规则重试，不手工修改教师代码，不启动 SFT。

本仓库把历史 Three.js 教师生成实验整理成独立项目。**一次请求输出完整动画脚本；不是逐帧请求 LLM，也不是补全预设运动代码。**

## 安装与运行

Linux/macOS，Python 3.10+；渲染不需要模型 GPU。API 会产生费用。

```bash
git clone https://github.com/microwave173/threejs-sketch-teacher.git
cd threejs-sketch-teacher
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m playwright install chromium
# Linux 缺浏览器系统库时：python -m playwright install --with-deps chromium
python scripts/setup_tokenizer.py
read -rs DEEPSEEK_API_KEY; export DEEPSEEK_API_KEY; echo
python run.py --tasks examples/tasks.json --output outputs/demo
python -m http.server 8000 --directory outputs/demo
# 打开 http://localhost:8000/index.html
```

`read` 命令会等待输入 API key，输入不回显。也可以通过自己的环境管理工具设置 `DEEPSEEK_API_KEY`；不要写入仓库。

自定义任务只需要 JSON 列表，`id` 唯一且只使用字母、数字、下划线或连字符：

```json
[{"id":"domino_four","prompt":"Four upright dominoes in a short straight row topple one after another."}]
```

保存为 `my_tasks.json`，执行 `python run.py --tasks my_tasks.json --output outputs/domino_four`。可选 `category`、`category_zh`、`prompt_zh` 供网页展示。

## 数据流与固定接口

1. **任务 prompt → DeepSeek low thinking → 完整 JS**，总输出上限 32,768 tokens，包含 thinking。
2. **执行并渲染**：Three.js r180；默认 60 个采样、4 秒；输出 GIF、9 帧拼图、侧视图和俯视图。
3. **结构检查**：运行无异常、非空画面、有限几何坐标、回到 `t=0` 可复现；失败最多独立生成两次，不手工修补答案。
4. **reasoning 后处理**：超长或格式不合规时，DeepSeek no thinking 压缩到 3,000 Qwen tokens 内；短文本可以原样保留；JS 答案不变。
5. **导出候选样本**：`samples.provisional.jsonl`，assistant 分别保存 `reasoning_content` 和 `content`。**本仓库不包含训练器，不自动 SFT。**

模型输出接口：

```javascript
function createAnimation({THREE, scene, camera}) {
  // 创建完整几何、对象及运动函数
  return {render(t) { /* t∈[0,1]，每次直接设置完整状态 */ }};
}
```

`render(t)` 必须支持乱序时间调用。世界坐标 `+z` 向上；白底黑色三维曲线或细管，空间约在 `[-1,1]³`。初始相机位于 `(3.2,-4.5,2.5)`；渲染器根据整段动画的 13 个时间采样统一调整取景，此后保持固定镜头；模型不得修改相机。

## 提示词、配置与批处理

- [当前系统提示词](prompts/system.txt)：包含新约束——**用简单运动清楚表达动作，不添加不必要的次要动作、花式动作或额外运动阶段**。
- [历史原版](prompts/system_original.txt) / [压缩提示词](prompts/compress_system.txt)。压缩沿用历史版本，包含删除重复算术的要求，并非后来强化数学推导的版本；压缩保真需抽查。
- [config.json](config.json)：模型名、endpoint、thinking 强度、并发、时长等。默认生成 low、压缩 no thinking，API 并发 8、渲染并发 2。
- [示例 4 题](examples/tasks.json) / [历史 100 题任务清单](data/tasks100.json)：物理、几何、人物、动物各 25 题，不宣称独立测试集。
- 批处理：`python run.py --tasks data/tasks100.json --output outputs/batch100`。先检查前 4 题，再扩到其余任务；`--pilot-only` 只跑前 4 题，`--limit N` 限制任务数。
- 同一命令可断点继续；成功结果及 API 响应复用。任务、提示词或配置改变必须使用新输出目录，禁止混用旧缓存。
- 401/402/403 停止新增 API 请求；普通网络错误有限重试。已在途请求可能继续完成；失败记录和原始响应保留。

## 查看产物与验证环境

每个 `outputs/<run>/` 包含 `index.html`、`summary.json`、`manifest.json` 和 `samples.provisional.jsonl`；`items/<id>/` 保存 JS、GIF、原始／压缩 reasoning、请求、响应、token 用量和渲染记录。

无 API 的本地渲染自检：

```bash
python scripts/smoke_test.py
# tokenizer 安装后，还可用本地模拟 API 验证完整流程及断点恢复（不消耗 API）：
python scripts/test_pipeline_offline.py
```

仓库附带 [4 个历史教师结果](examples/historical/)，使用**新运动约束加入之前**的提示词；可运行不代表动作或物理正确。只下载 tokenizer，不下载 Qwen 模型权重。需要自选浏览器时设置 `CHROME_PATH`；tokenizer 镜像可设置 `HF_ENDPOINT`。

渲染浏览器不接收 API key，网络限制在本地 runtime 目录；它不是用于运行任意不可信代码的完整安全沙箱。生成内容应在独立环境中运行。

Three.js 的 MIT 许可见 [LICENSE.threejs](runtime/assets/LICENSE.threejs)；依赖与资源来源见 [THIRD_PARTY.md](THIRD_PARTY.md)。
