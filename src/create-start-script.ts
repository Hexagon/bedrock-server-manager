import { resolve } from "@std/path";

export async function createStartScript(
  serverFolder: string,
  configFolder: string,
) {
  console.log("Creating or updating start script...");
  const startScript = `#!/bin/bash
    cd "${resolve(configFolder)}"
    LD_LIBRARY_PATH="${resolve(serverFolder)}" "${
    resolve(serverFolder)
  }/bedrock_server"
    `;
  await Deno.writeTextFile("./start.sh", startScript);
  await Deno.chmod("./start.sh", 0o755);
}
