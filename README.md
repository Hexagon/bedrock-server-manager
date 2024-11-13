# Bedrock Server Manager (bsm)

This tool helps you download, update, and manage Minecraft Bedrock Dedicated
Servers with ease.

- Install or upgrade to the latest version of Minecraft Bedrock Dedicated Server
  using a single command `bsm latest`.
- Keeps configuration and worlds in a separate folder.
- Updates vanilla resource packs by copying them from the server to the
  configuration folder on server upgrade.
- Enables automated setup of a system service through `bsm enable-service` and
  `bsm disable-service`.

## Getting started

Bsm is powered by Deno, if you do not already have it installed, run the
follwing command `curl -fsSL https://deno.land/install.sh | sh` or check out the
full guide at [https://docs.deno.com/runtime/#install-deno](Deno Getting
Started).

### Installation

Installing and upgrading bsm is done through this command:

```bash
deno install --global -frAn bsm jsr:@hexagon/bedrock-server-manager
```

## Usage

Navigate to the directory where you want to install your Minecraft server and
configuration files. Then run `bsm` with the desired version (usually "latest"):

```bash
bsm latest
```

This will:

- Download the latest Minecraft Bedrock Dedicated Server to `./server/`
- Set up the necessary files in `./config/`
- Create a bsm configuration file `./bsm.json`

Now, you can customize the server settings in the
`./config/server.configuration` file.

**Starting the server manually:**

```bash
bsm start
```

**Starting the server at boot:**

```bash
bsm enable-service
```

This will install a user mode service named `bsm-service-<randomnumber>`, which
will be auto-started at boot. Service can be uninstalled using
`bsm disable-service`. Generated service name can be seen in `bsm.json`.

## Managing backups

### Automated backups

The server automatically backs up world files at server start, and daily at 3
am. Desired interval can be customized through `./bsm.json`.

### Manual Backups

Backups are automatically created on server start. To force a backup - shut down
the server with `bsm disable-service`, then bring the server back up using
`bsm enable-service`.

### Restoring Backups

To restore a backup:

- Shut down the server with `bsm disable-service`.
- Run `bsm list-backups` to see available backups.
- Run `bsm restore-backup <timestamp>` to restore a specific backup.
- Start the server again with `bsm enable-service`.

## Advanced usage

`bsm help` lists all available commands for advanced usage.

## Contributions

Any contribution is greatly appreciated. You can contribute by:

- **Reporting bugs:** If you encounter any issues, please open an issue on the
  [GitHub repository](https://github.com/Hexagon/bedrock-server-manager/issues).
  Be sure to include detailed information about the problem, your operating
  system, and the bsm version.
- **Suggesting features:** Have an idea for a new feature or improvement? Open
  an issue on the
  [GitHub repository](https://github.com/Hexagon/bedrock-server-manager/issues)
  to start a discussion.
- **Submitting pull requests:** Feel free to fork the repository and submit pull
  requests for bug fixes, new features, or documentation updates.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.
