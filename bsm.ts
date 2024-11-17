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
import { checkForBSMJson, readOrCreateBSMJson } from "./src/user-config.ts";
import { checkBsmVersion } from "./src/check-bsm-version.ts";

async function main() {
  const argumentOne = Deno.args.length > 0
      ? Deno.args[0].trim().toLowerCase().replace("--", "")
      : null,
    argumentTwo = Deno.args.length > 1
      ? Deno.args[1].trim().toLowerCase()
      : null;

  if (argumentOne === "help") {
    console.log(`
  Usage: bsm [command]

  Commands:
    use <version> | latest     Downloads and installs Bedrock Server.
    list-versions              Lists all known versions.
    start                      Starts the Minecraft Bedrock Dedicated Server in interactive mode.
    start-scripted             Starts the Minecraft Bedrock Dedicated Server.
    enable-service             Installs a service to start the server at boot.
    disable-service            Removes the service that starts the server at boot.
    list-backups               Lists available backups.
    restore-backup <timestamp> Restores a backup from a given timestamp.
    help                       Displays this help message.
    `);
    Deno.exit(0);
  }

  if (argumentOne === "list-versions") {
    // Get dynamic latest
    try {
      const latest = await getLatestVersion();
      if (latest === null) {
        console.log("Failed to fetch dynamic latest version.");
      } else {
        console.log("\nLatest (dynamic):");
        console.log(`\t${latest.version}\t${latest.url}`);
      }
    } catch (_error) {
      console.log("Failed to fetch dynamic latest version.");
    }

    // Get all known
    const allKnownVersions = await getAllKnownVersions();
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

  if (argumentOne === "enable-service") {
    if (!await checkForBSMJson(workingDirFolder)) {
      console.error(
        "bsm.json not found, you're probably trying to run bsm in the wrong working directory.",
      );
      Deno.exit(1);
    }
    const config = await readOrCreateBSMJson(workingDirFolder);
    const startScript = "bsm start-scripted";
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

  if (argumentOne === "disable-service") {
    if (!await checkForBSMJson(workingDirFolder)) {
      console.error(
        "bsm.json not found, you're probably trying to run bsm in the wrong working directory.",
      );
      Deno.exit(1);
    }
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

  if (argumentOne === "list-backups") {
    if (!await checkForBSMJson(workingDirFolder)) {
      console.error(
        "bsm.json not found, you're probably trying to run bsm in the wrong working directory.",
      );
      Deno.exit(1);
    }
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

  if (argumentOne === "restore-backup") {
    if (!await checkForBSMJson(workingDirFolder)) {
      console.error(
        "bsm.json not found, you're probably trying to run bsm in the wrong working directory.",
      );
      Deno.exit(1);
    }
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

  if (argumentOne === "use") {
    // Do a version check before bootstrapping or upgrading
    const upToDate = await checkBsmVersion();
    if (!upToDate) {
      console.log("");
      console.log(
        "NOTE: There is a new version of bsm available, it is recommended to update by checking the instructions at https://github.com/hexagon/bedrock-server-manager",
      );
      console.log("");
    }

    let selectedVersion: VersionEntry | null = null;
    if (argumentTwo === "latest") {
      selectedVersion = await getLatestVersion();
      if (selectedVersion === null) {
        selectedVersion = await getLatestKnownVersion();
      }
    } else if (argumentTwo !== null) {
      selectedVersion = await getSpecificKnownVersion(
        argumentTwo,
      );
      if (selectedVersion === null) {
        console.error(
          `Version ${argumentTwo} not found in known-versions.json`,
        );
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
      await readOrCreateBSMJson(workingDirFolder);
      console.log("Success!");
      Deno.exit(0);
    } else {
      console.error("Unknown error.");
      Deno.exit(1);
    }
  }

  if (argumentOne === "start" || argumentOne === "start-scripted") {
    if (!await checkForBSMJson(workingDirFolder)) {
      console.error(
        "bsm.json not found, you're probably trying to run bsm in the wrong working directory.",
      );
      Deno.exit(1);
    }
    const config = await readOrCreateBSMJson(workingDirFolder);
    const server = new BedrockServer(
      serverFolder,
      configFolder,
      argumentOne !== "start-scripted",
    );

    // Back up before start
    await server.backup(backupFolder);

    // Do start
    await server.start();

    // Start the cron job for daily backups
    new Cron(config.backupCron, () => {
      console.log("Running scheduled backup...");
      server.backup(backupFolder);
    });
  } else {
    console.log("Invalid arguments, try 'bsm help'.");
  }
}

main();
