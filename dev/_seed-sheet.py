# [dev] 把 seed/ 里的图拼成对照图，亲眼过一遍再提交（这批要发给陌生人的）。
import json, os
from PIL import Image, ImageDraw
DEV = os.path.dirname(os.path.abspath(__file__))
SEED = os.path.join(DEV, '..', 'seed')
mf = json.load(open(os.path.join(SEED, 'manifest.json'), encoding='utf-8'))
items = mf['items']
COLS, CW, CH = 6, 220, 250
rows = (len(items) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * CW, rows * CH), (255, 255, 255))
d = ImageDraw.Draw(sheet)
for i, it in enumerate(items):
    cx, cy = (i % COLS) * CW, (i // COLS) * CH
    p = os.path.join(SEED, it['file'])
    im = Image.open(p).convert('RGB')
    im.thumbnail((CW - 8, CH - 26))
    sheet.paste(im, (cx + (CW - im.width) // 2, cy + 20 + (CH - 26 - im.height) // 2))
    d.rectangle([cx, cy, cx + CW - 1, cy + CH - 1], outline=(205, 205, 205))
    d.rectangle([cx, cy, cx + CW - 1, cy + 16], fill=(0, 0, 0))
    d.text((cx + 3, cy + 3), '#%d %s %s' % (i + 1, it['tag'], it['file']), fill=(255, 255, 255))
out = os.path.join(DEV, '_seed-sheet.png')
sheet.save(out)
print(out, sheet.size, len(items), 'items')
for i, it in enumerate(items):
    print('#%d [%s] %s | %s | kw: %s' % (i + 1, it['tag'], it['file'], it['caption'][:44], it['keywords'][:70]))
