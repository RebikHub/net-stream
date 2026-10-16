export const isVideoFile = (fileName) => {
  const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.ts', '.m4v', '.webm'];
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  return videoExtensions.includes(ext);
};
