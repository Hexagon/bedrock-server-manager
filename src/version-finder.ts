// version-finder.ts
import { downloadPageUrl, downloadPageUrlRegex } from "../config.ts";

// Define the VersionEntry type
export type VersionEntry = {
  version: string;
  url: string;
};

export async function getLatestVersion(): Promise<VersionEntry> {
  const response = await fetch(downloadPageUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:90.0) Gecko/20100101 Firefox/90.0",
    },
  });
  const html = await response.text();
  const match = html.match(downloadPageUrlRegex);
  if (!match) {
    throw new Error("Could not find the latest server version.");
  }
  return { version: match[1], url: match[0] };
}

export async function getLatestKnownVersion(
  knownVersionFilePath: string,
): Promise<VersionEntry | null> {
  try {
    const versions = await getAllKnownVersions(knownVersionFilePath);
    if (versions) {
      // Sort versions in descending order and return the first one
      return versions.sort((a, b) => b.version.localeCompare(a.version))[0];
    } else {
      throw new Error("known-versions.json is empty or invalid.");
    }
  } catch (fallbackError) {
    console.error(
      `Failed to use fallback version: ${
        (fallbackError instanceof Error) ? fallbackError.message : "Unknown"
      }`,
    );
    return null;
  }
}

export async function getAllKnownVersions(
  knownVersionFilePath: string,
): Promise<VersionEntry[] | null> {
  try {
    const knownVersions = await Deno.readTextFile(knownVersionFilePath);
    const versions = JSON.parse(knownVersions) as VersionEntry[];
    return versions;
  } catch (error) {
    console.error(
      `Failed to get all known versions from known-versions.json: ${
        (error instanceof Error) ? error.message : "Unknown"
      }`,
    );
    return null;
  }
}

export async function getSpecificKnownVersion(
  knownVersionFilePath: string,
  version: string,
): Promise<VersionEntry | null> {
  try {
    const versions = await getAllKnownVersions(knownVersionFilePath);
    if (versions) {
      return versions.find((v) => v.version === version) || null;
    } else {
      return null;
    }
  } catch (error) {
    console.error(
      `Failed to get specific version from known-versions.json: ${
        (error instanceof Error) ? error.message : "Unknown"
      }`,
    );
    return null;
  }
}
