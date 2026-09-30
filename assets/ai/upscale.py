#!/usr/bin/env python3
"""Real-ESRGAN x4 em CPU, por mosaicos com sobreposição (memória segura)."""
import numpy as np, onnxruntime as ort, sys, time
from PIL import Image

MODEL = '/home/coelho/whoop-luanda/assets/ai/realesrgan-x4.onnx'
so = ort.SessionOptions()
so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
so.intra_op_num_threads = 4
sess = ort.InferenceSession(MODEL, so, providers=['CPUExecutionProvider'])
INAME = sess.get_inputs()[0].name

def tile_run(arr):  # arr: float32 [1,3,h,w] 0..1
    return sess.run(None, {INAME: arr})[0]

def upscale(img_pil, scale=2, tile=128, ov=16):
    """scale: 2 => corre a rede 1x (x4) e reduz a metade; 4 => rede directa"""
    im = np.asarray(img_pil.convert('RGB'), dtype=np.float32) / 255.0
    H, W = im.shape[:2]
    out = np.zeros((H*4, W*4, 3), dtype=np.float32)
    wgt = np.zeros((H*4, W*4, 1), dtype=np.float32)
    step = tile - ov
    t0 = time.time()
    ny = (H + step - 1)//step; nx = (W + step - 1)//step
    total = ny*nx
    k = 0
    for iy in range(ny):
        for ix in range(nx):
            y0 = min(iy*step, max(0, H-tile)); x0 = min(ix*step, max(0, W-tile))
            y1, x1 = min(y0+tile, H), min(x0+tile, W)
            pad_t, pad_l = 0, 0
            t = im[y0:y1, x0:x1]
            th, tw = t.shape[:2]
            if th < tile or tw < tile:
                pad_t = tile-th; pad_l = tile-tw
                t = np.pad(t, ((0,pad_t),(0,pad_l),(0,0)), mode='reflect')
            x = np.transpose(t, (2,0,1))[None]
            y = tile_run(x)[0]                     # [3,512,512]
            y = np.clip(y, 0, 1)
            # recortar area util (sem o padding, sem a faixa de overlap que pertence ao vizinho)
            uy = 4*(th); ux = 4*(tw)
            y = np.transpose(y, (1,2,0))[:uy,:ux]
            oy, ox = 4*y0, 4*x0
            out[oy:oy+uy, ox:ox+ux] += y
            wgt[oy:oy+uy, ox:ox+ux] += 1.0
            k += 1
            if k % 8 == 0 or k == total:
                el = time.time()-t0
                print(f"  mosaico {k}/{total}  {el:.0f}s", flush=True)
    out /= wgt
    res = Image.fromarray((np.clip(out,0,1)*255).astype(np.uint8))
    if scale == 2:
        res = res.resize((res.width//2, res.height//2), Image.LANCZOS)
    return res

if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    scale = int(sys.argv[3]) if len(sys.argv) > 3 else 2
    im = Image.open(src)
    print(f"entrada {im.size} -> x{scale}", flush=True)
    r = upscale(im, scale=scale)
    r.save(dst, 'JPEG', quality=90, optimize=True)
    print(f"guardado {dst} {r.size}")
