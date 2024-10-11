import * as path from "node:path";
import * as fs from "node:fs";
import * as https from "node:https";
import * as http from "http";
import {app, ipcMain, shell} from "electron";
import {AppConfig} from "../common/config";
import extractZip from "extract-zip";

ipcMain.on('download-file', (event, {url, filename}) => {
    const filePath = path.join(app.getPath('downloads'), filename);

    const client = url.startsWith("https") ? https : http;

    // Download the file
    const fileStream = fs.createWriteStream(filePath);
    client.get(url, (response) => {
        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;

        response.pipe(fileStream);

        response.on('data', (chunk) => {
            downloadedSize += chunk.length;

            if (totalSize > 0) {
                const progress = (downloadedSize / totalSize) * 100;
                event.reply('download-progress', filePath, progress); // Send progress to renderer
            }
        });

        fileStream.on('finish', () => {
            fileStream.close();
            event.reply('download-complete', filePath); // Notify renderer when the download completes
        });
    }).on('error', (err) => {
        fileStream.close();
        event.reply('download-error', err.message);

        fs.unlink(filePath, () => {
            console.error("Failed to delete file");
        });
    });
});

ipcMain.handle('read-file', (event, filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                reject(`Failed to read file: ${filePath}`);
            } else {
                resolve(data);
            }
        });
    });
});

ipcMain.handle('check-dual-launcher', async (event, directoryPath: string): Promise<boolean> => {
    const filePath = path.join(directoryPath, 'dual-launcher.exe');

    try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        return true; // File exists
    } catch (error) {
        return false; // File doesn't exist or cannot be accessed
    }
});

const configFilePath = path.join(app.getPath('userData'), 'config.json');
const defaultConfig = {
    myDUPath: "C:\\ProgramData\\My Dual Universe",
    serverUrl: ""
} as AppConfig;

const readConfigFile = (): any => {
    try {
        if (fs.existsSync(configFilePath)) {
            const fileContents = fs.readFileSync(configFilePath, 'utf-8');
            return JSON.parse(fileContents);
        } else {
            writeConfigFile(defaultConfig);
            return defaultConfig;
        }
    } catch (err) {
        console.error('Error reading config file:', err);
        return null;
    }
};

const writeConfigFile = (config: any) => {
    try {
        fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
    } catch (err) {
        console.error('Error writing config file:', err);
    }
};

ipcMain.handle('read-config', () => {
    return readConfigFile();
});

ipcMain.handle('save-config', (event, config: AppConfig) => {
    writeConfigFile(config);
});

ipcMain.handle('extract-zip-file', async (event, zipFilePath, baseFolder) => {
    return new Promise((resolve, reject) => {
        const fileName = path.basename(zipFilePath, path.extname(zipFilePath));

        const modCacheFolder = path.join(baseFolder, "mods-cache");

        if (!fs.existsSync(modCacheFolder)) {
            fs.mkdirSync(modCacheFolder);
        }

        const targetFolder = path.join(modCacheFolder, fileName);

        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder);
        }

        extractZip(zipFilePath, {dir: targetFolder})
            .then(
                () => resolve(`ZIP extracted to ${targetFolder}`),
                err => reject(`Failed to extract ZIP: ${err.message}`)
            );
    });
});

const listMods = async (folder: string) => {
    const config = await readConfigFile();
    const myDUPath = config.myDUPath;
    const modCachePath = path.join(myDUPath, folder);

    return fs.readdirSync(modCachePath, {withFileTypes: true})
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
}

const listCachedMods = async () => await listMods(path.join("mods-cache"));
const listInstalledMods = async () => await listMods(path.join("Game", "data", "resources_generated", "mods"));

ipcMain.handle('list-cached-mods', async (event) => {
    return await listCachedMods();
});

ipcMain.handle('list-installed-mods', async (event) => {
    return await listInstalledMods();
});

function copyFolder(src: string, dest: string) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, {recursive: true});
    }

    const items = fs.readdirSync(src);

    items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);

        const stats = fs.statSync(srcPath);

        if (stats.isDirectory()) {
            copyFolder(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

async function deleteMods(event: Electron.IpcMainEvent, baseFolder: string, mods: string[], folderNames: string[]) {
    const deleteList = mods.filter(m => folderNames.includes(m));

    const deletePathList = deleteList.map(m => path.join(baseFolder, m));

    for (const folder of deletePathList) {
        fs.rm(folder, {recursive: true, force: true}, err => {
            if (err) {
                event.reply("folder-delete-failed", err?.message);
            }

            event.reply("folder-delete-completed", null);
        });
    }
}

ipcMain.on('delete-cached-mods', async (event, folderNames: string[]) => {
    const config = await readConfigFile();

    const myDUPath = config.myDUPath;
    const modCachePath = path.join(myDUPath, "mods-cache");

    await deleteMods(event, modCachePath, await listCachedMods(), folderNames);
});

ipcMain.on('delete-installed-mods', async (event, folderNames: string[]) => {
    const config = await readConfigFile();

    const myDUPath = config.myDUPath;
    const modsFolder = path.join(myDUPath, "Game", "data", "resources_generated", "mods");

    await deleteMods(event, modsFolder, await listInstalledMods(), folderNames);
});

interface ModCommand {
    type: string;
    path: string;
    destination: string;
}

interface ModConfig {
    title: string;
    description: string;
    author: string;
    url: string;
    version: string;
    commands: ModCommand[];
}

async function getModConfigFile(mod: string): Promise<ModConfig> {

    const config = await readConfigFile();
    const myDUPath = config.myDUPath;
    const modsFolder = path.join(myDUPath, "Game", "data", "resources_generated", "mods");

    const modConfigFile = path.join(modsFolder, mod, "mod.json");

    if (!fs.existsSync(modConfigFile)) {
        return {
            title: mod,
            description: "",
            author: "",
            url: "",
            version: "",
            commands: []
        };
    }

    const fileContents = fs.readFileSync(modConfigFile, 'utf-8');
    const modConfigObj = JSON.parse(fileContents);

    return modConfigObj as ModConfig;
}

function sanitizeModLocalPath(v: string): string {
    return v.replace("..", "");
}

function sanitizeMyDuPath(v: string): string {
    return v.replace("..", "");
}

ipcMain.handle('install-mods', async (event, folderNames: string[]) => {
    const config = await readConfigFile();
    const cachedMods = await listCachedMods();

    const myDUPath = config.myDUPath;
    const modCachePath = path.join(myDUPath, "mods-cache");
    const modsFolder = path.join(myDUPath, "Game", "data", "resources_generated", "mods");

    for (const mod of cachedMods) {
        if (!folderNames.includes(mod)) {
            continue;
        }

        const gameDataPath = path.join(myDUPath, "Game", "data");
        const modPath = path.join(modCachePath, mod);
        const destPath = path.join(modsFolder, mod);
        copyFolder(modPath, destPath);

        const modConfig = await getModConfigFile(mod);
        for (const command of modConfig.commands) {

            switch (command.type) {
                case "copy": {
                    const fromPath = sanitizeModLocalPath(command.path);
                    const toPath = sanitizeMyDuPath(command.destination);
                    const fileName = path.basename(fromPath);

                    const fromModPath = path.join(modPath, fromPath);
                    const destinationPath = path.join(gameDataPath, toPath, fileName);

                    fs.copyFileSync(fromModPath, destinationPath);

                    break;
                }
            }
        }
    }
});

ipcMain.handle("open-cached-path", async (event) => {
    const config = await readConfigFile();
    const myDUPath = config.myDUPath;
    const modCachePath = path.join(myDUPath, "mods-cache");

    await shell.openPath(modCachePath);
});

ipcMain.handle("open-installed-path", async (event) => {
    const config = await readConfigFile();

    const myDUPath = config.myDUPath;
    const modsFolder = path.join(myDUPath, "Game", "data", "resources_generated", "mods");

    await shell.openPath(modsFolder);
});

app.on('ready', () => {
    if (!fs.existsSync(configFilePath)) {
        writeConfigFile(defaultConfig);
    }
});