import os from 'node:os'; // ◄ Встроенный модуль Node.js (работает везде)
import path from 'node:path';
import fs from 'node:fs';     // ◄ Нативный модуль вместо fs-extra
import { TORRENT_URLS } from "../config.js";

export const createDownlaodFolder = () => {
  // Нативный аналог app.getPath("temp")
  const downloadsPath = path.join(os.tmpdir(), "stream-downloads");

  if (!fs.existsSync(downloadsPath)) {
    fs.mkdirSync(downloadsPath, { recursive: true });
  }

  return downloadsPath;
};

export const createContentTvFolder = () => {
  // Нативный аналог app.getPath("temp")
  const directoryPath = path.join(os.tmpdir(), "stream-content", "tv");

  try {
    fs.mkdirSync(directoryPath, { recursive: true });
    return directoryPath;
  } catch (err) {
    console.error("Ошибка при создании папки:", err);
    return null;
  }
};

export const createContentUrlsFolder = () => {
  // Нативный аналог app.getPath("temp")
  const directoryPath = path.join(os.tmpdir(), "stream-content", "urls");

  console.log("directoryPath: ", directoryPath);

  if (!fs.existsSync(directoryPath)) {
    try {
      fs.mkdirSync(directoryPath, { recursive: true });
    } catch (err) {
      console.error("Ошибка при создании папки:", err);
      return null;
    }
  }

  if (fs.existsSync(directoryPath) && !fs.existsSync(path.join(directoryPath, "baseUrl.json"))) {
    try {
      fs.writeFileSync(
        path.join(directoryPath, "baseUrl.json"),
        JSON.stringify({ url: "" }, null, 2)
      );
    } catch (err) {
      console.error("Ошибка при создании baseUrl.json:", err);
      return null;
    }
  }

  if (fs.existsSync(directoryPath) && !fs.existsSync(path.join(directoryPath, "urls.json"))) {
    try {
      fs.writeFileSync(
        path.join(directoryPath, "urls.json"),
        JSON.stringify(TORRENT_URLS, null, 2)
      );
    } catch (err) {
      console.error("Ошибка при создании urls.json:", err);
      return null;
    }
  }

  return directoryPath;
};
