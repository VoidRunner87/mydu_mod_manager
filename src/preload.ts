// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {contextBridge, ipcRenderer} from "electron";
import {AppConfig} from "./common/config";

type DownloadCallback = (filename: string) => void;
type DownloadProgress = (filename: string, progress: number) => void;

contextBridge.exposeInMainWorld('api', {
    downloadFile: (url: string, filename: string) => ipcRenderer.send('download-file', {url, filename}),
    onDownloadComplete: (callback: DownloadCallback) => ipcRenderer.on('download-complete', (event, filePath) => callback(filePath)),
    onDownloadProgress: (callback: DownloadProgress) => ipcRenderer.on('download-progress', (event, filename, progress) => callback(filename, progress)),
    onDownloadError: (callback: DownloadCallback) => ipcRenderer.on('download-error', (event, error) => callback(error)),
    readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
    extractZipFile: (filePath: string, baseFolder: string) => ipcRenderer.invoke('extract-zip-file', filePath, baseFolder),
    checkDualLauncherExists: (directoryPath: string) => ipcRenderer.invoke('check-dual-launcher', directoryPath),
    readConfig: () => ipcRenderer.invoke('read-config'),
    saveConfig: (config: AppConfig) => ipcRenderer.invoke('save-config', config),
    listCachedMods: () => ipcRenderer.invoke("list-cached-mods"),
    listInstalledMods: () => ipcRenderer.invoke("list-installed-mods"),
    installMods: () => ipcRenderer.invoke("install-mods"),
});
