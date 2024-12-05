export async function ensureExecutableFlag(filePath: string) {
  try {
    // Get the current file permissions
    const fileInfo = await Deno.stat(filePath);
    const currentPermissions = fileInfo.mode!;

    // Add the executable flag for user, group, and others (0o111)
    const newPermissions = currentPermissions | 0o111;

    // Apply the new permissions
    await Deno.chmod(filePath, newPermissions);

    return true;
  } catch (_e) {
    return false;
  }
}
