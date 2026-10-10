# 3D models from product photos

Every product already has a **built-in 3D model** generated from its dimensions (`shape` in the catalog).
For a model that looks like the real piece, attach a **GLB** made from a product photo. The shop then shows the GLB in
the product viewer and catalog cards, recolours its upholstery with the chosen fabric, and enables
**View in your room** (AR on phones).

## Recommended tool: Microsoft TRELLIS.2

| | |
|---|---|
| Repo | https://github.com/microsoft/TRELLIS.2 |
| Licence | MIT (code). Check the model card at huggingface.co/microsoft/TRELLIS.2-4B before commercial use. |
| Output | Textured GLB with PBR materials (up to 4096² textures) |
| Needs | Linux + NVIDIA GPU with **24 GB+ VRAM** (RTX 4090, A100, H100), CUDA 12.4 |

Alternatives we looked at:
- **Hunyuan3D 2.x (Tencent):** high quality, but its licence **excludes the EU, the UK and South Korea**, so it is not usable for this business.
- **TripoSR (MIT):** runs on CPU, but its shapes and textures are noticeably rougher. Fine for drafts only.

### Option A — no install: the official demo
1. Open https://huggingface.co/spaces/microsoft/TRELLIS.2 and upload the photo.
2. Download the GLB.
3. In **Admin → Products → (product)**, use **3D model → Upload .glb**, then save.

### Option B — your own or a rented GPU (batch)
```sh
git clone -b main https://github.com/microsoft/TRELLIS.2.git --recursive && cd TRELLIS.2
. ./setup.sh --new-env --basic --flash-attn --nvdiffrast --nvdiffrec --cumesh --o-voxel --flexgemm
conda activate trellis2
python /path/to/shop/scripts/photo-to-3d/trellis2_to_glb.py --image sofa.jpg --sku SB-190 --out ./out
# or many products: --batch jobs.json   with [{"sku": "SB-190", "image": "photos/sb-190.jpg"}, ...]
```
Then, from the shop repo:
```sh
npm run model:attach -- SB-190 ./out/SB-190.glb            # add --rotate 90 if it faces sideways
```
The script exports web-friendly files (about 300k faces, 2048² WebP textures). Hourly GPU rentals (RunPod, Vast.ai,
Lambda…) work well for converting a whole catalogue in one session.

### Option C — no photo yet
**Admin → Products → (product) → Generate GLB** saves the built-in model as the product's GLB, which is enough for
*View in your room*.

## Photos that convert well
- One product per photo, the whole piece in frame, a plain light background (it is removed automatically).
- A 3/4 front view like a catalogue shot, in even light without harsh shadows.
- The back and the hidden sides are *invented* by the model, so always check them before publishing.

## What happens to an uploaded GLB
- It is **made true to size**: turned by the rotation you enter, scaled so its width equals the product's width in
  `shape.width`, centred, and stood on the floor (`lib/glb.ts`). AR viewers open the file directly, so this is what
  makes the AR size correct.
- In the shop the upholstery is **recoloured with the selected fabric**. Texture pixels close to the dominant fabric
  colour are re-tinted, keeping the scan's shading and seams. Legs, chrome and other off-colour parts stay as scanned.
  Untick *Recolour with chosen fabric* for pieces where this doesn't suit (for example wood or metal furniture).
- *Open as bed* switches to the built-in model, because a static scan can't animate its mechanism.

## Hosting note
Models are stored in `storage/models/` (or `MODELS_DIR`) and served from `/models/<file>`. This needs a persistent
disk (a VPS, Docker volume, Railway or Render disk). On serverless hosting (for example Vercel), move uploads to object
storage such as S3, Cloudflare R2 or Vercel Blob, and store that URL in the product's model URL field.
