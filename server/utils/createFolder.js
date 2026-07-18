import { app } from "electron";
import path from "path";
import fs from "fs-extra";
import { TORRENT_URLS } from "../config.js";

export const createDownlaodFolder = () => {
  const downloadsPath = path.join(app.getPath("temp"), "stream-downloads");

  if (!fs.existsSync(downloadsPath)) {
    fs.mkdirSync(downloadsPath, { recursive: true });
  }

  return downloadsPath;
};

export const createContentTvFolder = () => {
  const directoryPath = path.join(app.getPath("temp"), "stream-content", "tv");

  try {
    fs.mkdirSync(directoryPath, { recursive: true });
    return directoryPath;
  } catch (err) {
    console.error("Ошибка при создании папки:", err);
    return null;
  }
};

export const createContentUrlsFolder = () => {
  const directoryPath = path.join(
    app.getPath("temp"),
    "stream-content",
    "urls"
  );

  console.log("directoryPath: ", directoryPath);

  if (!fs.existsSync(directoryPath)) {
    try {
      fs.mkdirSync(directoryPath, { recursive: true });
    } catch (err) {
      console.error("Ошибка при создании папки:", err);
      return null;
    }
  }

  if (
    fs.existsSync(directoryPath) &&
    !fs.existsSync(`${directoryPath}/baseUrl.json`)
  ) {
    try {
      fs.writeFileSync(
        `${directoryPath}/baseUrl.json`,
        JSON.stringify({ url: "" }, null, 2)
      );
    } catch (err) {
      console.error("Ошибка при создании baseUrl.json:", err);
      return null;
    }
  }
  if (
    fs.existsSync(directoryPath) &&
    !fs.existsSync(`${directoryPath}/urls.json`)
  ) {
    try {
      fs.writeFileSync(
        `${directoryPath}/urls.json`,
        JSON.stringify(TORRENT_URLS, null, 2)
      );
    } catch (err) {
      console.error("Ошибка при создании urls.json:", err);
      return null;
    }
  }

  return directoryPath;
};
