import { copy, ensureDir, existsSync } from "@std/fs";

export async function prepareConfig(
  serverFolder: string,
  configFolder: string,
) {
  // List of files to copy if they exist
  const filesToCopy = [
    "server.properties",
    "allowlist.json",
    "permissions.json",
    "config",
  ];

  // Check if the config folder exists
  if (!existsSync(configFolder)) {
    console.log(`Creating config folder at ${configFolder}...`);
    await ensureDir(configFolder);

    // Copy the files
    for (const file of filesToCopy) {
      const sourcePath = `${serverFolder}/${file}`;
      const destPath = `${configFolder}/${file}`;

      if (existsSync(sourcePath)) {
        await copy(sourcePath, destPath);
        console.log(`Copied ${file} to ${configFolder}`);
      }
    }

    console.log(
      `\nIMPORTANT: Please review and adjust the server settings in ${configFolder}/server.properties before starting the server.\n`,
    );
  }
}
