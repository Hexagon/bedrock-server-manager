import { emptyDir, ensureDir, exists } from "@std/fs";
import { BlobReader, Uint8ArrayWriter, ZipReader } from "@zip-js/zip-js";

export async function downloadAndUnpackServer(
  downloadUrl: string,
  _version: string,
  serverFolder: string,
) {
  // Download the server zip file
  console.log(`Downloading Minecraft server ...`);
  const zipResponse = await fetch(downloadUrl);
  const zipBlob = await zipResponse.blob(); // Get the response as a Blob

  // Check if the server folder already exists
  if (await exists(serverFolder)) {
    console.warn(
      `WARNING: Server folder "${serverFolder}" already exists. It will be deleted!`,
    );
    await emptyDir(serverFolder);
  }

  // Unpack the zip file using zip.js
  console.log("Unpacking server files...");
  await ensureDir(serverFolder);

  try {
    const reader = new ZipReader(new BlobReader(zipBlob));
    const entries = await reader.getEntries();

    for (const entry of entries) {
      if (entry.directory) {
        // Create a directory
        await ensureDir(`${serverFolder}/${entry.filename}`);
      } else {
        // Extract the file
        const writer = new Uint8ArrayWriter();
        if (entry.getData) {
          await entry.getData(writer);
          const fileContent = await writer.getData();
          await Deno.writeFile(
            `${serverFolder}/${entry.filename}`,
            fileContent,
          );
        }
      }
    }
  } catch (error) {
    console.error("Error unpacking zip file:", error);
  }
}
