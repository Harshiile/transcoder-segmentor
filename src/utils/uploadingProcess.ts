import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { s3 } from "../config/aws_s3.js";

export const uploadSegmentsToS3 = async (
  resolutionFolder: string,
  workspace: string
) => {
  resolutionFolder = path.resolve(resolutionFolder);
  if (!fs.existsSync(resolutionFolder)) throw new Error("Folder not exists");

  const files = fs.readdirSync(resolutionFolder);

  for (const file of files) {
    let bucketName = "version-control-segments";
    let fileKey = file;
    if (file.endsWith("m3u8")) {
      bucketName = "version-control-playlist";
      fileKey = `${workspace}/playlist.m3u8`;
    }
    await s3
      .send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileKey,
          Body: fs.createReadStream(path.resolve(resolutionFolder, file)),
        })
      )
      .catch((err) => {
        throw new Error(err.message);
      });

    fs.unlinkSync(`${resolutionFolder}/${file}`);
  }
};
