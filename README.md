# Bedrock Server Manager (bsm)

This tool helps you download, update, and manage Minecraft Bedrock Dedicated
Servers with ease.

## Installation

Install/update the `bsm` command using `deno`:

```bash
deno install --global -frAn bsm jsr:@hexagon/bedrock-server-manager
```

This will install the `bsm` command globally, allowing you to use it from
anywhere in your terminal.

## Features

- Automatically installs/upgrade the latest Minecraft Bedrock Dedicated Server
  version to `./server/`.
- Sets up necessary configuration files in a separate folder `./config/`.
- Manages/updates vanilla resource packs by copying them from the server to the
  configuration folder on server upgrade.
- Allows automated setup of a system service through `bsm enable-service` and
  `bsm disable-service`.

## Usage

To get started, enter the folder where you want to place your minecraft server
and config, and simply run `bsm` with the desired version:

```bash
bsm <version>
```

Replace `<version>` with the specific version number you want to download (e.g.,
`1.19.50`). You can also use `latest` to download the latest available version.

**Example:**

```bash
bsm latest
```

This will download the latest Minecraft Bedrock Dedicated Server to `./server/`,
set up the necessary files in `./config/`, and create a bsm configuration file
`./bsm.json`>

**Starting the server manually:**

```bash
bsm start
```

**Starting the server at boot:**

```bash
bsm enable-service
```

This will install a user service named `bsm-service-<randomnumber>`, which will
be auto-started at boot. Service can be uninstalled using `bsm disable-service`.

**Listing available server versions:**

```bash
bsm list
```

This will print a list of all known server versions to the console.

## Managing backups

### Automated backups

Backups of world files will be performed automatically at server start, and
daily at 3 am.

You can change the cron pattern for periodic backups using `./bsm.json`.

### Manual Backups

Make sure to shut down the server with `bsm disable-service`, then run
`bsm backup`, and bring the server back up using `bsm enable-service`.

### Restoring Backups

Make sure to shut down the server with `bsm disable-service`, then run
`bsm list-backups` to list backups, `bsm restore-backup <timestamp>` and bring
the server back up using `bsm enable-service`.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.
