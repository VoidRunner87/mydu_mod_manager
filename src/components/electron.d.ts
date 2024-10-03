import {AppConfig} from "../common/config";

export {};

type DownloadCallback = (filename: string) => void;
type DownloadProgress = (filename: string, progress: number) => void;

declare global {
    interface Window {
        api: {
            checkDualLauncherExists: (directoryPath: string) => Promise<boolean>;
            readConfig: () => Promise<AppConfig>;
            saveConfig: (config: AppConfig) => void;
            downloadFile: (url: string, filename: string) => void;
            onDownloadComplete: (callback: DownloadCallback) => void;
            onDownloadProgress: (callback: DownloadProgress) => void;
            onDownloadError: (callback: DownloadCallback) => void;
            extractZipFile: (filePath: string, baseFolder: string) => Promise<string>;
            readFile: (filePath) => Promise<string>;
            listCachedMods: () => Promise<string[]>;
            listInstalledMods: () => Promise<string[]>;
            installMods: () => Promise<void>;
        };
    }
}