import { resolve } from "jsr:@std/path@^1.0.6/resolve";

export async function createStartScript(serverFolder: string, configFolder: string) {
    console.log("Creating or updating start script...");
    const startScript = `#!/bin/bash
    cd "${resolve(configFolder)}"
    LD_LIBRARY_PATH="${resolve(serverFolder)}" "${resolve(serverFolder)}/bedrock_server"
    `;
    await Deno.writeTextFile("./start.sh", startScript);
    await Deno.chmod("./start.sh", 0o755);
  }