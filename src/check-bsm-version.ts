import { checkJsrVersion } from "@check/self";

export async function checkBsmVersion(): Promise<boolean> {
  try {
    const result = await checkJsrVersion();
    return result.isUpToDate;
  } catch (_e) {
    /* Ignore errors, assume being up to date */
    return true;
  }
}
