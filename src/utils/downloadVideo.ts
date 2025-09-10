import { GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import { s3 } from "../config/aws_s3.js";
import type Stream from "stream";
import path from "path";

export const downloadVideo = async (videoName: string) => {
  const inputVideoPath = path.resolve(videoName);
  const { Body, ContentLength } = await s3.send(
    new GetObjectCommand({
      Bucket: "version-control-video-checking",
      Key: videoName,
    })
  );
  const totalLength = ContentLength;
  let chunkLength = 0;
  if (!Body || !totalLength) throw new Error("File not available");

  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(inputVideoPath);
    const fileBody = Body as Stream;
    fileBody.pipe(writeStream);

    fileBody.on("data", (chunk) => {
      chunkLength += chunk.length;
      console.log(
        `Downloading : ${((chunkLength / totalLength) * 100).toPrecision(4)}%`
      );
    });
    writeStream.on("finish", () => {
      console.log("Download Complete !!");
      resolve(1);
    });
    writeStream.on("error", reject);
  });
};
