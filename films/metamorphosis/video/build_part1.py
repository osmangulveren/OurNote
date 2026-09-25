# Assembles "The Metamorphosis — Part One" (first 10 minutes) from Higgsfield clips.
# Runs inside the Higgsfield sandbox (ffmpeg + numpy + Pillow). Usage: python3 build_part1.py <upload_url>
import os, sys, subprocess, concurrent.futures as cf
import numpy as np
from PIL import Image, ImageDraw, ImageFont

B = 'https://d8j0ntlcm91z4.cloudfront.net/user_3FDVVhbqzfyKraNs7gjKpoaqOAn/hf_20260925_'
V = {1:'150518_59871b10-128e-4140-827d-f19db8384d7b',2:'150519_8c693925-339b-4bb5-b3cc-5dfe09dec919',3:'150518_f26677da-d960-4996-9fee-ce7c62667a6a',4:'150553_058a0f4e-c468-47d3-afb1-db736903c675',5:'150518_6caf52fa-3ca9-471a-97b0-fbff3545fbd2',6:'150522_1f23e677-3c8f-4948-927a-eec7c03892fd',7:'150518_46c0bf66-abb4-4da6-8cab-0fe1c7cbb0eb',8:'150520_36f6f22f-a0b6-4ee4-a9e9-dfd8ed76e9d9',9:'150519_64838e2a-2b2b-4bc0-b15a-d6162c771d51',10:'150554_b9a3ab97-15e4-4605-8eb5-198237faba77',11:'150518_0f51b22e-6aff-4177-aaa5-e47bb38db5f9',12:'150553_373571f0-3d38-48ca-b6ec-59d0373ab5a5',13:'150552_df29972e-39c7-4a89-956a-01a0db3a67f9',14:'150553_535ea996-b768-4453-aaed-8e58ca3238fd',15:'150552_b4a7461f-9451-42c0-829d-60bdd3f451c9',16:'150555_89568ea3-f585-40af-9d66-87d695b746c7',17:'150553_f99907f5-c02f-442f-978f-06ea060c9e58',18:'150553_1563dc8b-4ba0-4e82-b0f8-b65f6c6504dc',19:'150554_618da10a-3e6e-4cea-b5fe-4684602c7806',20:'150553_b0881fc7-9f54-4f59-8922-e01535f17080',21:'150553_0ecaca7a-9aaf-4f68-a2e1-4bcb1a14c9f6',22:'150627_fdabe9c3-e044-4c9c-8add-51a023b23a9c',23:'150627_9f3f4ed5-4c4f-4b5b-a029-f3f7802237bb',24:'150629_1541bc24-b3b5-4424-b558-4162b43f9ce5',25:'150627_203698fc-05bd-4ee7-88b3-84d5492c1997',26:'150628_9bf2efea-e641-441c-9127-88629f13a53e',27:'150628_97ea28b8-8ca4-490f-b731-9b3444867ef8',28:'150628_041bce87-efb5-4522-bf06-67d96633b8c4',29:'150627_8380466d-dbfa-4547-98e1-a306cdcf3940',30:'150627_14b84351-cb13-4d2f-86b1-e0ae6e3fe95d',31:'150627_4afee529-ce1f-4c79-92be-1dd656c62182',32:'150627_581e1d95-0daa-46c6-964e-7d16e74c1ab5',33:'150627_2dc0185a-260f-43be-84e6-ed220db5e25a',34:'150702_eda5bb41-5708-4800-a442-c03a5abdb2b7',35:'150700_f2dff172-f939-41ef-9105-8b2ea5534a44',36:'151107_7ab75522-cdc3-485f-9468-19dd537f5def',37:'150700_6824cda6-4e83-4731-aa80-199cf8b5a20d',38:'150701_fa6f0915-a3c0-4d74-af55-ad37cf8c544d',39:'150701_a7abc3e4-dd4b-444e-96c0-c8e1c1fc6d64',40:'150701_84ac73da-5b41-4731-baf4-b2917d55471a',41:'150701_f8747e98-075a-4326-8d1f-833361fc329b',42:'150701_1312a282-0e74-4191-8e8f-548bf1c198d1',43:'150701_103a0c36-a92c-4212-8305-2437fc1e7098',44:'150700_af9036eb-f97c-4479-9619-615314f80bbe',45:'150701_8c075e41-5d75-4a37-8a4d-4512cc4b2004',46:'150739_34cde4a7-b732-48e9-8a4e-76346bd77b5f',47:'150739_3380b11e-b20e-4611-897e-f35d1eba425c',48:'150739_ae4724e0-77de-4ea0-bd1b-451af7b30db7',49:'150738_afae83c5-16f9-4a9d-b8b2-de0dd51df001',50:'150738_c90f0b08-4e45-4361-9dc4-c4c45f118e2a',51:'150738_61249a3d-c7f5-41b8-92d2-229e76bb79ad',52:'150738_79229333-7c7e-49c3-a52a-047f3a980b37',53:'150738_8c6a8ea4-3d11-45f8-9ddd-d279a7a3bd6c',54:'150739_3fa16c99-c74f-4155-96aa-141c10ebdcf2',55:'150739_ca488bed-1ae0-48e1-8568-2dd0d7cf38fb',56:'150739_fd50e7cf-b014-4797-a086-e3d54d0a2c3d',57:'150739_8d4a28b2-9230-4e25-b849-a991b76bc69c',58:'150745_0c69b92f-f4d0-4e9f-b448-5d2e7aaed677',59:'150745_c49da7f5-bbd9-48fd-bc71-95972072eb25'}
A = {1:'150819_9e24cbb3-cc78-41e9-8678-cb25307d804b',2:'150818_f12feec8-3dc7-4a00-bc06-69aa4565c805',3:'150818_22e68724-7804-40e9-b52f-97dcb0129557',4:'150818_662dca28-207f-45df-ac75-93a814aeb1e5',5:'150818_8cdc6c6d-322b-4535-8b80-f7ca5abde2ba',6:'150818_843d78b1-51ee-4bf2-9b10-1c687055a72b',7:'150817_b576826f-3483-4651-9109-5f0b99195b37',8:'150819_b07b6512-aafa-4ff9-98b2-6e570acd10e7',9:'150909_c93d91c8-92a4-424e-beee-bfd6014a6fbb',10:'150818_3fd9b6b2-1d38-4fc7-99ff-ea2b1243466f',11:'150909_cc31029d-a6e4-43a7-afc0-289fa30b2f2e',12:'150819_dd841ada-78e9-4b54-a520-cced5300da98',13:'150909_1e7f55b7-a59b-4ae3-8a99-a2495f6ceaf4',14:'150910_90e58bc3-7190-40a5-a029-d2aebd5c2a06',15:'150922_79d88fc4-db6a-4504-9c43-6ac93f7df448',16:'150920_446d0b40-7acc-4426-a4d2-0ab068dc1dfc',17:'150921_1044bce7-1f4b-466a-8816-ccb1c407a34c',18:'150920_bdd147b9-5e43-4fd6-a3da-74179d66eb5c',19:'150932_84d9f288-78d3-443a-a0b0-61404a4e190d',20:'150932_f429253c-d995-430f-9f07-6ef58000875e',21:'150932_3c83e859-b667-49c4-ab17-aba5cb9c70ab',22:'150932_8e6b0ebb-84dd-4e24-bad9-7e6ae97999da',23:'150959_06e4c19d-0e2d-470e-8da3-519158bd0f57',24:'151000_7587971e-5708-4aa0-b9a4-646efd45c7e5',25:'151000_43550c7a-987c-4af1-8181-49f0a141fb1f',26:'151000_cf86b1b7-e956-4ee4-b504-18ba7d0ee124',27:'151010_1ac6bd3e-a4cf-4060-a06a-4b40e0fd97df',28:'151011_a1436332-deb0-4da0-917c-b31ebd5865f2',29:'151010_d296a444-69ec-4b35-9d03-3e3cf60dd354',30:'151011_6ef23d94-ee35-4d20-b514-980eafca67c4',31:'151039_a2475f5f-c851-4ef8-8b49-4eff121047e3'}

# Timeline: ('card', seconds, text) | ('clip', shot, seconds, overlay_text, overlay_kind)
TL = [('card', 7, 'PRAGUE  —  1912')]
TL += [('clip', i, 10, None, None) for i in (1, 2, 3, 4)]
CR = {5: 'A FILM AFTER FRANZ KAFKA', 6: 'THE METAMORPHOSIS', 7: 'PART ONE', 8: 'ADAPTED FROM THE NOVELLA',
      9: 'SCORE SYNTHESIZED  ·  VOICES GENERATED', 10: 'IN THE MANNER OF DAVID FINCHER'}
TL += [('clip', i, 10, CR[i], 'credit') for i in range(5, 11)]
TL += [('card', 5, 'I.    THE KEY'), ('clip', 11, 6, 'MONDAY  —  6:30 A.M.', 'super')]
TL += [('clip', i, 10, None, None) for i in range(12, 25)]
TL += [('clip', 25, 6, '7:00 A.M.', 'super'), ('clip', 26, 10, '7:10 A.M.', 'super')]
TL += [('clip', i, 10, None, None) for i in range(27, 39)]
TL += [('clip', 39, 6, None, None), ('clip', 40, 10, None, None), ('clip', 41, 10, None, None), ('clip', 42, 6, None, None)]
TL += [('clip', i, 10, None, None) for i in range(43, 52)]
TL += [('card', 3, ''), ('card', 5, 'II.    THE PICTURE'), ('clip', 52, 10, 'DUSK', 'super')]
TL += [('clip', i, 10, None, None) for i in range(53, 60)]
TL += [('card', 6, 'TO BE CONTINUED')]

# Lines: (audio id, start seconds, kind, subtitle)
L = [(1,18.5,'vo','Five years. The four o’clock train. I sell cloth to men who hate me, to pay a debt I didn’t make, for a firm that counts my minutes.'),
(2,31,'vo','I’ve been awake for eighteen hundred mornings. I remember none of them.'),(3,39.5,'vo','Tonight I dreamed I had too many legs.'),
(4,120,'vo','One morning I woke from troubled dreams, and found that I had been changed, in my bed, into some kind of monstrous vermin.'),
(5,131.5,'vo','It wasn’t a dream. My room was still my room. The samples were still on the table.'),(6,150,'vo','My first thought was: I’ve missed the train.'),
(7,160,'vo','Something is wrong with my voice.'),(8,180,'on','Gregor? It’s a quarter to seven. Weren’t you going somewhere?'),
(9,190,'gregor','Yes. Thank you, Mother. I’m getting up.'),(10,195.5,'on','…Alright.'),(11,209,'on','Gregor. Gregor! What’s the matter?'),
(12,219,'on','Gregor? Aren’t you well? Do you need anything?'),(13,225,'gregor','I’m ready. I’m nearly ready.'),
(14,229.5,'vo','I lock my doors at night. A habit from hotels. I have never been so grateful for a habit.'),
(15,256,'vo','One late morning, and the firm sends the chief clerk himself. As if the whole family were under suspicion.'),
(16,284.5,'on','Mr. Samsa. You barricade yourself in your room. You answer in monosyllables. You cause your parents serious, and quite unnecessary, worry.'),
(17,295,'on','Your performance has been unsatisfactory for some time. There has been talk of the cash payments entrusted to you.'),
(18,305,'gregor','Sir, it’s a dizzy spell, nothing more. I’ll be on the eight o’clock.'),(19,315,'on','Did you understand a word of that?'),
(20,319.5,'on','That was the voice of an animal.'),(21,326,'on','Grete! Fetch the doctor. Anna — the locksmith. Quickly!'),
(22,338,'on','Something has fallen in there.'),(23,357,'on','Listen. He’s turning the key.'),
(24,365,'vo','Everyone should have been cheering me on. Go on, Gregor. Keep hold of that key.'),(25,391,'on','Oh!'),
(26,417,'gregor','I’ll get dressed. I’ll pack the samples. I’ll go.'),(27,422.5,'gregor','Sir, please. Put in a good word for me at the firm.'),
(28,536,'vo','Milk had always been my favorite. Now it disgusted me.'),(29,555,'vo','The fresh food I couldn’t stand. The rotten cheese, I devoured.'),
(30,575,'vo','She never looked at me while I ate. Kindness, or disgust. I couldn’t tell anymore.'),(31,587,'vo','My name is Gregor Samsa. I am still in here.')]

SR = 48000
W = os.environ.get('WORKDIR', '/home/user/work')
os.makedirs(W, exist_ok=True); os.chdir(W)
def sh(c): subprocess.run(c, shell=True, check=True)
def log(m): print(m, flush=True)

# ---- download
with open('dl.txt', 'w') as f:
    for k, v in V.items(): f.write(f'{B}{v}.mp4\nv{k}.mp4\n')
    for k, v in A.items(): f.write(f'{B}{v}.wav\na{k}.wav\n')
if os.environ.get('FAKE'):
    for k in V: sh(f'ffmpeg -v error -y -f lavfi -i testsrc=s=1376x768:r=24:d={6 if k in (11,25,39,42) else 10} -pix_fmt yuv420p v{k}.mp4')
    for k in A: sh(f'ffmpeg -v error -y -f lavfi -i sine=f=300:d=3 a{k}.wav')
else:
    sh("xargs -P 16 -n 2 sh -c 'curl -sSf -o \"$1\" \"$0\"' < dl.txt")
log('downloaded')

# ---- voice lines -> numpy, durations
def load(p):
    raw = subprocess.run(f'ffmpeg -v error -i {p} -ac 1 -ar {SR} -f f32le -', shell=True, check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()
VO = {k: load(f'a{k}.wav') for k in A}
DUR = {k: len(x) / SR for k, x in VO.items()}

# ---- text overlays (PIL)
def font(name, size):
    for p in [f'/usr/share/fonts/truetype/dejavu/{name}.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
        if os.path.exists(p): return ImageFont.truetype(p, size)
    return ImageFont.load_default()
F_CARD = font('DejaVuSerif', 38); F_CR = font('DejaVuSansMono', 30); F_SUP = font('DejaVuSans', 17)
F_SUB = font('DejaVuSans', 25); F_SUBI = font('DejaVuSans-Oblique', 25)
def spaced(t, n=2): return (' ' * (n - 1)).join(t) if t else t
def png_card(t, path):
    im = Image.new('RGB', (1280, 720), (0, 0, 0)); d = ImageDraw.Draw(im)
    s = spaced(t); w = d.textlength(s, font=F_CARD); d.text(((1280 - w) / 2, 336), s, font=F_CARD, fill=(222, 214, 190)); im.save(path)
def png_over(t, kind, path):
    im = Image.new('RGBA', (1280, 720), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    if kind == 'credit':
        s = spaced(t); d.text((112, 520), s, font=F_CR, fill=(236, 228, 205, 235)); d.text((114, 519), s, font=F_CR, fill=(160, 180, 170, 60))
    else:
        d.text((70, 586), spaced(t), font=F_SUP, fill=(222, 214, 190, 225))
    im.save(path)
def wrap(t, f, maxw, d):
    words, lines, cur = t.split(), [], ''
    for w_ in words:
        c = (cur + ' ' + w_).strip()
        if d.textlength(c, font=f) <= maxw: cur = c
        else: lines.append(cur); cur = w_
    lines.append(cur); return lines
def png_sub(t, italic, path):
    im = Image.new('RGBA', (1280, 720), (0, 0, 0, 0)); d = ImageDraw.Draw(im); f = F_SUBI if italic else F_SUB
    ls = wrap(t, f, 1080, d)[:2]; y = 640 if len(ls) == 2 else 655
    for ln in ls:
        w = d.textlength(ln, font=f); d.text(((1280 - w) / 2, y), ln, font=f, fill=(240, 232, 210, 255)); y += 33
    im.save(path)
SUBS = []
for k, st, kind, text in L:
    p = f'sub{k}.png'; png_sub(text, kind == 'vo', p); SUBS.append((st, st + DUR[k] + 0.4, p))

# ---- segments
GRADE = ('scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1,crop=1280:536:0:92,'
         'eq=contrast=1.07:saturation=0.78:gamma=0.97,colorbalance=rs=-0.03:gs=0.01:bs=0.03:rh=0.04:gh=0.02:bh=-0.05,'
         'noise=alls=9:allf=t,vignette=angle=0.55,pad=1280:720:0:92:black,fps=24')
ENC = '-c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -r 24 -threads 2 -an'
jobs, t = [], 0.0
for n, seg in enumerate(TL):
    out = f'seg{n:03d}.mp4'
    if seg[0] == 'card':
        _, d, text = seg; png_card(text, f'card{n}.png')
        base = f'-loop 1 -framerate 24 -t {d} -i card{n}.png'
        chain = f'[0:v]fade=in:st=0:d=0.8,fade=out:st={max(0.1, d - 0.8)}:d=0.8,noise=alls=7:allf=t,format=yuv420p[b]'
    else:
        _, idx, d, otext, okind = seg
        base = f'-i v{idx}.mp4'
        chain = f'[0:v]{GRADE},tpad=stop_mode=clone:stop_duration=3,trim=duration={d},setpts=PTS-STARTPTS[b]'
    ins, fl, last, k = [], [chain], 'b', 1
    if seg[0] == 'clip' and otext:
        png_over(otext, okind, f'ov{n}.png'); ins.append(f'-i ov{n}.png')
        a0 = 1.5 if okind == 'credit' else 0.5
        fl.append(f"[{last}][{k}:v]overlay=0:0:enable='between(t,{a0},{d - 0.8})'[o{k}]"); last = f'o{k}'; k += 1
    for s0, s1, p in SUBS:
        if s1 > t and s0 < t + d:
            ins.append(f'-i {p}')
            fl.append(f"[{last}][{k}:v]overlay=0:0:enable='between(t,{max(0, s0 - t):.2f},{min(d, s1 - t):.2f})'[o{k}]"); last = f'o{k}'; k += 1
    fl.append(f'[{last}]format=yuv420p[vout]')
    cmd = f"ffmpeg -v error -y {base} {' '.join(ins)} -filter_complex \"{';'.join(fl)}\" -map [vout] -t {seg[1] if seg[0]=='card' else seg[2]} {ENC} {out}"
    jobs.append(cmd); t += d
log(f'timeline {t:.1f}s, {len(jobs)} segments')
with cf.ThreadPoolExecutor(4) as ex:
    for i, r in enumerate(ex.map(lambda c: subprocess.run(c, shell=True).returncode, jobs)):
        if r: raise SystemExit(f'segment {i} failed: {jobs[i]}')
with open('list.txt', 'w') as f:
    for n in range(len(TL)): f.write(f'file seg{n:03d}.mp4\n')
sh('ffmpeg -v error -y -f concat -safe 0 -i list.txt -c copy video.mp4')
log('video done')

# ---- audio: score, sfx, voices
T = int(round(t)); N = T * SR; mix = np.zeros(N, np.float32); rng = np.random.default_rng(7)
tt = np.arange(N, dtype=np.float32) / SR
def lp_fast(x, fc, passes=2):
    k = max(1, int(SR / fc / 2)); y = x.astype(np.float64)
    for _ in range(passes):
        c = np.cumsum(np.concatenate([np.zeros(k), y, np.zeros(k)]))
        y = (c[k + k // 2: k + k // 2 + len(x)] - c[k // 2: k // 2 + len(x)]) / k
    return y.astype(np.float32)
def put(x, at, g=1.0):
    i = int(at * SR); j = min(N, i + len(x))
    if i < N: mix[i:j] += g * x[:j - i]
def env(n, a=0.005, r=0.3):
    e = np.ones(n, np.float32); ai = max(1, int(a * SR)); e[:ai] = np.linspace(0, 1, ai)
    return e * np.exp(-np.arange(n) / SR / max(r, 1e-3)).astype(np.float32)
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
def tick(): n = noise(0.03); return (n - lp_fast(n, 3000, 1)) * env(len(n), 0.001, 0.01) * 0.5
def thud(f0=90, d=0.6, g=0.9):
    n = int(d * SR); ph = 2 * np.pi * np.cumsum(np.linspace(f0, f0 * 0.4, n)) / SR
    return (np.sin(ph) * env(n, 0.002, d / 4) * g + lp_fast(noise(d), 300) * env(n, 0.001, 0.05) * g).astype(np.float32)
def boom(): return thud(70, 3.0, 1.0)
def knock(): return thud(160, 0.18, 0.7)
def bell():
    n = int(2.2 * SR); x = np.zeros(n, np.float32); s = np.arange(n) / SR
    x += (np.sin(2 * np.pi * 880 * s) * (s < 0.7) + np.sin(2 * np.pi * 660 * s) * (s >= 0.7)).astype(np.float32)
    return x * 0.12 * np.exp(-((s % 0.7)) * 3).astype(np.float32)
def steps(k, gap, g=0.6):
    x = np.zeros(int((k * gap + 0.5) * SR), np.float32)
    for i in range(k): j = int(i * gap * SR); s = thud(120, 0.15, g * (0.6 + 0.4 * rng.random())); x[j:j + len(s)] += s
    return x
def hiss(d=1.6): n = noise(d); return (n - lp_fast(n, 2500)) * np.sin(np.linspace(0, np.pi, len(n))).astype(np.float32) * 0.35
def creak(d=1.4):
    n = int(d * SR); s = np.arange(n) / SR; f = 180 + 60 * np.sin(2 * np.pi * 1.3 * s)
    return (np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.05 * np.sin(np.pi * s / d)).astype(np.float32) * (1 + 0.5 * rng.standard_normal(n).astype(np.float32) * 0.2)
# drone bed
lvl = np.ones(N, np.float32)
def setl(a, b, v): lvl[int(a * SR):int(b * SR)] = v
setl(0, 7, 0.35); setl(107, 112, 0.5); setl(319, 334, 0.15); setl(384, 506, 1.5); setl(506, 509, 0.0); setl(509, 514, 0.5); setl(594, T, 0.6)
lvl = lp_fast(lvl, 0.5, 1)
dr = np.zeros(N, np.float32)
for f, g in [(55, .5), (55.4, .5), (82.4, .35), (27.5, .6), (110.3, .15), (164.8, .08)]:
    dr += g * np.sin(2 * np.pi * f * tt + rng.random() * 6.28).astype(np.float32)
dr *= (0.75 + 0.25 * np.sin(2 * np.pi * 0.05 * tt)).astype(np.float32)
# voice ducking
vmask = np.zeros(N, np.float32)
for k, st, kind, _ in L: vmask[int(st * SR):int((st + DUR[k]) * SR)] = 1
vmask = lp_fast(vmask, 2, 1)
mix += 0.06 * dr * lvl * (1 - 0.45 * vmask)
# rain ambience in cold open
rain = noise(40); rain = (rain - lp_fast(rain, 1200)) * 0.025; rain *= np.minimum(1, np.minimum(np.arange(len(rain)), np.arange(len(rain))[::-1]) / SR / 3).astype(np.float32); put(rain, 7)
# ticks & pulses
for s in list(range(0, 47)) + list(range(107, 178)) + list(range(248, 254)): put(tick(), s + 0.02, 0.8 if s < 47 or 112 <= s < 118 or 248 <= s < 254 else 0.35)
for s in range(47, 107): put(thud(52, 0.7, 0.55), s)
# events
for at in (107, 390.2, 509, 594): put(boom(), at, 0.9)
for i in range(3): put(knock(), 179 + i * 0.33)
for i in range(5): put(knock(), 208.3 + i * 0.28, 1.2)
put(bell(), 255); put(steps(12, 0.22), 324.3); put(thud(90, 0.8, 1.0), 336.2)
for i in range(12): put(tick(), 355 + i * 1.6, 1.5)
put(thud(300, 0.08, 0.9), 382.8); put(creak(), 384.4); put(thud(80, 0.4, 0.6), 403)
put(steps(18, 0.14, 0.5), 437); w = noise(10); w = lp_fast(w, 400) * 0.25 * np.sin(np.linspace(0, np.pi, len(w))).astype(np.float32); put(w, 446)
put(hiss(), 457); put(hiss(), 461.5)
for i in range(12): put(thud(100, 0.3, 0.8), 466 + i * 0.8)
put(thud(60, 1.2, 1.3), 492.2)
# voices
for k, st, kind, _ in L:
    x = VO[k] / (np.max(np.abs(VO[k])) + 1e-6) * 0.5
    if kind == 'gregor':
        x = np.interp(np.arange(0, len(x), 1.12), np.arange(len(x)), x).astype(np.float32)
        s = np.arange(len(x)) / SR; x = x * (1 - 0.45 * (0.5 + 0.5 * np.sin(2 * np.pi * 63 * s))).astype(np.float32)
        ch = np.sin(2 * np.pi * np.cumsum(2200 + 900 * np.sin(2 * np.pi * 7 * s)) / SR).astype(np.float32) * 0.04 * (np.abs(x) > 0.05)
        x = lp_fast(x, 2600, 1) + ch; x *= 0.85
    elif kind == 'vo':
        x = x * 1.05
    put(x, st)
mix = np.tanh(mix * 1.6) / np.tanh(1.6); mix *= 0.89 / (np.max(np.abs(mix)) + 1e-6)
st = np.stack([mix, np.roll(mix, 240) * 0.96 + 0.04 * mix], 1).astype(np.float32); st.tofile('mix.f32')
log('audio done')
sh(f'ffmpeg -v error -y -i video.mp4 -f f32le -ar {SR} -ac 2 -i mix.f32 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart final.mp4')
if not os.environ.get('FAKE'): sh('ffprobe -v error -show_entries format=duration,size -of default=nw=1 final.mp4')
if len(sys.argv) > 1:
    sh(f"curl -sSf -X PUT -H 'Content-Type: video/mp4' --upload-file final.mp4 '{sys.argv[1]}' -o /dev/null -w 'upload %{{http_code}}\\n'")
log('ALL DONE')
