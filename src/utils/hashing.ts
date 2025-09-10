import { createHash } from "crypto";
import fs from "fs";

export const hashing = async (filePath: string) => {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");

    const stream = fs.createReadStream(filePath);

    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
};
