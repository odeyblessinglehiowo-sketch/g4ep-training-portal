import { cloudinary } from "@/lib/cloudinary";

type UploadFolder = "g4ep/assignments" | "g4ep/submissions";

export async function uploadFileToCloudinary(
  file: File,
  folder: UploadFolder
) {
  if (!file || file.size === 0) {
    return null;
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return await new Promise<{
    secure_url: string;
    public_id: string;
    resource_type: string;
    format?: string;
    original_filename?: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload failed."));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
          format: result.format,
          original_filename: result.original_filename,
        });
      }
    );

    stream.end(buffer);
  });
}