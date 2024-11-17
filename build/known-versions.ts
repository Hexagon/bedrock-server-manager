// build/known-versions.ts
import { getLatestVersion } from "../src/version-finder.ts";
import { knownVersions } from "../known-versions.ts";

async function updateKnownVersions() {
  try {
    const latest = await getLatestVersion();
    if (latest) {
      // Check if the latest version already exists
      const versionExists = knownVersions.some((v) =>
        v.version === latest.version
      );
      if (!versionExists) {
        knownVersions.push(latest);
        await Deno.writeTextFile(
          "./known-versions.ts",
          `export const knownVersions = ${
            JSON.stringify(knownVersions, null, 2)
          }`, // Use 2 spaces for indentation
        );
        console.log("Updated known-versions.ts");
      } else {
        console.log("Latest version already exists in known-versions.ts");
      }
    } else {
      console.warn("Failed to fetch the latest version.");
    }
  } catch (error) {
    console.error(
      `Error updating known versions: ${
        (error instanceof Error) ? error.message : "Unknown"
      }`,
    );
  }
}

updateKnownVersions();
