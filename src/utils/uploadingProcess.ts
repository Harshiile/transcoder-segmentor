import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { s3 } from "../config/aws_s3.js";

const s3Upload = async (
  bucketName: string,
  fileKey: string,
  filePath: string
) => {
  await s3
    .send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: fs.createReadStream(filePath),
        IfNoneMatch: "*",
      })
    )
    .catch((err) => {
      if (err.name == "PreconditionFailed") {
        console.log("Same object exist :", fileKey);
        return;
      } else err;
    });
};
export const uploadSegmentsToS3 = async (
  outputSubFolderPath: string,
  workspace: string
) => {
  if (!fs.existsSync(outputSubFolderPath)) throw new Error("Folder not exists");

  const files = fs.readdirSync(outputSubFolderPath);

  for (const file of files) {
    let bucketName = "version-control-segments";
    let fileKey = file;
    const tmpAr = outputSubFolderPath.split("/");
    const resolution = tmpAr[tmpAr.length - 1]!.split("_")[1];

    if (file.endsWith("m3u8")) {
      bucketName = "version-control-playlist";
      fileKey = `${workspace}/playlist_${resolution}.m3u8`;

      console.log(fileKey);
    }
    await s3Upload(
      bucketName,
      fileKey,
      path.resolve(outputSubFolderPath, file)
    ).catch((err) => {
      throw err;
    });
  }
  fs.rmSync(outputSubFolderPath, { recursive: true });
};
