// utils.ts
import { resolve } from "@std/path";
import { copy, ensureDir, exists } from "@std/fs";

export async function getWorldName(configPath: string): Promise<string | null> {
  try {
    const serverPropertiesPath = resolve(configPath, "server.properties");
    const content = await Deno.readTextFile(serverPropertiesPath);
    const lines = content.split("\n");
    for (const line of lines) {
      if (line.startsWith("level-name=")) {
        return line.split("=")[1].trim();
      }
    }
  } catch (err) {
    console.error("Error reading server.properties:", err);
  }
  return null;
}

export async function listBackups(
  backupPath: string,
  worldName: string,
): Promise<string[]> {
  try {
    const worldBackupPath = resolve(backupPath, worldName);
    if (await exists(worldBackupPath)) {
      const entries = Array.from(Deno.readDirSync(worldBackupPath));
      return entries
        .filter((entry) => entry.isDirectory)
        .map((entry) => entry.name);
    }
  } catch (err) {
    console.error("Error listing backups:", err);
  }
  return [];
}

export async function restoreBackup(
  backupPath: string,
  worldName: string,
  backupName: string,
  configPath: string,
): Promise<void> {
  try {
    const backupWorldPath = resolve(backupPath, worldName, backupName);
    const worldPath = resolve(configPath, "worlds", worldName);

    await ensureDir(worldPath); // Ensure the world directory exists
    await copy(backupWorldPath, worldPath, { overwrite: true });
    console.log(`Backup "${backupName}" restored to "${worldPath}"`);
  } catch (err) {
    console.error("Error restoring backup:", err);
  }
}

export async function saveBackup(
  backupPath: string,
  configPath: string,
): Promise<void> {
  const worldName = await getWorldName(configPath);
  if (!worldName) {
    console.error("Could not determine world name from server.properties.");
    return;
  }

  try {
    // Ensure the backup directory exists
    await ensureDir(backupPath);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupWorldPath = resolve(backupPath, `${worldName}/${timestamp}`);

    // Copy the world folder
    await copy(
      resolve(configPath, "worlds", worldName),
      backupWorldPath,
      { overwrite: true },
    );
    console.log(`World backup saved to ${backupWorldPath}`);
  } catch (err) {
    console.error("Error saving backup:", err);
  }
}
