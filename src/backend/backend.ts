import * as path from "node:path";
import * as fs from "node:fs";
import * as https from "node:https";
import * as http from "http";
import {app, ipcMain} from "electron";
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
        fs.unlink(filePath, () => {
            console.error("Failed to delete file");
        });
        event.reply('download-error', err.message); // Send error to renderer
    });
});

ipcMain.handle('read-file', (event, filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err)
            {
                reject(`Failed to read file: ${filePath}`);
            }
            else {
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

        const modCacheFolder = path.join(baseFolder, "Game", "data", "mod_cache");

        if (!fs.existsSync(modCacheFolder)) {
            fs.mkdirSync(modCacheFolder);
        }

        const targetFolder = path.join(modCacheFolder, fileName);

        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder);
        }

        extractZip(zipFilePath, { dir: targetFolder })
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

const listCachedMods = async () => await listMods(path.join("Game", "data", "mod_cache"));
const listInstalledMods = async () => await listMods(path.join("Game", "data", "resources_generated", "mods"));

ipcMain.handle('list-cached-mods', async (event) => {
    return await listCachedMods();
});

ipcMain.handle('list-installed-mods', async (event) => {
    return await listInstalledMods();
});

function copyFolder(src: string, dest: string) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
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

ipcMain.handle('install-mods', async (event) => {
    const config = await readConfigFile();
    const cachedMods = await listCachedMods();

    const myDUPath = config.myDUPath;
    const modCachePath = path.join(myDUPath, "Game", "data", "mod_cache");
    const modsFolder = path.join(myDUPath, "Game", "data", "resources_generated", "mods");

    for (const mod of cachedMods) {
        const modPath = path.join(modCachePath, mod);
        const destPath = path.join(modsFolder, mod);
        copyFolder(modPath, destPath);
    }
});

app.on('ready', () => {
    if (!fs.existsSync(configFilePath)) {
        writeConfigFile(defaultConfig);
    }
});