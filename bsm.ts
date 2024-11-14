// mc-server-update.ts
import {
  backupFolder,
  configFolder,
  serverFolder,
  workingDirFolder,
} from "./config.ts";
import { copyResourcePacks } from "./src/copy-resource-packs.ts";
import { downloadAndUnpackServer } from "./src/download-server.ts";
import { prepareConfig } from "./src/prepare-config.ts";
import {
  getAllKnownVersions,
  getLatestKnownVersion,
  getLatestVersion,
  getSpecificKnownVersion,
  type VersionEntry,
} from "./src/version-finder.ts";
import { installService, uninstallService } from "@cross/service";
import { getEnv } from "@cross/env";
import { BedrockServer } from "./src/managed-process.ts";
import { getWorldName, listBackups, restoreBackup } from "./src/backup.ts";
import { Cron } from "@hexagon/croner";
import { resolve } from "@std/path";
import { readOrCreateBSMJson } from "./src/user-config.ts";
const version = Deno.args[0] || "latest"; // Get version from command line argument or default to "latest"

async function main() {
  if (Deno.args.includes("help")) {
    console.log(`
  Usage: bsm [command] [version]

  Commands:
    latest                     Downloads and installs the latest Bedrock Server.
    <version>                  Downloads and installs a specific version.
    list                       Lists all known versions.
    start                      Starts the Minecraft Bedrock Dedicated Server.
    enable-service             Installs a service to start the server at boot.
    disable-service            Removes the service that starts the server at boot.
    list-backups               Lists available backups.
    restore-backup <timestamp> Restores a backup from a given timestamp.
    help                       Displays this help message.
    `);
    Deno.exit(0);
  }

  if (Deno.args.includes("list")) {
    // Get dynamic latest
    try {
      const latest = await getLatestVersion();
      console.log("\nLatest (dynamic):");
      console.log(`\t${latest.version}\t${latest.url}`);
    } catch (_error) {
      console.log("Failed to fetch dynamic latest version.");
    }

    // Get all known
    const allKnownVersions = await getAllKnownVersions("./known-versions.json");
    console.log("\nKnown Versions:");
    if (allKnownVersions) {
      allKnownVersions.forEach((v) => {
        console.log(`\t${v.version}\t${v.url}`);
      });
    } else {
      console.log("    Failed to fetch known versions.");
    }
    console.log("");
    return;
  }

  if (Deno.args.includes("enable-service")) {
    const config = await readOrCreateBSMJson(workingDirFolder);

    const startScript = "bsm start";
    try {
      await installService({
        system: false,
        name: config.serviceName,
        cmd: startScript,
        cwd: resolve("./"),
        user: getEnv("USER"),
      }, false);
      console.log(
        `Minecraft Bedrock Server service '${config.serviceName}' enabled successfully!`,
      );
    } catch (error) {
      console.error("Failed to enable the service:", error);
    }
    console.log("");
    Deno.exit(0);
  }

  if (Deno.args.includes("disable-service")) {
    const config = await readOrCreateBSMJson(workingDirFolder);

    try {
      await uninstallService({
        system: false,
        name: config.serviceName,
      });
      console.log(
        `Minecraft Bedrock Server service '${config.serviceName}' disabled successfully!`,
      );
    } catch (error) {
      console.error("Failed to disable the service:", error);
    }
    console.log(""); // Add an extra newline for better readability
    Deno.exit(0);
  }

  if (Deno.args.includes("list-backups")) {
    const worldName = await getWorldName(configFolder);
    if (worldName) {
      const backups = await listBackups("./backups", worldName);
      console.log(`Available backups for ${worldName}:`);
      for (const backupName of backups) {
        console.log(backupName);
      }
      console.log("Use `bsm restore-backup <timestamp>` to restore");
    } else {
      console.error("Could not determine world name.");
    }
    Deno.exit(0);
  }

  if (Deno.args.includes("restore-backup")) {
    const worldName = await getWorldName(configFolder);
    if (worldName) {
      const backupTimestamp = Deno.args[1]; // Get timestamp from command line argument
      if (!backupTimestamp) {
        console.error("Please provide a backup timestamp.");
        return;
      }
      await restoreBackup(
        "./backups",
        worldName,
        backupTimestamp,
        configFolder,
      );
    } else {
      console.error("Could not determine world name.");
    }
    Deno.exit(0);
  }

  if (Deno.args.includes("start")) {
    const config = await readOrCreateBSMJson(workingDirFolder);

    const server = new BedrockServer(serverFolder, configFolder);

    // Back up before start
    server.backup(backupFolder);

    // Do start
    server.start();

    // Start the cron job for daily backups
    new Cron(config.backupCron, () => {
      console.log("Running scheduled backup...");
      server.backup(backupFolder);
    });
  } else {
    let selectedVersion: VersionEntry | null = null;

    if (version === "latest") {
      selectedVersion = await getLatestVersion();
      if (selectedVersion === null) {
        selectedVersion = await getLatestKnownVersion("./known-versions.json");
      }
    } else {
      selectedVersion = await getSpecificKnownVersion(
        "./known-versions.json",
        version,
      );
      if (selectedVersion === null) {
        console.error(`Version ${version} not found in known-versions.json`);
        Deno.exit(1);
      }
    }

    if (selectedVersion) {
      console.log(
        `Using version: ${selectedVersion.version}, URL: ${selectedVersion.url}`,
      );
      await downloadAndUnpackServer(
        selectedVersion.url,
        selectedVersion.version,
        serverFolder,
      );
      await prepareConfig(serverFolder, configFolder);
      await copyResourcePacks(serverFolder, configFolder);
    } else {
      console.error("Not sure wat to do, check arguments.");
      Deno.exit(1);
    }
  }
}

main();
