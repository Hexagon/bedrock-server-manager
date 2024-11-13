import { ensureDir } from "@std/fs";
import { resolve } from "@std/path";
import { getWorldName, saveBackup } from "./backup.ts";

export class BedrockServer {
  private process: Deno.Command | null = null;
  private childProcess: Deno.ChildProcess | null = null;
  private serverPath: string;
  private configPath: string;
  private worldName: string | null = null;

  constructor(serverFolder: string, configFolder: string) {
    this.serverPath = resolve(serverFolder, "bedrock_server");
    this.configPath = resolve(configFolder);
  }

  async start() {
    if (this.process) {
      console.log("Server already running.");
      return;
    }
    console.log("Starting Minecraft Bedrock server...");

    console.log("Identifying world name...");
    this.worldName = await getWorldName(this.configPath);

    if (this.worldName) {
      console.log(`Using world name: ${this.worldName}`);
    } else {
      console.error("World name not found");
      return;
    }

    this.process = new Deno.Command(this.serverPath, {
      cwd: this.configPath,
      env: {
        LD_LIBRARY_PATH: resolve(this.serverPath, ".."),
      },
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });
    this.childProcess = this.process.spawn();
    // Pipe both stdout and stderr to the `child` method
    this.childProcess.stdout.pipeTo(
      new WritableStream({
        write: (chunk) => this.log(chunk),
      }),
    );
    this.childProcess.stderr.pipeTo(
      new WritableStream({
        write: (chunk) => this.log(chunk),
      }),
    );

    // Handle unexpected exits
    this.childProcess?.status.then((status) => {
      if (!status.success) {
        console.log(
          `Server exited unexpectedly with code ${status.code}, restarting in 10 seconds.`,
        );
        this.process = null;
        this.childProcess = null;
        setTimeout(() => {
          this.start(); // Restart the server
        }, 10000);
      }
      resolve();
    });
  }

  async backup(backupPath: string) {
    console.log("Backing up Minecraft Bedrock server...");

    // Ensure the backup directory exists
    await ensureDir(backupPath);

    // Close the server
    const wasRunning = !!this.process;
    if (wasRunning) {
      console.log("Stopping server");
      await this.stop();
    }

    // Copy the world folder
    console.log("Copying world folder...");
    try {
      await saveBackup(backupPath, this.configPath);
    } catch (err) {
      console.error("Error copying world folder:", err);
    }

    // Starting server
    if (wasRunning) {
      console.log("Restarting server...");
      await this.start();
    }
    console.log("Backup done");
  }

  private log(chunk: Uint8Array) {
    const logString = new TextDecoder().decode(chunk);
    console.log(logString.trimEnd());
  }

  async restart() {
    console.log("Restarting Minecraft Bedrock server...");
    await this.stop();
    await this.start();
  }

  async stop() {
    if (!this.childProcess) {
      console.log("Server not running.");
      return;
    }

    console.log("Stopping Minecraft Bedrock server...");
    this.command("stop");
    await this.childProcess.status;
    this.process = null;
  }

  async command(cmd: string) {
    if (!this.process) {
      console.log("Server not running.");
      return;
    }
    await this.childProcess?.stdin?.getWriter().write(
      new TextEncoder().encode(cmd + "\n"),
    );
  }

  async done(): Promise<Deno.CommandStatus | undefined> {
    return await this.childProcess?.status;
  }
}
