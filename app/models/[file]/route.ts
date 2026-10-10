import { readModel } from "@/lib/models";

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const data = await readModel(file);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "model/gltf-binary",
      // file names carry a timestamp, so they can be cached forever
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
