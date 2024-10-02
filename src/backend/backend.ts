import * as path from "node:path";
import * as fs from "node:fs";
import * as https from "node:https";
import {app, ipcMain} from "electron";

ipcMain.on('download-file', (event, {url, filename}) => {
    const filePath = path.join(app.getPath('downloads'), filename);

    // Download the file
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;

        response.pipe(file);

        response.on('data', (chunk) => {
            downloadedSize += chunk.length;
            const progress = (downloadedSize / totalSize) * 100;
            event.reply('download-progress', filePath, progress); // Send progress to renderer
        });

        file.on('finish', () => {
            file.close();
            event.reply('download-complete', filePath); // Notify renderer when the download completes
        });
    }).on('error', (err) => {
        fs.unlink(filePath, () => {
            console.error("Failed to delete file");
        });
        event.reply('download-error', err.message); // Send error to renderer
    });
});