// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {contextBridge, ipcRenderer} from "electron";
import {AppConfig} from "./common/config";

type DownloadCallback = (filename: string) => void;
type DownloadProgress = (filename: string, progress: number) => void;
type FolderDeleteCallback = (error?: Error) => void;

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
    listCachedMods: () => ipcRenderer.invoke('list-cached-mods'),
    listInstalledMods: () => ipcRenderer.invoke('list-installed-mods'),
    installMods: (modNames: string[]) => ipcRenderer.invoke('install-mods', modNames),
    deleteCachedMods: (modNames: string[]) => ipcRenderer.send('delete-cached-mods', modNames),
    deleteInstalledMods: (modNames: string[]) => ipcRenderer.send('delete-installed-mods', modNames),
    onFolderDeleteFailed: (callback: FolderDeleteCallback) => ipcRenderer.on('folder-delete-failed', (event, error) => callback(error)),
    onFolderDeleteCompleted: (callback: FolderDeleteCallback) => ipcRenderer.on('folder-delete-completed', (event, error) => callback(error)),
});
