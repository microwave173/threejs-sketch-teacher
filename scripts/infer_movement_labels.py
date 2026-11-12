"""Load the released full-SFT base plus final adapter; retain native thinking."""
from pathlib import Path
import argparse,json
def main():
 import torch
 from transformers import AutoTokenizer,Qwen3_5ForConditionalGeneration
 from peft import PeftModel
 ap=argparse.ArgumentParser();ap.add_argument('--model-root',type=Path,required=True);ap.add_argument('--prompt',required=True);ap.add_argument('--output',type=Path,default=Path('outputs/labels_inference'));ap.add_argument('--max-new-tokens',type=int,default=32768);ap.add_argument('--seed',type=int,default=20261112);a=ap.parse_args();a.output.mkdir(parents=True,exist_ok=True)
 root=Path(__file__).resolve().parents[1];system=(root/'prompts/movement_labels2000_v1/system.txt').read_text();messages=[{'role':'system','content':system},{'role':'user','content':a.prompt}]
 tok=AutoTokenizer.from_pretrained(a.model_root/'base',local_files_only=True);model=Qwen3_5ForConditionalGeneration.from_pretrained(a.model_root/'base',dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,device_map='auto',attn_implementation='sdpa',local_files_only=True)
 model=PeftModel.from_pretrained(model,a.model_root/'adapter').merge_and_unload(safe_merge=True).eval();text=tok.apply_chat_template(messages,tokenize=False,add_generation_prompt=True,enable_thinking=True);x=tok(text,add_special_tokens=False,return_tensors='pt').to(next(model.parameters()).device);torch.manual_seed(a.seed)
 with torch.inference_mode():y=model.generate(**x,max_new_tokens=a.max_new_tokens,do_sample=True,temperature=.7,top_p=.95,top_k=20,use_cache=True)
 ids=y[0,x.input_ids.shape[1]:].tolist();raw=tok.decode(ids,skip_special_tokens=True);reason,sep,code=raw.partition('</think>');eos=model.generation_config.eos_token_id;eos=set(eos if isinstance(eos,list) else [eos]);complete=bool(sep and code.strip() and any(i in eos for i in ids))
 (a.output/'request.json').write_text(json.dumps(messages,ensure_ascii=False,indent=2));(a.output/'completion.txt').write_text(raw);(a.output/'reasoning.txt').write_text(reason)
 if sep:(a.output/'program.js').write_text(code.strip())
 result={'complete':complete,'tokens_including_thinking':len(ids),'native_thinking':True,'model_base':str(a.model_root/'base'),'adapter':str(a.model_root/'adapter'),'output':str(a.output),'render_or_physics_validated':False};(a.output/'result.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
if __name__=='__main__':main()
