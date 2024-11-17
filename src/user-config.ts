import { ensureFile, exists } from "@std/fs";
import { resolve } from "@std/path";
import { baseServiceName, defaultBackupPattern } from "../config.ts";

interface BSMJson {
  serviceName: string;
  backupCron: string;
}

export async function readOrCreateBSMJson(filePath: string): Promise<BSMJson> {
  const resolvedPath = resolve(filePath);
  const bsmJsonPath = resolve(resolvedPath, "bsm.json");

  try {
    if (await exists(bsmJsonPath)) {
      // Read existing bsm.json
      const decoder = new TextDecoder();
      const data = await Deno.readFile(bsmJsonPath);
      const decodedData = decoder.decode(data);
      const decodedObject: BSMJson = JSON.parse(decodedData);

      // Inject defaults
      decodedObject.serviceName ??= `${baseServiceName}-${
        Math.floor(Math.random() * 10000)
      }`;
      decodedObject.backupCron ??= defaultBackupPattern;

      return decodedObject;
    } else {
      // Create template bsm.json
      const randomNumber = Math.floor(Math.random() * 10000);
      const bsmJson: BSMJson = {
        serviceName: `${baseServiceName}-${randomNumber}`,
        backupCron: defaultBackupPattern,
      };

      const encoder = new TextEncoder();
      await ensureFile(bsmJsonPath);
      await Deno.writeFile(
        bsmJsonPath,
        encoder.encode(JSON.stringify(bsmJson, null, 2)),
      );
      return bsmJson;
    }
  } catch (err) {
    console.error("Error reading or creating bsm.json:", err);
    throw err;
  }
}
