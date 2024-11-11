import { ensureDir, exists, emptyDir } from "jsr:@std/fs";

export async function downloadAndUnpackServer(downloadUrl: string, version: string, serverFolder: string, configFolder: string ) {

  // Download the server zip file
  console.log(`Downloading Minecraft server version ${version}...`);
  const zipResponse = await fetch(downloadUrl);
  const zipFile = await Deno.makeTempFile({ suffix: ".zip" });
  await Deno.writeFile(zipFile, new Uint8Array(await zipResponse.arrayBuffer()));

  // Check if the server folder already exists
  if (await exists(serverFolder)) {
    console.warn(`WARNING: Server folder "${serverFolder}" already exists. It will be deleted!`);
    emptyDir(serverFolder);
  }

  // Unpack the zip file
  console.log("Unpacking server files...");
  await ensureDir(serverFolder);
  const unzipProcess = new Deno.Command("unzip", { args: [
    "-o", 
    zipFile, 
    "-d", 
    serverFolder
  ]});
  await unzipProcess.output();
  await Deno.remove(zipFile);

  // Update the start script
  console.log("Updating start script...");
  const startScript = `#!/bin/bash

  LD_LIBRARY_PATH="${serverFolder}" ${serverFolder}/bedrock_server --port 19132 --config-dir "${configFolder}"
  `;
  await Deno.writeTextFile("./start.sh", startScript);
  await Deno.chmod("./start.sh", 0o755);

  console.log("Server updated successfully!");
}