import { ensureFile, exists } from "@std/fs";
import { resolve } from "@std/path";

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
      return JSON.parse(decoder.decode(data));
    } else {
      // Create template bsm.json
      const randomNumber = Math.floor(Math.random() * 10000);
      const bsmJson: BSMJson = {
        serviceName: `bsm-service-${randomNumber}`,
        backupCron: "0 0 3 * * *", // Every day at 3:00 AM
      };

      const encoder = new TextEncoder();
      await ensureFile(bsmJsonPath);
      await Deno.writeFile(
        bsmJsonPath,
        encoder.encode(JSON.stringify(bsmJson, null, 2)),
      );
      return bsmJson as unknown as BSMJson;
    }
  } catch (err) {
    console.error("Error reading or creating bsm.json:", err);
    throw err;
  }
}
