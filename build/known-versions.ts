// build/known-versions.ts
import { getLatestVersion, VersionEntry } from "../src/version-finder.ts";

async function updateKnownVersions() {
  try {
    const latest = await getLatestVersion();
    if (latest) {
      const knownVersionsFilePath = "./known-versions.json";
      let knownVersions: VersionEntry[] = [];

      try {
        // Try to read existing known versions
        const existingVersions = await Deno.readTextFile(
          knownVersionsFilePath,
        );
        knownVersions = JSON.parse(existingVersions);
      } catch (error) {
        // If the file doesn't exist or is invalid, ignore the error
        if (!(error instanceof Deno.errors.NotFound)) {
          console.warn(
            `Error reading known-versions.json: ${(error instanceof Error) ? error.message : "Unknown"}`,
          );
        }
      }

      // Check if the latest version already exists
      const versionExists = knownVersions.some((v) =>
        v.version === latest.version
      );
      if (!versionExists) {
        knownVersions.push(latest);
        await Deno.writeTextFile(
          knownVersionsFilePath,
          JSON.stringify(knownVersions, null, 2), // Use 2 spaces for indentation
        );
        console.log("Updated known-versions.json");
      } else {
        console.log("Latest version already exists in known-versions.json");
      }
    } else {
      console.warn("Failed to fetch the latest version.");
    }
  } catch (error) {
    console.error(`Error updating known versions: ${(error instanceof Error) ? error.message : "Unknown"}`);
  }
}

updateKnownVersions();