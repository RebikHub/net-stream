import cp from "child_process";
import vlcCommand from "vlc-command";

let proc = null;

export function spawn(url, title = "") {
  vlcCommand((err, vlcPath) => {
    if (err) {
      console.error("Error getting VLC path:", err);
      return;
    }

    const args = ["--play-and-exit", "--quiet", url];

    spawnExternal(vlcPath, args);
  });
}

export function kill() {
  if (!proc) return;
  console.log(`Killing external player, pid ${proc.pid}`);
  proc.kill("SIGKILL"); // kill -9
  proc = null;
}

export function spawnExternal(playerPath, args) {
  proc = cp.spawn(playerPath, args, { stdio: "ignore" });

  console.log("args: ", args);

  proc.on("close", (code) => {
    if (!proc) return; // Killed
    console.log("External player exited with code ", code);
    proc = null;
  });

  proc.on("error", (err) => {
    console.log("External player error", err);
  });
}
