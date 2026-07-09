import fs from "fs";
import { spawn, execSync } from "child_process";

const MAX_RETRY = {
  default: 1,
  site5: 3
};

function runScript(file, retry = 0) {
  return new Promise((resolve) => {
    const child = spawn("node", [file], { stdio: "inherit" });

    child.on("exit", (code) => {
      if (code === 0) {
        return resolve(true);
      }

      const base = file.replace("scripts/", "").replace(".js", "");
      const limit = MAX_RETRY[base] ?? MAX_RETRY.default;

      if (retry < limit) {
        console.log(`${file} を再試行します…`);
        return resolve(runScript(file, retry + 1));
      }

      return resolve(false);
    });
  });
}

async function main() {
  const files = fs.readdirSync("scripts").filter(f => f.endsWith(".js"));

  for (const file of files) {
    const ok = await runScript(`scripts/${file}`);
    if (!ok) {
      console.error(`${file} が最終的に失敗しました`);
      process.exit(1);
    }
  }

  try {
    execSync("pkill chrome || true");
  } catch {}
}

main();
