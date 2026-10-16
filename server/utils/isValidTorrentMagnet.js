import parseTorrent from "parse-torrent";

export async function isValidTorrentIdentifier(input) {
  try {
    const result = await parseTorrent(input);
    return result.infoHash;
  } catch (error) {
    return false;
  }
}
