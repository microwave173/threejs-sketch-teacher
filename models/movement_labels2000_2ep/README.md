# 4B稀疏运动标签模型 · 2000条 · 2epochs

- [GitHub Release：模型文件](https://github.com/microwave173/threejs-sketch-teacher/releases/tag/movement-labels-4b-2000-2ep-v1)
- [实际训练数据](../../data/teachers/movement_labels2000_v1/README.md) · [方法动机](../../docs/ideas/VERIFIABLE_SKETCH_MOTIVATION_ZH.md) · [系统提示词](../../prompts/movement_labels2000_v1/system.txt)

## 权重组成

1. **基础：sketch4b_ep3**，由Qwen3.5-4B经过Three.js动画全参SFT 3epochs得到。Release包含完整5个shard及配置/tokenizer。
2. **最终adapter**：从coordination post LoRA ep3继续训练，2000条标签数据、2epochs；rank64/alpha128、LR1e-5、BF16、global batch16，共250步。

必须用上面的full-SFT基础权重加载本轮adapter。**直接叠加官方Qwen3.5-4B会得到不同的模型。**
本轮adapter已包含此前coordination LoRA的继续更新，只加载最终这一个adapter。
原始PEFT配置保留历史基础目录字段；下面的加载脚本显式传入下载后的基础权重，避免依赖旧目录。

## 下载与推理

```bash
python scripts/download_movement_labels_weights.py --output weights/movement_labels_4b
pip install torch 'transformers==5.22.2' 'peft==0.21.2' accelerate
python scripts/infer_movement_labels.py \
  --model-root weights/movement_labels_4b \
  --prompt 'A child lowers both raised arms to the sides slowly.' \
  --output outputs/labels_child
```

下载脚本检查所有模型文件SHA256，支持下载中断后继续。总文件约9.6GB；大文件放在Release，不进入Git历史。
原模型上游Apache-2.0许可见[LICENSE.Qwen](LICENSE.Qwen)，微调修改说明见[NOTICE.md](NOTICE.md)。

输出接口为`function createAnimation({THREE,scene,camera}) { ... return {render(t){...}}; }`，`t∈[0,1]`。
世界`+z`向上，固定透视相机、白底黑色3D曲线；实际命名对象附`<label_explaination>`JSON用途注释。

## 验证与范围

- 训练约2.42小时；ep1/ep2目标token加权loss为0.72551/0.71402；496个adapter tensor全部有限。
- 10题×2采样：20份完整输出、0截断、16份可完整渲染、11份通过保守标签协议检查。
- 标签、画面、动作正确性需要分别检查；这些数字不是物理正确率。
- Release用于推理和以模型权重继续微调；不含优化器/RNG完整续训状态。
