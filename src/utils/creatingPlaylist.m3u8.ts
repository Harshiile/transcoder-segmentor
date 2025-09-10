import fs from "fs";
import { hashing } from "./hashing.js";
import path from "path";

export const creatingPlaylistFile = async (outputSubFolderPath: string) => {
  const oldContent = fs
    .readFileSync(`${outputSubFolderPath}/playlist.m3u8`)
    .toString("utf-8")
    .split("\n");

  const newContent: string[] = [];

  const startIndex = 4; // Skipping first 4 lines
  for (let i = 0; i != oldContent.length - 1; i++) {
    const contentName = oldContent[i] as string;
    if (i < startIndex) newContent.push(contentName);
    else {
      if (i % 2 == 0) newContent.push(contentName); // Copy Duration
      else {
        const hash = await hashing(`${outputSubFolderPath}/${contentName}`);
        fs.renameSync(
          `${outputSubFolderPath}/${contentName}`,
          `${outputSubFolderPath}/seg_${hash}.ts`
        );
        newContent.push(`/segments/seg_${hash}.ts`);
      }
    }
  }

  // fs.writeFileSync(
  //   `${outputSubFolderPath}/playlist.m3u8`,
  //   newContent.join("\n")
  // );
};
