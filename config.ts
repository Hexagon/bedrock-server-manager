// config.ts
// Downloader
export const downloadPageUrl =
  "https://www.minecraft.net/en-us/download/server/bedrock";
export const downloadPageWindowsUrlRegex =
  /https:\/\/[^\s"]+\/bin-win\/bedrock-server-([\d\.]+)\.zip/;
export const downloadPageLinuxUrlRegex =
  /https:\/\/[^\s"]+\/bin-linux\/bedrock-server-([\d\.]+)\.zip/;
// File structure
export const serverFolder = "./server";
export const configFolder = "./config";
export const backupFolder = "./backups";
export const workingDirFolder = "./";
// Other settings
export const shutdownGraceSeconds = 10; // Delay after stop to actual stop
// Configuration
export const baseServiceName = "bsm-service";
export const defaultBackupPattern = "0 0 3 * * *"; // 3 am every day
