import cp from "child_process";
import vlcCommand from "vlc-command";

let proc = null;

export function spawn(url, title = "") {
  vlcCommand((err, vlcPath) => {
    if (err) {
      console.error("Error getting VLC path:", err);
      // Fallback для Linux
      if (process.platform === "linux") {
        spawnExternal("/usr/bin/vlc", prepareArgs(url));
      }
      return;
    }
    spawnExternal(vlcPath, prepareArgs(url));
  });
}

function prepareArgs(url) {
  const args = ["--play-and-exit", "--quiet", url];

  // Добавляем интерфейс для Linux если нужно
  if (process.platform === "linux") {
    // Можно определить, есть ли графическая среда
    if (process.env.DISPLAY || process.env.WAYLAND_DISPLAY) {
      args.unshift("--intf", "qt");
    }
  }

  return args;
}

export function kill() {
  if (!proc) return;
  console.log(`Killing external player, pid ${proc.pid}`);

  if (process.platform === "linux") {
    // Более мягкое завершение для Linux
    proc.kill("SIGTERM");
    // Принудительное завершение через некоторое время если не закрылся
    setTimeout(() => {
      if (proc) {
        proc.kill("SIGKILL");
        proc = null;
      }
    }, 2000);
  } else {
    proc.kill("SIGKILL");
    proc = null;
  }
}

export function spawnExternal(playerPath, args) {
  proc = cp.spawn(playerPath, args, {
    stdio: "ignore",
    // Важно для Linux, чтобы процесс не завершался при закрытии терминала
    detached: false,
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