// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {contextBridge, ipcRenderer} from "electron";

type DownloadCallback = (filename: string) => void;
type DownloadProgress = (filename: string, progress: number) => void;

contextBridge.exposeInMainWorld('api', {
    downloadFile: (url: string, filename: string) => ipcRenderer.send('download-file', {url, filename}),
    onDownloadComplete: (callback: DownloadCallback) => ipcRenderer.on('download-complete', (event, filePath) => callback(filePath)),
    onDownloadProgress: (callback: DownloadProgress) => ipcRenderer.on('download-progress', (event, filename, progress) => callback(filename, progress)),
    onDownloadError: (callback: DownloadCallback) => ipcRenderer.on('download-error', (event, error) => callback(error))
});