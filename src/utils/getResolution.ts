import ffmpeg from "fluent-ffmpeg";

export const getVideoResolution = async (inputVideoPath: string) => {
  return new Promise((resolve, reject) => {
    return ffmpeg.ffprobe(inputVideoPath, (err, metadata) => {
      if (err) return reject(err.message);
      const stream = metadata.streams.find((s) => s.width && s.height);
      if (!stream) return reject("Stream not available");
      resolve(stream?.height);
    });
  });
};
