// utils.ts
import { resolve } from "@std/path";
import { copy, emptyDir, ensureDir, exists } from "@std/fs";

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
        .sort((a, b) => {
          let diff = 0;
          try {
            diff = Date.parse(a.name) - Date.parse(b.name);
          } catch (_e) { /* Ignore */ }
          return diff;
        })
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
    await emptyDir(worldPath); // Ensure the world directory exists and is empty
    await copy(backupWorldPath, worldPath, { overwrite: true });
    console.log(`Backup "${backupName}" restored to "${worldPath}"`);
  } catch (err) {
    console.error("Error restoring backup:", err);
  }
}

export async function saveBackup(
  backupPath: string,
  configPath: string,
): Promise<boolean> {
  const worldName = await getWorldName(configPath);
  if (!worldName) {
    console.error("Could not determine world name from server.properties.");
    return false;
  }
  const resolvedWorldPath = resolve(configPath, "worlds", worldName);
  if (!await exists(resolvedWorldPath)) {
    console.error("Could not find world folder, nothing to do yet.");
    return false;
  }
  try {
    // Ensure the backup directory exists
    await ensureDir(backupPath);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupWorldPath = resolve(backupPath, `${worldName}/${timestamp}`);

    // Copy the world folder
    await copy(
      resolvedWorldPath,
      backupWorldPath,
      { overwrite: true },
    );
    console.log(`World backup saved to ${backupWorldPath}`);
    return true;
  } catch (err) {
    console.error("Error saving backup:", err);
    return false;
  }
}
