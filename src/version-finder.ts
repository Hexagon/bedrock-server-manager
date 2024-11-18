import {
  downloadPageLinuxUrlRegex,
  downloadPageUrl,
  downloadPageWindowsUrlRegex,
} from "../config.ts";
import { knownVersions } from "../known-versions.ts";

// Define the VersionEntry type
export type VersionEntry = {
  version: string;
  linux_url: string;
  windows_url: string;
};

export async function getLatestVersion(): Promise<VersionEntry | null> {
  const response = await fetch(downloadPageUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:90.0) Gecko/20100101 Firefox/90.0",
    },
  });
  const html = await response.text();

  const linuxMatch = html.match(downloadPageLinuxUrlRegex);
  const windowsMatch = html.match(downloadPageWindowsUrlRegex);

  if (!linuxMatch || !windowsMatch) {
    return null;
  }
  // Assuming the version number is the same for both
  return {
    version: linuxMatch[1],
    linux_url: linuxMatch[0],
    windows_url: windowsMatch[0],
  };
}

export function getLatestKnownVersion(): VersionEntry | null {
  try {
    // Sort versions in descending order and return the first one
    return knownVersions[knownVersions.length - 1];
  } catch (fallbackError) {
    console.error(
      `Failed to use fallback version: ${
        (fallbackError instanceof Error) ? fallbackError.message : "Unknown"
      }`,
    );
    return null;
  }
}

export function getAllKnownVersions(): VersionEntry[] {
  return knownVersions;
}

export function getSpecificKnownVersion(
  version: string,
): VersionEntry | null {
  return knownVersions.find((v) => v.version === version) as VersionEntry ||
    null;
}
