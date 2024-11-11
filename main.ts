// mc-server-update.ts
import { configFolder, defaultPort, serverFolder } from "./config.ts";
import { createStartScript } from "./src/create-start-script.ts";
import { downloadAndUnpackServer } from "./src/download-server.ts";
import { prepareConfig } from "./src/prepare-config.ts";
import {
getAllKnownVersions,
  getLatestKnownVersion,
  getLatestVersion,
  getSpecificKnownVersion,
  VersionEntry,
} from "./src/version-finder.ts";

const version = Deno.args[0] || "latest"; // Get version from command line argument or default to "latest"

async function main() {
  if (version === "list") {

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

  let selectedVersion: VersionEntry | null = null;

  if (version === "latest") {
    selectedVersion = await getLatestVersion();
    if (selectedVersion === null) {
      selectedVersion = await getLatestKnownVersion("./known-versions.json");
    }
  } else {
    selectedVersion = await getSpecificKnownVersion("./known-versions.json", version);
    if (selectedVersion === null) {
      console.error(`Version ${version} not found in known-versions.json`);
      Deno.exit(1);
    }
  }

  if (selectedVersion) {
    console.log(`Using version: ${selectedVersion.version}, URL: ${selectedVersion.url}`);
    await downloadAndUnpackServer(selectedVersion.url, selectedVersion.version, serverFolder, configFolder);
    await createStartScript(serverFolder, configFolder);
    await prepareConfig(serverFolder, configFolder);
  } else {
    console.error("Failed to get any version.");
    Deno.exit(1);
  }
}

main();