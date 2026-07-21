var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.js
var index_exports = {};
__export(index_exports, {
  CONTENT_TV_PATH: () => CONTENT_TV_PATH,
  CONTENT_URLS_PATH: () => CONTENT_URLS_PATH,
  WEBTORRENT_DOWNLOAD_PATH: () => WEBTORRENT_DOWNLOAD_PATH
});
module.exports = __toCommonJS(index_exports);

// app.js
var import_express4 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);

// routes/tv.js
var import_express = require("express");

// controllers/tv/tvController.js
var import_promises2 = require("node:fs/promises");

// config.js
var PORT = process.env.PORT || 8e3;
var TV_CHANNELS_URL = "https://iptv-org.github.io/api/channels.json";
var TV_STREAMS_URL = "https://iptv-org.github.io/api/streams.json";
var FILTER_ARRAY = [1, 5, 7, 10, 4, 16];
var TORRENT_URLS = [
  { url: "https://rutor.info" },
  { url: "https://6-ffyg.123tt.ru" },
  { url: "https://3-new-rutor.123rutor.su" },
  { url: "https://9-ixwrqnqb.123tt.ru" },
  { url: "https://9-fkqg.123tt.ru" },
  { url: "https://6-lrea.123tt.ru" },
  { url: "https://6-ixwrqzis.123tt.ru" },
  { url: "https://9-ixwrqzis.123tt.ru" },
  { url: "https://9-isqiegpg.123tt.ru" },
  { url: "https://6-isqiegpg.123tt.ru" },
  { url: "https://6-ixwrqzer.123tt.ru" },
  { url: "https://rutor.org" },
  { url: "https://9-ixwrqzer.123tt.ru" },
  { url: "https://9-isqpykoy.123tt.ru" }
];
var PLAYLIST_URL = "https://raw.githubusercontent.com/blackbirdstudiorus/LoganetXIPTV/main/";

// utils/readJson.js
var import_promises = require("node:fs/promises");

// utils/checklinks.js
async function checkUrls(list) {
  const filteredPromises = list.map(async (item) => {
    const result = await checkM3U8Stream(item.url);
    return { item, result };
  });
  const filteredResults = await Promise.all(filteredPromises);
  const filteredArray = filteredResults.filter(({ result }) => result).map(({ item }) => item);
  console.log("Checking complete!");
  return filteredArray;
}
async function checkM3U8Stream(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5e3) });
    if (response.status === 200) {
      const text = await response.text();
      return text.includes("#EXTM3U");
    }
    return false;
  } catch (error) {
    return false;
  }
}

// utils/readJson.js
var readJsonId = async (id) => {
  const filePath = "./src/torrents/torrents.json";
  const data = await (0, import_promises.readFile)(filePath, "utf8");
  const parsedData = JSON.parse(data);
  return parsedData.find((tor) => tor.id === id);
};
var readJson = async (path3) => {
  try {
    const data = await (0, import_promises.readFile)(path3, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(error);
    return null;
  }
};
var createPlaylists = async () => {
  const channels = await readJson(`${CONTENT_TV_PATH}/channels.json`);
  const streams = await readJson(`${CONTENT_TV_PATH}/streams.json`);
  const playlist = [];
  streams.forEach((stream) => {
    const channel = channels.find((el) => el.id === stream.channel);
    if (channel) {
      playlist.push({
        ...channel,
        stream: {
          ...stream
        }
      });
    } else if (stream.channel.trim() === "" && stream.url !== "") {
      playlist.push({
        id: stream.url,
        name: stream.url,
        website: "",
        logo: "",
        country: "noname",
        is_nsfw: false,
        languages: [""],
        stream: {
          url: stream.url
        }
      });
    }
  });
  await (0, import_promises.writeFile)(
    `${CONTENT_TV_PATH}/playlist.json`,
    JSON.stringify(playlist, null, 2)
  );
  const ru = playlist.filter((el) => el.country.toLowerCase() === "ru");
  const urlsRu = ru.map((el) => ({
    id: el.id,
    name: el.name,
    logo: el.logo,
    url: el.stream.url,
    website: el.website
  }));
  await (0, import_promises.writeFile)(`${CONTENT_TV_PATH}/ru.json`, JSON.stringify(urlsRu, null, 2));
  const en = playlist.filter(
    (el) => el.languages[0].toLowerCase() === "eng" && !el.is_nsfw
  );
  const urlsEn = en.map((el) => ({
    id: el.id,
    name: el.name,
    logo: el.logo,
    url: el.stream.url,
    website: el.website
  }));
  await (0, import_promises.writeFile)(`${CONTENT_TV_PATH}/en.json`, JSON.stringify(urlsEn, null, 2));
  const nsfw = playlist.filter((el) => el.is_nsfw);
  const urlsNsfw = nsfw.map((el) => ({
    id: el.id,
    name: el.name,
    logo: el.logo,
    url: el.stream.url,
    website: el.website
  }));
  await (0, import_promises.writeFile)(`${CONTENT_TV_PATH}/nsfw.json`, JSON.stringify(urlsNsfw, null, 2));
  const noname = playlist.filter((el) => el.country === "noname");
  const urlsNoname = noname.map((el) => ({
    id: el.id,
    name: el.name,
    logo: el.logo,
    url: el.stream.url,
    website: el.website
  }));
  await (0, import_promises.writeFile)(
    `${CONTENT_TV_PATH}/noname.json`,
    JSON.stringify(urlsNoname, null, 2)
  );
  const checkedRu = await checkUrls(urlsRu);
  console.log("write checkedRu");
  await (0, import_promises.writeFile)(
    `${CONTENT_TV_PATH}/checkedRu.json`,
    JSON.stringify(checkedRu, null, 2)
  );
  const checkedEn = await checkUrls(urlsEn);
  console.log("write checkedEn");
  await (0, import_promises.writeFile)(
    `${CONTENT_TV_PATH}/checkedEn.json`,
    JSON.stringify(checkedEn, null, 2)
  );
  const checkedNoname = await checkUrls(urlsNoname);
  console.log("write checkedNoname");
  await (0, import_promises.writeFile)(
    `${CONTENT_TV_PATH}/checkedNoname.json`,
    JSON.stringify(checkedNoname, null, 2)
  );
};

// utils/parsePlaylist.js
var parsePlaylist = (data) => {
  const lines = data.split("\n");
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("#EXTINF:-1")) {
      const name = line.split(",")[1].trim();
      let url = "";
      if (lines[i + 1].startsWith("http") && lines[i + 1].endsWith(".m3u8")) {
        url = lines[i + 1];
      }
      if (url) {
        const channel = {
          id: name.toLowerCase().replace(/ /g, ""),
          name,
          logo: "",
          url,
          website: ""
        };
        result.push(channel);
      }
    }
  }
  return result;
};

// utils/createFolder.js
var import_node_os = __toESM(require("node:os"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var import_node_fs = __toESM(require("node:fs"), 1);
var createDownlaodFolder = () => {
  const downloadsPath = import_node_path.default.join(import_node_os.default.tmpdir(), "stream-downloads");
  if (!import_node_fs.default.existsSync(downloadsPath)) {
    import_node_fs.default.mkdirSync(downloadsPath, { recursive: true });
  }
  return downloadsPath;
};
var createContentTvFolder = () => {
  const directoryPath = import_node_path.default.join(import_node_os.default.tmpdir(), "stream-content", "tv");
  try {
    import_node_fs.default.mkdirSync(directoryPath, { recursive: true });
    return directoryPath;
  } catch (err) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u043F\u0430\u043F\u043A\u0438:", err);
    return null;
  }
};
var createContentUrlsFolder = () => {
  const directoryPath = import_node_path.default.join(import_node_os.default.tmpdir(), "stream-content", "urls");
  console.log("directoryPath: ", directoryPath);
  if (!import_node_fs.default.existsSync(directoryPath)) {
    try {
      import_node_fs.default.mkdirSync(directoryPath, { recursive: true });
    } catch (err) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u043F\u0430\u043F\u043A\u0438:", err);
      return null;
    }
  }
  if (import_node_fs.default.existsSync(directoryPath) && !import_node_fs.default.existsSync(import_node_path.default.join(directoryPath, "baseUrl.json"))) {
    try {
      import_node_fs.default.writeFileSync(
        import_node_path.default.join(directoryPath, "baseUrl.json"),
        JSON.stringify({ url: "" }, null, 2)
      );
    } catch (err) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 baseUrl.json:", err);
      return null;
    }
  }
  if (import_node_fs.default.existsSync(directoryPath) && !import_node_fs.default.existsSync(import_node_path.default.join(directoryPath, "urls.json"))) {
    try {
      import_node_fs.default.writeFileSync(
        import_node_path.default.join(directoryPath, "urls.json"),
        JSON.stringify(TORRENT_URLS, null, 2)
      );
    } catch (err) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 urls.json:", err);
      return null;
    }
  }
  return directoryPath;
};

// controllers/tv/tvController.js
var getChannelList = async (path3, res2) => {
  try {
    const playlist = await readJson(path3);
    if (!playlist || playlist.length === 0) {
      const channelsRes = await fetch(TV_CHANNELS_URL);
      const channelsData = await channelsRes.json();
      await (0, import_promises2.writeFile)(
        `${CONTENT_TV_PATH}/channels.json`,
        JSON.stringify(channelsData, null, 2)
      );
      const streamsRes = await fetch(TV_STREAMS_URL);
      const streamsData = await streamsRes.json();
      await (0, import_promises2.writeFile)(
        `${CONTENT_TV_PATH}/streams.json`,
        JSON.stringify(streamsData, null, 2)
      );
      await createPlaylists();
      const list = await readJson(path3);
      return res2.status(200).json(list);
    }
    return res2.status(200).json(playlist);
  } catch (error) {
    console.error(error);
    return res2.status(500).json({ error: "Failed to response playlist" });
  }
};
var getPlaylistEn = async (req, res2) => {
  await getChannelList(`${CONTENT_TV_PATH}/checkedEn.json`, res2);
};
var getPlaylistAll = async (req, res2) => {
  try {
    const playlist = await readJson(`${CONTENT_TV_PATH}/all.json`);
    if (!playlist || playlist.length === 0) {
      const response = await fetch(PLAYLIST_URL + "LoganetXAll.m3u");
      const textData = await response.text();
      if (textData) {
        const parsedPlaylist = parsePlaylist(textData);
        if (parsedPlaylist && parsedPlaylist.length) {
          await (0, import_promises2.writeFile)(
            `${CONTENT_TV_PATH}/all.json`,
            JSON.stringify(parsedPlaylist, null, 2)
          );
          return res2.status(200).json(parsedPlaylist);
        }
      }
    } else {
      return res2.status(200).json(playlist);
    }
  } catch (error) {
    console.error(error);
    return res2.status(500).json({ error: "Failed to response playlist" });
  }
};
var getPlaylistUpdateAll = async (req, res2) => {
  try {
    const response = await fetch(PLAYLIST_URL + "LoganetXAll.m3u");
    const textData = await response.text();
    if (textData) {
      const parsedPlaylist = parsePlaylist(textData);
      if (parsedPlaylist && parsedPlaylist.length) {
        await (0, import_promises2.writeFile)(
          `${CONTENT_TV_PATH}/all.json`,
          JSON.stringify(parsedPlaylist, null, 2)
        );
        return res2.status(200).json(parsedPlaylist);
      }
    }
    return res2.status(400).json({ error: "Playlist is empty or invalid" });
  } catch (error) {
    console.error(error);
    return res2.status(500).json({ error: "Failed to response playlist" });
  }
};

// routes/tv.js
var router = (0, import_express.Router)();
router.get("/update", getPlaylistUpdateAll);
router.get("/playlist/ru", getPlaylistAll);
router.get("/playlist/en", getPlaylistEn);
var tv_default = router;

// routes/video.js
var import_express2 = require("express");

// controllers/video/torrentController.js
var import_webtorrent = __toESM(require("webtorrent"), 1);

// utils/startVLC.js
var import_child_process = __toESM(require("child_process"), 1);
var import_vlc_command = __toESM(require("vlc-command"), 1);
var proc = null;
function spawn(url) {
  (0, import_vlc_command.default)((err, vlcPath) => {
    if (err) {
      console.error("Error getting VLC path:", err);
      if (process.platform === "linux") {
        spawnExternal("/usr/bin/vlc", prepareArgs(url));
      }
      return;
    }
    spawnExternal(vlcPath, prepareArgs(url));
  });
}
function prepareArgs(url) {
  const args = [
    "--quiet",
    "--network-caching=1000",
    // Кеш в 1 секунду, чтобы быстрее стартовало
    url
  ];
  if (process.platform === "linux") {
    if (process.env.DISPLAY || process.env.WAYLAND_DISPLAY) {
      args.unshift("--intf", "qt");
    }
  }
  return args;
}
function spawnExternal(playerPath, args) {
  proc = import_child_process.default.spawn(playerPath, args, {
    stdio: "ignore",
    // Важно для Linux, чтобы процесс не завершался при закрытии терминала
    detached: false
  });
  console.log("args: ", args);
  proc.on("close", (code) => {
    if (!proc) return;
    console.log("External player exited with code ", code);
    proc = null;
  });
  proc.on("error", (err) => {
    console.log("External player error", err);
    proc = null;
  });
}

// utils/clearFolder.js
var import_node_fs2 = __toESM(require("node:fs"), 1);
function clearFolder(folderName) {
  if (!folderName) return;
  try {
    import_node_fs2.default.rmSync(folderName, {
      recursive: true,
      force: true
    });
    import_node_fs2.default.mkdirSync(folderName, { recursive: true });
    console.log(`\u0421\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435 \u043F\u0430\u043F\u043A\u0438 ${folderName} \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0447\u0438\u0449\u0435\u043D\u043E.`);
  } catch (err) {
    console.error(`\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0447\u0438\u0441\u0442\u043A\u0435 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0433\u043E \u043F\u0430\u043F\u043A\u0438 ${folderName}:`, err);
  }
}

// controllers/video/torrentController.js
var import_parse_torrent = __toESM(require("parse-torrent"), 1);
var client = new import_webtorrent.default({
  maxConns: 100,
  utp: true,
  dht: true,
  utPex: true,
  webSeeds: false,
  tracker: {
    announce: [
      "http://bt2.t-ru.org/ann?magnet",
      "udp://opentor.net:6969",
      "retracker.local/announce",
      "udp://tracker.openbittorrent.com:80/announce",
      "udp://tracker.publicbt.com:80/announce",
      "udp://tracker.opentrackr.org:1337",
      "udp://tracker.coppersurfer.tk:6969"
    ]
  }
});
var streamServer = client.createServer({}, "node");
var STREAM_PORT = 8001;
streamServer.listen(STREAM_PORT, () => {
  const port = streamServer.address().port;
  console.log(`WebTorrent streaming server running on port ${port}`);
});
client.on("error", (err) => {
  console.error("event-log-error: \u041A\u043B\u0438\u0435\u043D\u0442: \u0444\u0430\u0442\u0430\u043B\u044C\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430", err);
});
client.on("add", (torrent) => {
  console.log(`event-log-add: \u0422\u043E\u0440\u0440\u0435\u043D\u0442 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D: ${torrent.magnetURI || torrent.infoHash}`);
});
client.on("torrent", (torrent) => {
  console.log(`event-log-torrent: \u0422\u043E\u0440\u0440\u0435\u043D\u0442 \u0433\u043E\u0442\u043E\u0432 \u043A \u0440\u0430\u0431\u043E\u0442\u0435: ${torrent.name} (${torrent.infoHash})`);
  console.log(`[Torrent] \u0418\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D. InfoHash: ${torrent.infoHash}`);
  torrent.on("ready", () => {
    console.log("[Torrent] \u0413\u043E\u0442\u043E\u0432 \u043A \u0440\u0430\u0431\u043E\u0442\u0435. \u041C\u0435\u0442\u0430\u0434\u0430\u043D\u043D\u044B\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u044B.");
  });
  torrent.on("download", (bytes) => {
  });
  torrent.on("wire", (wire, addr) => {
  });
  torrent.on("warning", (err) => {
    console.warn("[Torrent] \u041F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u0435 (\u043D\u0435 \u043A\u0440\u0438\u0442\u0438\u0447\u043D\u043E):", err.message);
  });
  torrent.on("error", (err) => {
    console.error("[Torrent] \u041A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430:", err.message);
  });
  torrent.on("close", () => {
    console.log("[Torrent] \u041F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u0437\u0430\u043A\u0440\u044B\u0442, \u0440\u0435\u0441\u0443\u0440\u0441\u044B \u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0435\u043D\u044B.");
  });
});
client.on("remove", (torrent) => {
  console.log(`event-log-remove: \u0422\u043E\u0440\u0440\u0435\u043D\u0442 \u0443\u0434\u0430\u043B\u0451\u043D: ${torrent.name || torrent.infoHash}`);
});
function waitForTorrentReady(torrent, timeoutMs = 1e5) {
  torrent.on("metadata", () => {
    console.log("[Torrent] \u041C\u0435\u0442\u0430\u0434\u0430\u043D\u043D\u044B\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u044B.");
  });
  return new Promise((resolve, reject) => {
    if (torrent.ready) return resolve();
    const cleanup = () => {
      torrent.removeListener("ready", onReady);
      torrent.removeListener("error", onError);
    };
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = (err) => {
      cleanup();
      reject(err);
    };
    torrent.on("ready", onReady);
    torrent.on("error", onError);
  });
}
var startTorrentDownload = async (magnetLink) => {
  const { infoHash } = await (0, import_parse_torrent.default)(magnetLink);
  let torrent = await client.get(infoHash);
  if (torrent) {
    await waitForTorrentReady(torrent);
    return torrent.infoHash;
  }
  torrent = client.add(magnetLink, { path: WEBTORRENT_DOWNLOAD_PATH });
  await waitForTorrentReady(torrent);
  return torrent.infoHash;
};
var startStreamTorrent = async (magnetLink) => {
  const { infoHash } = await (0, import_parse_torrent.default)(magnetLink);
  let torrent = await client.get(infoHash);
  if (!torrent) {
    torrent = client.add(magnetLink, { path: WEBTORRENT_DOWNLOAD_PATH });
  }
  await waitForTorrentReady(torrent);
  return {
    message: "Torrent is ready for streaming",
    filePath: torrent.path,
    infoHash: torrent.infoHash,
    files: torrent.files.map((f) => ({ name: f.name, length: f.length }))
  };
};
var streamStats = async (req, res2) => {
  const infoHash = req.params.infoHash;
  try {
    const torrent = await client.get(infoHash);
    if (!torrent) {
      return res2.status(404).json({ error: "Torrent not found or destroyed" });
    }
    res2.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Connection": "keep-alive",
      "Cache-Control": "no-cache"
    });
    const intervalId = setInterval(() => {
      if (!torrent.infoHash) {
        clearInterval(intervalId);
        res2.end();
        return;
      }
      try {
        const data = {
          speed: client?.downloadSpeed || torrent?.downloadSpeed || "",
          progress: client?.progress || torrent?.progress || "",
          ratio: client?.ratio || torrent?.ratio || "",
          torrentName: torrent?.name || "",
          torrentProgress: torrent?.progress || "",
          torrentDownLoadSpeed: torrent?.downloadSpeed || "",
          torrentRatio: torrent?.ratio || "",
          torrentUploadSpeed: torrent?.uploadSpeed || ""
        };
        res2.write(`data: ${JSON.stringify(data)}

`);
      } catch (err) {
        console.error("Error reading stats:", err);
        clearInterval(intervalId);
        res2.end();
      }
    }, 1e3);
    req.on("close", () => {
      clearInterval(intervalId);
    });
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0438 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438:", error);
    res2.status(500).json({ error: "Failed to provide stream stats." });
  }
};
var addMagnet = async (req, res2) => {
  const magnetLink = req.body.magnet;
  const parseTorrent2 = await (0, import_parse_torrent.default)(magnetLink);
  const { infoHash } = parseTorrent2;
  try {
    let torrent = await client.get(infoHash);
    if (!torrent) {
      torrent = client.add(magnetLink, {
        path: `${createDownlaodFolder()}/${infoHash}`
      });
    }
    await waitForTorrentReady(torrent);
    if (torrent.files && torrent.files.length > 0) {
      const files = torrent.files.map((data) => ({
        name: data.name,
        length: data.length
      }));
      res2.status(200).json({ files, infoHash });
    } else {
      res2.status(404).json({ error: "No files found in the torrent" });
    }
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0438:", error);
    res2.status(400).json({ error: `Error add magnet: ${error.message}` });
  }
};
var downloadTorrent = async (req, res2) => {
  try {
    const magnetLink = req.body.magnetLink;
    const torrentInfo = await startTorrentDownload(magnetLink);
    res2.status(200).json(torrentInfo);
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043D\u0430\u0447\u0430\u043B\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438:", error);
    res2.status(500).json({ error: "Failed to start torrent download." });
  }
};
var streamTorrent = async (req, res2) => {
  try {
    const id = req.params.id;
    const magnetLink = await readJsonId(id);
    const torrentInfo = await startStreamTorrent(magnetLink.url);
    res2.status(200).json(torrentInfo);
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043D\u0430\u0447\u0430\u043B\u0435 \u0441\u0442\u0440\u0438\u043C\u0438\u043D\u0433\u0430:", error);
    res2.status(500).json({ error: "Failed to start torrent streaming." });
  }
};
var streamVideo = async (req, res2, next) => {
  const {
    params: { name, infoHash },
    headers: { range }
  } = req;
  if (!range) {
    const err = new Error("Range is not defined, please make request from HTML5 Player");
    err.status = 416;
    return next(err);
  }
  const torrentFile = await client.get(infoHash);
  if (!torrentFile) {
    return res2.status(404).json({ error: "Torrent not found or destroyed" });
  }
  const file = torrentFile.files.find((f) => f.name === name);
  if (!file) {
    return res2.status(404).json({ error: "File not found in torrent" });
  }
  const fileSize = file.length;
  const [startParsed, endParsed] = range.replace(/bytes=/, "").split("-");
  const start = Number(startParsed);
  const end = endParsed ? Number(endParsed) : fileSize - 1;
  const chunkSize = end - start + 1;
  res2.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunkSize,
    "Content-Type": "video/mp4"
  });
  const stream = file.createReadStream({ start, end });
  stream.pipe(res2);
  req.on("close", () => {
    stream.destroy();
  });
  stream.on("error", (err) => {
    console.log("stream-error:", err);
    next(err);
  });
  stream.on("end", () => {
    console.log("stream-end");
    res2.end();
  });
};
var getStreamLink = async (link, name) => {
  try {
    const fileName = decodeURIComponent(name);
    let torrent = await client.get(link);
    if (!torrent) {
      console.log(`[Player] \u0422\u043E\u0440\u0440\u0435\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D. \u0414\u043E\u0431\u0430\u0432\u043B\u044F\u0435\u043C: ${link}`);
      torrent = client.add(link);
    }
    if (!torrent.ready) {
      console.log("[Player] \u041E\u0436\u0438\u0434\u0430\u0435\u043C \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u043C\u0435\u0442\u0430\u0434\u0430\u043D\u043D\u044B\u0445...");
      await new Promise((resolve) => {
        torrent.on("ready", resolve);
      });
    }
    const file = torrent.files.find((f) => f.name === fileName);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    file.select();
    let safePath = file.streamURL.replace(/\\/g, "/");
    safePath = safePath.split("/").map((segment) => encodeURIComponent(segment)).join("/");
    const absoluteStreamURL = `http://localhost:${STREAM_PORT}${safePath}`;
    return absoluteStreamURL;
  } catch (err) {
    console.error("[Player Error]:", err);
    return null;
  }
};
var startPlayer = async (req, res2) => {
  const { link, name } = req.params;
  const absoluteStreamURL = await getStreamLink(link, name);
  if (!absoluteStreamURL) {
    return res2.status(500).json({ error: "Failed to get stream link" });
  }
  spawn(absoluteStreamURL);
  return res2.status(200).json({ success: true, url: absoluteStreamURL });
};
var getLinkForPlayer = async (req, res2) => {
  const { link, name } = req.params;
  const absoluteStreamURL = await getStreamLink(link, name);
  if (!absoluteStreamURL) {
    return res2.status(500).json({ error: "Failed to get stream link" });
  }
  return res2.status(200).json({ success: true, url: absoluteStreamURL });
};
var stopStream = async (req, res2, next) => {
  const infoHash = req.params.infoHash;
  const torrent = await client.get(infoHash);
  if (torrent) {
    torrent.destroy({ destroyStore: true }, (err) => {
      if (err) {
        console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0435:", err.message);
        next(err);
      } else {
        console.log("\u0422\u043E\u0440\u0440\u0435\u043D\u0442 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D \u0438 \u0444\u0430\u0439\u043B\u044B \u0443\u0434\u0430\u043B\u0435\u043D\u044B");
        res2.status(200).end();
      }
    });
  } else {
    res2.status(404).json({ error: "Torrent not found" });
  }
};
var destroyTorrentClient = () => {
  if (client) {
    client.destroy((err) => {
      if (err) console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 client destroy:", err.message);
      else console.log("\u041A\u043B\u0438\u0435\u043D\u0442 WebTorrent \u0443\u043D\u0438\u0447\u0442\u043E\u0436\u0435\u043D");
    });
  }
};

// routes/video.js
var router2 = (0, import_express2.Router)();
router2.post("/download", downloadTorrent);
router2.get("/torrent/:id", streamTorrent);
router2.get("/stream/stats/:infoHash", streamStats);
router2.post("/stream/add", addMagnet);
router2.get("/stream/stop/:infoHash", stopStream);
router2.get("/stream/:infoHash/:name", streamVideo);
router2.get("/stream/start/:link/:name", startPlayer);
router2.get("/stream/link/:link/:name", getLinkForPlayer);
var video_default = router2;

// routes/search.js
var import_express3 = require("express");

// controllers/search/searchController.js
var import_torrent_search_api = __toESM(require("torrent-search-api"), 1);
var import_parse_torrent2 = __toESM(require("parse-torrent"), 1);
var cheerio = __toESM(require("cheerio"), 1);

// utils/getBaseUrl.js
var import_node_path2 = __toESM(require("node:path"), 1);
var import_node_fs3 = __toESM(require("node:fs"), 1);
var import_node_net = __toESM(require("node:net"), 1);
var import_node_tls = __toESM(require("node:tls"), 1);
var urlsFilePath = () => import_node_path2.default.join(CONTENT_URLS_PATH, "urls.json");
var baseUrlFilePath = () => import_node_path2.default.join(CONTENT_URLS_PATH, "baseUrl.json");
var checkAttemptsCount = 0;
var MAX_CHECK_ATTEMPTS = 2;
function readUrlsFile() {
  try {
    const content = import_node_fs3.default.readFileSync(urlsFilePath(), "utf8").trim();
    return content ? JSON.parse(content) : [];
  } catch {
    return [];
  }
}
function readBaseUrlFile() {
  try {
    const content = import_node_fs3.default.readFileSync(baseUrlFilePath(), "utf8").trim();
    return content ? JSON.parse(content) : { url: "" };
  } catch {
    return { url: "" };
  }
}
var PROXY_PORTS = [16756, 2334, 12334, 2080, 10808, 1080];
function requestViaSocks5(targetUrl, proxyPort) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(targetUrl);
    const socket = new import_node_net.default.Socket();
    socket.setTimeout(2500);
    socket.connect(proxyPort, "127.0.0.1", () => {
      socket.write(Buffer.from([5, 1, 0]));
    });
    socket.on("data", (data) => {
      if (data[0] === 5 && data[1] === 0) {
        const hostBuffer = Buffer.from(parsedUrl.hostname);
        const portBuffer = Buffer.alloc(2);
        portBuffer.writeUInt16BE(parsedUrl.port ? parseInt(parsedUrl.port) : 443, 0);
        const request = Buffer.concat([
          Buffer.from([5, 1, 0, 3, hostBuffer.length]),
          hostBuffer,
          portBuffer
        ]);
        socket.write(request);
        return;
      }
      if (data[0] === 5 && data[1] === 0 && data[2] === 0) {
        socket.removeAllListeners("data");
        socket.removeAllListeners("error");
        socket.removeAllListeners("timeout");
        const tlsSocket = import_node_tls.default.connect({
          socket,
          servername: parsedUrl.hostname,
          rejectUnauthorized: false
        }, () => {
          const httpRequest = `GET ${parsedUrl.pathname}${parsedUrl.search} HTTP/1.1\r
Host: ${parsedUrl.hostname}\r
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36\r
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8\r
Connection: close\r
\r
`;
          tlsSocket.write(httpRequest);
        });
        tlsSocket.on("data", (httpData) => {
          const responseStr = httpData.toString("utf8");
          const firstLine = responseStr.split("\r\n")[0];
          const statusCode = parseInt(firstLine.split(" ")[1], 10);
          const locationMatch = responseStr.match(/location:\s*([^\r\n]+)/i);
          const location = locationMatch ? locationMatch[1].trim() : null;
          tlsSocket.destroy();
          resolve({ status: statusCode, location });
        });
        tlsSocket.on("error", () => resolve({ status: 0, location: null }));
      } else {
        socket.destroy();
        resolve({ status: 0, location: null });
      }
    });
    socket.on("error", () => {
      socket.destroy();
      resolve({ status: 0, location: null });
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ status: 0, location: null });
    });
  });
}
async function checkUrl(url) {
  const list = readUrlsFile();
  if (url.includes("rtsp:") || url.includes("mmsh:") || url.includes("uhttp:")) {
    return { status: false, url: "" };
  }
  for (const port of PROXY_PORTS) {
    try {
      const result = await requestViaSocks5(url, port);
      if (result.status === 200) {
        console.log(`[Native Socket] \u0420\u0430\u0431\u043E\u0447\u0438\u0439 \u0430\u0434\u0440\u0435\u0441 (200) \u0447\u0435\u0440\u0435\u0437 \u043F\u043E\u0440\u0442 ${port}: ${url}`);
        return { status: true, url };
      }
      if (result.status >= 300 && result.status < 400 && result.location) {
        let cleanLocation = result.location;
        if (!cleanLocation.startsWith("http")) {
          const parsed = new URL(url);
          cleanLocation = parsed.origin + cleanLocation;
        }
        const cleanFinalUrl = new URL(cleanLocation).origin;
        if (!list.find((item) => item.url === cleanFinalUrl)) {
          list.push({ url: cleanFinalUrl });
          import_node_fs3.default.writeFileSync(urlsFilePath(), JSON.stringify(list, null, 2));
        }
        console.log(`[Native Socket] \u0420\u0435\u0434\u0438\u0440\u0435\u043A\u0442 \u043D\u0430: ${cleanFinalUrl}`);
        return await checkUrl(cleanFinalUrl);
      }
    } catch {
      continue;
    }
  }
  console.warn(`[Native Socket] \u0410\u0434\u0440\u0435\u0441 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D, \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u0438\u043B\u0438 \u043F\u0440\u043E\u043A\u0441\u0438 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D: ${url}`);
  return { status: false, url: "" };
}
async function updateBaseUrls() {
  const list = readUrlsFile();
  const filteredResults = [];
  for (const { url } of list) {
    const result = await checkUrl(url);
    filteredResults.push(result);
  }
  const workedUrl = filteredResults.find(({ status }) => status);
  if (workedUrl?.url) {
    import_node_fs3.default.writeFileSync(baseUrlFilePath(), JSON.stringify({ url: workedUrl.url }, null, 2));
    return workedUrl.url;
  }
  return null;
}
async function getBaseUrl() {
  const { url } = readBaseUrlFile();
  if (url !== "") {
    const result = await checkUrl(url);
    if (result.status) {
      checkAttemptsCount = 0;
      return url;
    }
  }
  if (checkAttemptsCount >= MAX_CHECK_ATTEMPTS) {
    console.warn(`[Server Core] \u0421\u0435\u0440\u0432\u0438\u0441 \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D. \u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D\u043E \u0447\u0438\u0441\u043B\u043E \u043F\u043E\u043F\u044B\u0442\u043E\u043A \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u0430\u0434\u0440\u0435\u0441\u043E\u0432 (${MAX_CHECK_ATTEMPTS} \u043A\u0440\u0443\u0433\u0430). \u041F\u043E\u0438\u0441\u043A \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D.`);
    checkAttemptsCount = 0;
    return "";
  }
  checkAttemptsCount++;
  console.log(`[Server Core] \u0417\u0430\u043F\u0443\u0441\u043A \u043A\u0440\u0443\u0433\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u0430\u0434\u0440\u0435\u0441\u043E\u0432 \u2116${checkAttemptsCount}`);
  await clearBaseUrl();
  const newWorkedUrl = await updateBaseUrls();
  if (newWorkedUrl) {
    checkAttemptsCount = 0;
    return newWorkedUrl;
  }
  return await getBaseUrl();
}
async function clearBaseUrl() {
  import_node_fs3.default.writeFileSync(baseUrlFilePath(), JSON.stringify({ url: "" }, null, 2));
}

// controllers/search/searchController.js
var getSearchMovie = async (req, res2) => {
  const movie = req.params.movie;
  try {
    await import_torrent_search_api.default.enablePublicProviders();
    const torrents = await import_torrent_search_api.default.search(movie);
    return res2.status(200).send(torrents);
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u043F\u0440\u043E\u0441\u0435 \u0434\u0430\u043D\u043D\u044B\u0445:", error);
    return res2.status(400).send("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u043F\u0440\u043E\u0441\u0430");
  }
};
var postSearchMagnet = async (req, res2) => {
  const movie = req.body;
  try {
    const torrent = await import_torrent_search_api.default.getMagnet(movie);
    const magnet = (0, import_parse_torrent2.default)(torrent.magnet);
    return res2.status(200).json(magnet.infoHash);
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u043F\u0440\u043E\u0441\u0435 \u0434\u0430\u043D\u043D\u044B\u0445:", error);
    return res2.status(400).send("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u043F\u0440\u043E\u0441\u0430");
  }
};
var movieSearch = async (req, res2) => {
  const { movie, filter } = req.params;
  const BASE_URL = await getBaseUrl();
  if (!BASE_URL || BASE_URL === "") {
    console.error("[Search Error] \u041F\u043E\u0438\u0441\u043A \u043D\u0435\u0432\u043E\u0437\u043C\u043E\u0436\u0435\u043D: \u043D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0445 \u0440\u0430\u0431\u043E\u0447\u0438\u0445 \u0437\u0435\u0440\u043A\u0430\u043B.");
    return res2.status(503).json({
      error: "\u0421\u0435\u0440\u0432\u0438\u0441 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u043A \u043F\u0440\u043E\u043A\u0441\u0438/VPN."
    });
  }
  try {
    const filterId = FILTER_ARRAY.includes(+filter) ? filter : 1;
    const targetUrl = `${BASE_URL}/search/0/${filterId}/000/0/${movie}`;
    const response = await fetch(targetUrl);
    const htmlData = await response.text();
    const $ = cheerio.load(htmlData);
    const data = $("#index tr").toArray();
    const torrents = data.map((item) => {
      const [date, links, , gb, seeds] = $(item).find("td").toArray();
      const [, title] = $(links).find("a").toArray();
      const trackerLink = $(title).attr("href");
      const name = $(title).text();
      const dateText = $(date).text();
      const gbText = $(gb).text();
      const [green, red] = $(seeds).find("span").toArray();
      const ratio = {
        seed: $(green).text(),
        leech: $(red).text()
      };
      return {
        urlTorrent: trackerLink,
        nameTorrent: name,
        dateTorrent: dateText,
        gbTorrent: gbText,
        ratio,
        seeds: `${ratio.seed}/${ratio.leech}`
      };
    }).filter(
      (item) => item.urlTorrent && (item.ratio.seed > 0 || item.ratio.leech > 0)
    );
    return res2.status(200).send(torrents);
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u043F\u0440\u043E\u0441\u0435 \u0434\u0430\u043D\u043D\u044B\u0445:", error);
    return res2.status(400).send("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u043F\u0440\u043E\u0441\u0430");
  }
};
var magnetSearch = async (req, res2) => {
  const data = req.body;
  const BASE_URL = await getBaseUrl();
  try {
    const response = await fetch(`${BASE_URL}${data.data}`);
    const htmlData = await response.text();
    const $ = cheerio.load(htmlData);
    const downloadLink = $("#download a").toArray();
    const magnetLink = $(downloadLink[0]).attr("href");
    const magnet = (0, import_parse_torrent2.default)(magnetLink);
    return res2.status(200).json({ link: magnetLink, hash: magnet.infoHash });
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u043F\u0440\u043E\u0441\u0435 \u0434\u0430\u043D\u043D\u044B\u0445:", error);
    return res2.status(400).send("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u043F\u0440\u043E\u0441\u0430");
  }
};

// routes/search.js
var router3 = (0, import_express3.Router)();
router3.get("/en/:movie", getSearchMovie);
router3.post("/en/magnet", postSearchMagnet);
router3.get("/ru/:filter/:movie", movieSearch);
router3.post("/ru/magnet", magnetSearch);
var search_default = router3;

// app.js
var app = (0, import_express4.default)();
app.use((0, import_cors.default)());
app.use(import_express4.default.json());
app.use("/api/tv", tv_default);
app.use("/api/video", video_default);
app.use("/api/search", search_default);
var app_default = app;

// index.js
var WEBTORRENT_DOWNLOAD_PATH = createDownlaodFolder();
var CONTENT_TV_PATH = createContentTvFolder();
var CONTENT_URLS_PATH = createContentUrlsFolder();
var server = app_default.listen(PORT, () => {
  clearFolder(WEBTORRENT_DOWNLOAD_PATH);
  console.log(`Server is running on port ${PORT}`);
});
async function gracefulShutdown(reason) {
  console.log(`
[Shutdown] \u041F\u043E\u043B\u0443\u0447\u0435\u043D \u0441\u0438\u0433\u043D\u0430\u043B: ${reason}. \u041E\u0447\u0438\u0441\u0442\u043A\u0430 \u0440\u0435\u0441\u0443\u0440\u0441\u043E\u0432...`);
  try {
    destroyTorrentClient();
    console.log("[Shutdown] \u0422\u043E\u0440\u0440\u0435\u043D\u0442-\u043A\u043B\u0438\u0435\u043D\u0442 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D.");
  } catch (err) {
    console.error("[Shutdown] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0447\u0438\u0441\u0442\u043A\u0435 \u0442\u043E\u0440\u0440\u0435\u043D\u0442\u043E\u0432:", err);
  }
  server.close(() => {
    console.log("[Shutdown] HTTP \u0441\u0435\u0440\u0432\u0435\u0440 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D. \u0412\u044B\u0445\u043E\u0434.");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("[Shutdown] \u041F\u0440\u0438\u043D\u0443\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0432\u044B\u0445\u043E\u0434 \u043F\u043E \u0442\u0430\u0439\u043C\u0430\u0443\u0442\u0443.");
    process.exit(1);
  }, 3e3);
}
process.on("message", async (msg) => {
  if (msg && msg.action === "SHUTDOWN") {
    await gracefulShutdown("SHUTDOWN (Electron)");
  }
});
process.on("SIGINT", () => gracefulShutdown("SIGINT (Ctrl+C)"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CONTENT_TV_PATH,
  CONTENT_URLS_PATH,
  WEBTORRENT_DOWNLOAD_PATH
});
