import { cmsRequest, type UploadAsset } from "./types";

export async function uploadImage(file: File, purpose: "cover" | "gallery" | "avatar", onProgress: (percent: number) => void, artworkId?: string): Promise<UploadAsset> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Choose a PNG, JPG, or WebP image.");
  if (file.size > 10 * 1024 * 1024) throw new Error("This image is too large. Choose an image under 10 MB.");
  if (!file.size) throw new Error("This file is empty. Please choose another image.");
  const { upload } = await cmsRequest<{ upload: { id: string; path: string; token: string; signedUrl: string } }>("/api/uploads", { method: "POST", body: JSON.stringify({ action: "prepare", artworkId, purpose, filename: file.name, contentType: file.type, sizeBytes: file.size }) });
  try {
    await new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("PUT", upload.signedUrl); request.setRequestHeader("Content-Type", file.type); request.setRequestHeader("x-upsert", "false"); request.timeout = 120000;
      request.upload.onprogress = event => { if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 90)); };
      request.onerror = () => reject(new Error("The upload could not reach storage. Check your connection and try again."));
      request.ontimeout = () => reject(new Error("The upload took too long. Please try again."));
      request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error("Storage could not accept this image. Please try again."));
      request.send(file);
    });
    onProgress(95);
    const { asset } = await cmsRequest<{ asset: UploadAsset }>("/api/uploads", { method: "POST", body: JSON.stringify({ action: "finalize", id: upload.id }) });
    onProgress(100); return asset;
  } catch (error) {
    await cmsRequest("/api/uploads", { method: "DELETE", body: JSON.stringify({ id: upload.id }) }).catch(() => undefined);
    throw error;
  }
}
