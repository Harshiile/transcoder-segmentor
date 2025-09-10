import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { downloadVideo } from "./utils/downloadVideo.js";
import { getVideoResolution } from "./utils/getResolution.js";
import { uploadSegmentsToS3 } from "./utils/uploadingProcess.js";
import { creatingPlaylistFile } from "./utils/creatingPlaylist.m3u8.js";

// Resolutions Array
const RESOLUTIONS = [
  { resolution: 144, width: 256, height: 144 },
  { resolution: 240, width: 426, height: 240 },
  { resolution: 360, width: 640, height: 360 },
  { resolution: 480, width: 854, height: 480 },
  { resolution: 720, width: 1280, height: 720 },
  { resolution: 1080, width: 1920, height: 1080 },
  { resolution: 1440, width: 2560, height: 1440 },
  { resolution: 2160, width: 3840, height: 2160 },
];

const mainProcess = async (
  inputVideoPath: string,
  outputFolderPath: string,
  index: number,
  workspace: string
) => {
  const res = RESOLUTIONS[index];
  if (!res) throw new Error("Resolution not available");

  // Ex : /outputFolder/144/
  const outputSubFolderPath = path.resolve(
    outputFolderPath,
    `output_${res.resolution}`
  );

  // Creation of Sub-Folder
  if (!fs.existsSync(outputSubFolderPath)) fs.mkdirSync(outputSubFolderPath);

  return new Promise((resolve, reject) => {
    // Main Process - Transcoding + Segmentation
    ffmpeg(inputVideoPath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .size(`${res.width}x${res.height}`) // Transcoding
      .outputOptions([
        // Segmentation
        "-preset fast",
        "-crf 18",
        "-f hls",
        "-hls_time 6",
        "-hls_list_size 0",
        `-hls_segment_filename ${outputSubFolderPath}/seg_${res.resolution}_%02d.ts`,
      ])
      .on("progress", (p) =>
        console.log(
          `Process for resolution : ${
            res.resolution
          } done : ${p?.percent?.toPrecision(3)}%`
        )
      )
      .on("end", async () => {
        console.log(`Process of ${res.resolution} Done`);
        fs.unlinkSync(`${outputSubFolderPath}/playlist.m3u8`);

        // Create playlist.m3u8
        await creatingPlaylistFile(outputSubFolderPath);

        // Upload on S3
        await uploadSegmentsToS3(outputSubFolderPath, workspace).catch(reject);
      })
      .on("error", reject)
      .output(path.resolve(`${outputSubFolderPath}/playlist.m3u8`))
      .run();
  });
};

// Entry Point
const init = async () => {
  const videoName = process.env.VIDEO_NAME;
  const workspace = process.env.WORKSPACE;
  let outputFolderPath = process.env.OUTPUT_FOLDER; // Where segments are going to store

  if (!workspace || !videoName || !outputFolderPath)
    throw new Error("Params are not given");

  // Download the video
  const inputVideoPath = path.resolve(videoName);
  await downloadVideo(videoName);

  // Output Folder creation
  outputFolderPath = path.resolve(outputFolderPath);
  if (!fs.existsSync(outputFolderPath)) fs.mkdirSync(outputFolderPath);

  // Getting video resolution
  const videoResolution = (await getVideoResolution(inputVideoPath)) as number;
  console.log("Video Resolution :", videoResolution);

  // Process Start
  let index = -1;
  for (const res of RESOLUTIONS) {
    ++index;
    if (res.resolution <= videoResolution) {
      await new Promise((resolve, reject) => {
        mainProcess(inputVideoPath, outputFolderPath, index, workspace)
          .then(resolve)
          .catch(reject);
      });
    }
  }

  // Removing Downloaded video
  fs.unlinkSync(inputVideoPath);
};

init()
  .catch((err) => console.log("Error : ", err))
  .finally(() => process.exit(1));
