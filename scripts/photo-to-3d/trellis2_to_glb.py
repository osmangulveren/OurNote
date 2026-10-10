"""
Photo → textured GLB with Microsoft TRELLIS.2 (MIT licence), sized for the web shop.

Runs on a Linux machine with an NVIDIA GPU (24 GB+ VRAM, e.g. RTX 4090 / A100 / H100),
inside an environment set up with TRELLIS.2's own installer:

    git clone -b main https://github.com/microsoft/TRELLIS.2.git --recursive
    cd TRELLIS.2
    . ./setup.sh --new-env --basic --flash-attn --nvdiffrast --nvdiffrec --cumesh --o-voxel --flexgemm
    conda activate trellis2

Then, from inside the TRELLIS.2 folder:

    python /path/to/trellis2_to_glb.py --image sofa.jpg --sku SB-190 --out ./out
    python /path/to/trellis2_to_glb.py --batch jobs.json --out ./out     # [{"sku": "...", "image": "..."}]

and attach the result to the product (from the shop repo):

    npm run model:attach -- SB-190 ./out/SB-190.glb

Tips for good results: one product per photo, a clean (ideally white) background,
the whole piece in frame, a 3/4 front view like a catalogue shot. The background is
removed automatically. The back of the piece is invented by the model — check it.
"""
import argparse
import json
import os
import sys

os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True")

from PIL import Image  # noqa: E402
import torch  # noqa: E402
from trellis2.pipelines import Trellis2ImageTo3DPipeline  # noqa: E402
import o_voxel  # noqa: E402


def convert(pipeline, image_path, out_path, args):
    image = Image.open(image_path)
    mesh = pipeline.run(image, seed=args.seed, pipeline_type=args.pipeline)[0]
    mesh.simplify(16777216)  # nvdiffrast limit, as in the official example
    glb = o_voxel.postprocess.to_glb(
        vertices=mesh.vertices,
        faces=mesh.faces,
        attr_volume=mesh.attrs,
        coords=mesh.coords,
        attr_layout=mesh.layout,
        voxel_size=mesh.voxel_size,
        aabb=[[-0.5, -0.5, -0.5], [0.5, 0.5, 0.5]],
        decimation_target=args.faces,  # web: a few hundred thousand faces is plenty
        texture_size=args.texture,  # 2048 keeps files small enough for product pages
        remesh=True,
        remesh_band=1,
        remesh_project=0,
        verbose=False,
    )
    glb.export(out_path, extension_webp=True)
    print(f"✓ {image_path} → {out_path} ({os.path.getsize(out_path) / 1e6:.1f} MB)")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--image", help="product photo")
    ap.add_argument("--sku", help="product SKU, used as the output file name")
    ap.add_argument("--batch", help='JSON file: [{"sku": "SB-190", "image": "photos/sb190.jpg"}, ...]')
    ap.add_argument("--out", default="out")
    ap.add_argument("--pipeline", default="1024_cascade", choices=["512", "1024", "1024_cascade", "1536_cascade"])
    ap.add_argument("--faces", type=int, default=300_000)
    ap.add_argument("--texture", type=int, default=2048)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()

    jobs = []
    if args.batch:
        with open(args.batch) as f:
            jobs = json.load(f)
    elif args.image and args.sku:
        jobs = [{"sku": args.sku, "image": args.image}]
    else:
        ap.error("give --image and --sku, or --batch")

    if not torch.cuda.is_available():
        sys.exit("TRELLIS.2 needs an NVIDIA GPU with CUDA (24 GB+ VRAM).")

    os.makedirs(args.out, exist_ok=True)
    pipeline = Trellis2ImageTo3DPipeline.from_pretrained("microsoft/TRELLIS.2-4B")
    pipeline.cuda()
    for job in jobs:
        try:
            convert(pipeline, job["image"], os.path.join(args.out, f"{job['sku']}.glb"), args)
        except Exception as e:  # keep going with the rest of the batch
            print(f"✗ {job['sku']}: {e}")


if __name__ == "__main__":
    main()
