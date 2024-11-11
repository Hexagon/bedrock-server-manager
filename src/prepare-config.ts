import { ensureDir, existsSync, copy } from "jsr:@std/fs";

export async function prepareConfig(serverFolder: string, configFolder: string) {
  // Check if the config folder exists
  if (!existsSync(configFolder)) {
    console.log(`Creating config folder at ${configFolder}...`);
    await ensureDir(configFolder);

    // Copy the default server.properties file
    const serverPropertiesSource = `${serverFolder}/server.properties`;
    const serverPropertiesDest = `${configFolder}/server.properties`;
    await copy(serverPropertiesSource, serverPropertiesDest);

    console.log(`\nIMPORTANT: Please review and adjust the server settings in ${serverPropertiesDest} before starting the server.\n`);
  }
}