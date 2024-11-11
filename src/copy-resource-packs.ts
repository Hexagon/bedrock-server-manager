import { copy, ensureDir, existsSync, walk } from "@std/fs";
import { resolve } from "@std/path";

export async function copyResourcePacks(
  serverFolder: string,
  configFolder: string,
) {
  const resourcePackFolders = [
    "behavior_packs",
    "resource_packs",
    "definitions",
  ];

  for (const folderName of resourcePackFolders) {
    const sourceFolder = `${serverFolder}/${folderName}`;
    const destFolder = `${configFolder}/${folderName}`;

    // Ensure the destination folder exists
    await ensureDir(destFolder);

    // Copy the contents of the source folder to the destination folder
    if (existsSync(sourceFolder)) {
      if (existsSync(sourceFolder)) {
        for await (
          const entry of walk(sourceFolder, {
            maxDepth: 1,
            includeDirs: true,
            includeFiles: false,
          })
        ) {
          if (entry.isDirectory) {
            const sourcePath = resolve(entry.path); // Resolve to absolute path
            const destPath = resolve(destFolder, entry.name); // Construct absolute path

            // Remove the existing pack folder in the destination
            if (existsSync(destPath)) {
              console.log(
                `Removing existing ${entry.name} ${folderName} in ${destFolder}...`,
              );
              await Deno.remove(destPath, { recursive: true });
            }

            // Copy the pack folder from the source
            await copy(sourcePath, destPath);
            console.log(`Copied ${entry.name} ${folderName} to ${destFolder}`);
          }
        }
      }
    }
  }
}
