import { uploadFile, useMockApi } from "./client";

/** Reads a file as a base64 data URL, used as the mock-mode "upload". */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(file: File): Promise<{ url: string }> {
  if (useMockApi()) {
    const url = await readAsDataUrl(file);
    return { url };
  }
  return uploadFile(file);
}
