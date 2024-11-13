// mc-server-update.ts
import {
  backupCronPattern,
  backupFolder,
  configFolder,
  serverFolder,
} from "./config.ts";
import { copyResourcePacks } from "./src/copy-resource-packs.ts";
import { createStartScript } from "./src/create-start-script.ts";
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
import { resolve } from "@std/path";
import { getEnv } from "@cross/env";
import { BedrockServer } from "./src/managed-process.ts";
import { getWorldName, listBackups, restoreBackup } from "./src/backup.ts";
import { Cron } from "@hexagon/croner";
const version = Deno.args[0] || "latest"; // Get version from command line argument or default to "latest"

async function main() {
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
    console.log(""); // Add an extra newline for better readability
    return;
  }

  if (Deno.args.includes("enable-service")) {
    const startScriptPath = resolve(`./start.sh`); // Assuming the start script is named "start.sh"
    try {
      await installService({
        system: false,
        name: "bsm",
        cmd: startScriptPath,
        user: getEnv("USER"),
      }, false);
      console.log("Minecraft Bedrock Server service enabled successfully!");
    } catch (error) {
      console.error("Failed to enable the service:", error);
    }
    console.log(""); // Add an extra newline for better readability
    Deno.exit(0);
  }

  if (Deno.args.includes("disable-service")) {
    try {
      await uninstallService({
        system: false,
        name: "bsm",
      });
      console.log("Minecraft Bedrock Server service disabled successfully!");
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
    const server = new BedrockServer(serverFolder, configFolder);
    server.start();
    // Start the cron job for backups
    new Cron(backupCronPattern, () => {
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
        configFolder,
      );
      await createStartScript(serverFolder, configFolder);
      await prepareConfig(serverFolder, configFolder);
      await copyResourcePacks(serverFolder, configFolder);
    } else {
      console.error("Failed to get any version.");
      Deno.exit(1);
    }
  }
}

main();
