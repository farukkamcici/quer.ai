import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

export async function uploadFileToS3(file) {
  if (!file || !BUCKET_NAME) {
    throw new Error("File or S3 Bucket Name is missing.");
  }

  const uniqueKey = `uploads/${uuidv4()}-${file.name}`;

  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: uniqueKey,
        Body: file.stream ? file.stream() : file, // Next.js File has stream()
        ContentType: file.type || "application/octet-stream",
      },
    });

    await upload.done();
    const s3Uri = `s3://${BUCKET_NAME}/${uniqueKey}`;
    console.log(`Successfully uploaded. URI: ${s3Uri}`);
    return s3Uri;
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error(`Failed to upload file to S3: ${error?.message || error}`);
  }
}
