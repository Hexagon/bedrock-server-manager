// config.ts
// Downloader
export const downloadPageUrl =
  "https://www.minecraft.net/en-us/download/server/bedrock";
export const downloadPageUrlRegex =
  /https:\/\/[^\s"]+\/bin-linux\/bedrock-server-([\d\.]+)\.zip/;
// File structure
export const serverFolder = "./server";
export const configFolder = "./config";
export const backupFolder = "./backups";
export const workingDirFolder = "./";
