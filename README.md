# Three.js Sketch Teacher

## 已上传的完整动画教师数据

[普通 Three.js 单主体动画教师 trace](data/teachers/single_subject4750_v1/README.md)：5,000 任务池中已生成 **4,750 条**，含原生 thinking 和完整代码；历史 SFT 实际使用 **4,733 条**，另 250 题仅作为 prompt 留出。10 份 gzip JSONL 共约 55 MB，附真实任务划分、训练 ID、失败记录及 SHA256。这批不是 Shape/Move 问答数据，也不属于下方静态/分对象流程；5 条 API 原始 thinking 为空，已明确标记。

## 给 agent 的一句话（新版优先，按任务选一条）

**1. 当前新 idea：storyboard → 分 object 绘制与选优 → 分 object 运动 → 组合**

> 请阅读 https://github.com/microwave173/threejs-sketch-teacher 的 README、AGENTS.md 和 docs/ideas/IDEA_ZH.md，为指定的少量任务实现并测试分对象 Three.js 动画 pipeline：先生成 storyboard，确定每个 object 的初始形态、位置、朝向、动作及交互，以及统一坐标、时间轴和共享关键时间点/空间锚点；然后逐个 object 单独生成静态 3D sketch，可多次采样并用 DeepSeek 多视角视觉比较选优；保持参考 3DrawAgent 的简洁立体风格、统一黑色管线半径0.008、命名 THREE.Group 和 stroke 语义注释。将实际几何的接触点绑定到共享锚点后，每个 object 单独生成运动脚本，最终组合到同一场景渲染。使用 DeepSeek low thinking 生成、no thinking 视觉评选，显式处理局部/世界坐标转换和交互同步，检查初始造型保持、连接与接触。复用 prompts/static_motion_v2 的风格要求，但将整场输入输出改成对象级接口，不得用整场一次绘制替代分对象生成。新建独立入口，保存各阶段输入输出、原始 reasoning、usage、失败记录和结果网页；不覆盖历史流程，不自动批量造5000条或启动SFT。

**2. 备选 baseline：整场静态 → 补运动**

> 请阅读 https://github.com/microwave173/threejs-sketch-teacher 的 README、AGENTS.md 和 docs/ideas/IDEA_ZH.md、PIPELINE_ZH.md、TODO_ZH.md，使用 prompts/static_motion_v2 的原始提示词，先为我指定的少量任务搭建并验证“首帧描述→整场静态 Three.js→补运动”的流程：DeepSeek low thinking 生成，统一黑色管线半径0.008、保持简洁立体、命名 Group 和部件注释；静态候选用对应多视角小图交给 DeepSeek no thinking 视觉选优，运动阶段保持t=0几何。保存原始 reasoning、JS、usage、失败记录及预览，核对静态到动态的几何保持。注意根目录 run.py 是历史 one-shot，新流程需要另建入口；不要自动扩到5000题或启动SFT。后续分对象方案务必先 storyboard 确定初态/朝向和共享时空锚点，再分别绘制、补运动与组合。

**3. 历史：一次生成完整动画**

> 请阅读 https://github.com/microwave173/threejs-sketch-teacher 的 README 和 AGENTS.md，克隆并安装运行环境，使用环境变量 DEEPSEEK_API_KEY，以仓库默认的 DeepSeek low thinking 流程为「四张多米诺骨牌依次倒下」生成一个完整 Three.js 3D 线稿动画；保留少笔画、简单运动表达清楚动作的风格约束，完成浏览器渲染、结构检查和 reasoning 压缩，输出 GIF、帧拼图、JS、原始及压缩 reasoning，并给我结果网页路径。使用新的输出目录，失败时按项目规则重试，不手工修改教师代码，不启动 SFT。

**4. 历史：4,750 题批量 one-shot 教师数据**

> 按本仓库 README 跑通环境，使用 data/tasks5000/train4750.json 为 4,750 条训练任务生成 Three.js 教师轨迹，保留 data/tasks5000/validation250.json 作为留出集；先独立跑 4 条检查，再用新输出目录跑训练划分。沿用最新简单运动提示词、默认 low thinking 和压缩流程，保留失败记录与进度网页，不启动 SFT。

## 版本与入口

新 idea、当前进度及提示词见 [方案](docs/ideas/IDEA_ZH.md) / [流程](docs/ideas/PIPELINE_ZH.md) / [TODO](docs/ideas/TODO_ZH.md)。分对象流程尚待实现；不要和以下历史 CLI 混用。

历史可运行 baseline 把 Three.js 教师生成实验整理成独立项目。**一次请求输出完整动画脚本；不是逐帧请求 LLM，也不是补全预设运动代码。**

**已附完整 [5,000 条任务](data/tasks5000/README.md)**，沿用 Fixed5 / IR4750 的 **4,750 训练 + 250 留出**划分。此公开仓库提供任务 prompt，尚未上传新一轮教师轨迹。


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
- [完整 5,000 题及原始划分](data/tasks5000/README.md)：涵盖物理、动物、人物、交通工具、几何；直接使用 `--tasks data/tasks5000/train4750.json` 运行训练划分。
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
