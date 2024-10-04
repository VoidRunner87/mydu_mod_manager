import {Box, Button, IconButton, LinearProgress, Paper, TextField} from "@mui/material";
import DashboardContainer from "../dashboard/dashboard-container";
import {DataGrid, GridCallbackDetails, GridColDef, GridRowSelectionModel} from "@mui/x-data-grid";
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplayIcon from '@mui/icons-material/Replay';
import EjectIcon from '@mui/icons-material/Eject';
import {useNotifications} from '@toolpad/core/useNotifications';
import React, {useEffect, useState} from "react";
import {AppConfig} from "../../common/config";
import {Inventory, CheckCircle, FolderOpen} from "@mui/icons-material";
import {useDialogs} from "@toolpad/core";

interface ModItem {
    id: string;
}

interface Manifest {
    name: string;
    mods: string[];
}

const ModsPage = () => {

    const [downloadCompletedRegistered, setDownloadCompletedRegistered] = useState(false);
    const [folderDeleteRegistered, setFolderDeleteRegistered] = useState(false);
    const [cachedMods, setCachedMods] = useState<ModItem[]>([]);
    const [installedMods, setInstalledMods] = useState<Record<string, ModItem>>({});
    const [config, setConfig] = useState<AppConfig>({myDUPath: "", serverUrl: ""});
    const [manifest, setManifest] = useState<Manifest>();
    const [selectedMods, setSelectedMods] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const notifications = useNotifications();
    const dialogs = useDialogs();

    const listMods = () => {
        window.api.listCachedMods()
            .then(mods => setCachedMods(mods.map(m => {
                return {
                    id: m
                }
            })));

        window.api.listInstalledMods()
            .then(mods => {
                const map = {} as Record<string, ModItem>;

                for (const m of mods) {
                    map[m] = {id: m};
                }

                setInstalledMods(map);
            });
    };

    useEffect(() => {
        window.api.readConfig()
            .then(config => setConfig(config));

        listMods();
    }, []);


    const statusCell = (status: { downloaded: boolean, installed: boolean }) => {
        return (
            <>
                <IconButton title="Downloaded"><Inventory/></IconButton>
                {status.installed ?
                    <IconButton title="Installed"><CheckCircle/></IconButton>
                    : ""
                }
            </>
        );
    };

    const columns: GridColDef[] = [
        {field: 'id', headerName: 'Title', width: 600,},
        {
            field: 'status', headerName: 'Status', width: 150,
            valueGetter: (value, row) => ({downloaded: true, installed: !!installedMods[row.id]}),
            renderCell: params => statusCell(params.value)
        },
        // {field: 'version', headerName: 'Version', width: 75,},
        // {field: 'url', headerName: 'URL', width: 250,},
    ];

    const paginationModel = {page: 0, pageSize: 10};

    const handleChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newConfig = {
            ...config,
            serverUrl: event.target.value,
        };

        setConfig(newConfig);
        window.api.saveConfig(newConfig);
    };

    const getBaseUrlForModDownload = (value: string) => {
        const url = new URL(value);

        const segments = url.pathname.split('/').filter(Boolean);
        segments.pop(); // Remove the last segment

        url.pathname = '/' + segments.join('/');

        return url;
    }

    const processManifestFile = (filename: string) => {
        window.api.readFile(filename)
            .then(data => {
                const manifest = JSON.parse(data) as Manifest;
                setManifest(manifest);
                return manifest;
            })
            .then(manifest => {
                for (const mod of manifest.mods) {
                    const fileName = mod.endsWith(".zip") ? mod : `${mod}.zip`;

                    const baseUrl = getBaseUrlForModDownload(config.serverUrl);
                    const downloadUrl = `${baseUrl}/${fileName}`;

                    if (!cachedMods.map(x => x.id).includes(mod)) {
                        setLoading(true);
                        window.api.downloadFile(downloadUrl, fileName);
                    }
                }
            }, error => {
                notifications.show(`Failed to download manifest: ${error}`, {
                    autoHideDuration: 3000,
                    severity: "error"
                });
            });
    };

    const serverSync = () => {
        setLoading(true);
        window.api.downloadFile(config.serverUrl, 'manifest.json');

        if (downloadCompletedRegistered) {
            return;
        }

        window.api.onDownloadError(filename => {
            setLoading(false);
            notifications.show(`Failed to download ${filename}`, {
                autoHideDuration: 3000,
                severity: "error"
            });
        });

        window.api.onDownloadComplete(filename => {
            setLoading(false);

            if (filename.endsWith("manifest.json")) {
                notifications.show('Manifest downloaded', {
                    autoHideDuration: 1000,
                    severity: "success"
                });
                processManifestFile(filename);
                return;
            }

            if (filename.endsWith(".zip")) {
                if (!config.myDUPath) {
                    return;
                }

                const filePieces = filename
                    .replace(/[\\/]/g, "|")
                    .split("|");

                const lastPiece = filePieces[filePieces.length - 1];

                notifications.show(`Downloaded ${lastPiece}`, {
                    autoHideDuration: 3000,
                    severity: "info"
                });

                window.api.extractZipFile(filename, config.myDUPath)
                    .then(() => {
                        window.api.listCachedMods()
                            .then(mods => setCachedMods(mods.map(m => {
                                return {
                                    id: m
                                }
                            })));
                    });
            }
        });

        setDownloadCompletedRegistered(true);
    };

    const installMods = () => {
        window.api.installMods(selectedMods)
            .then(() => {
                listMods();

                notifications.show(
                    `${selectedMods.length} mods installed`,
                    {
                        severity: "info",
                        autoHideDuration: 1000
                    }
                );
            });
    };

    function handleRowSelectionModelChanged(rowSelectionModel: GridRowSelectionModel, details: GridCallbackDetails) {
        setSelectedMods(rowSelectionModel.map(r => `${r}`));
    }

    async function handleDeleteClicked() {

        const confirmed = await dialogs.confirm("This will delete the selected mods from your mods-cache folder. Are you sure?");
        if (!confirmed) {
            return;
        }

        window.api.deleteCachedMods(selectedMods);

        handleRemoveModCallbacks();
    }

    async function handleUninstallClicked() {
        const confirmed = await dialogs.confirm("This will delete/uninstall the selected mods from game's folder. Are you sure?");
        if (!confirmed) {
            return;
        }

        window.api.deleteInstalledMods(selectedMods);

        handleRemoveModCallbacks();
    }

    function handleRemoveModCallbacks()
    {
        if (folderDeleteRegistered) {
            return;
        }

        window.api.onFolderDeleteCompleted(_ => {
            notifications.show(`Removed ${selectedMods.length} mods`, {
                autoHideDuration: 3000,
                severity: "info"
            });

            listMods();
        });

        window.api.onFolderDeleteFailed(error => {
            notifications.show(`Failed to delete: ${error}`, {
                autoHideDuration: 3000,
                severity: "error"
            });
        });

        setFolderDeleteRegistered(true);
    }

    async function openModsCacheFolder() {
        await window.api.openCachedPath();
    }

    async function openInstalledModsFolder() {
        await window.api.openInstalledPath();
    }

    return (
        <DashboardContainer title="Mods">
            <p>Mods Downloaded</p>

            <Box
                component="form"
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 2, // space between elements
                }}
            >
                <TextField
                    label="Server Mod Manifest URL"
                    variant="standard"
                    size="small"
                    value={config.serverUrl}
                    onChange={handleChanged}
                    fullWidth
                />
                <Button color="primary" variant="outlined" sx={{minWidth: '100px'}} onClick={() => serverSync()}
                        disabled={loading}
                        startIcon={<ReplayIcon/>}>
                    Sync
                </Button>
                <Button color="primary" variant="contained" sx={{minWidth: '100px'}}
                        disabled={selectedMods.length === 0}
                        onClick={() => installMods()}
                        startIcon={<DownloadIcon/>}>
                    Install
                </Button>
                <IconButton title={"Delete selected"}
                            onClick={handleDeleteClicked}
                            disabled={selectedMods.length === 0}>
                    <DeleteIcon/>
                </IconButton>
                <IconButton title={"Uninstall selected"}
                            onClick={handleUninstallClicked}
                            disabled={selectedMods.length === 0}>
                    <EjectIcon/>
                </IconButton>
            </Box>

            {loading ? (<Box><LinearProgress/></Box>) : ""}

            <br/>

            <Box
                component="form"
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 2, // space between elements
                }}
            >
                <Button color="secondary" variant="outlined" sx={{minWidth: '100px'}}
                        title={"Open Cached Mods Folder"}
                        onClick={() => openModsCacheFolder()}
                        startIcon={<FolderOpen/>}>
                    Mods Cache
                </Button>
                <Button color="secondary" variant="outlined" sx={{minWidth: '100px'}}
                        title={"Open Installed Mods Folder"}
                        onClick={() => openInstalledModsFolder()}
                        startIcon={<FolderOpen/>}>
                    Installed Mods
                </Button>
                <Button color="secondary" variant="outlined" sx={{minWidth: '100px'}}
                        title={"Refresh Mods List"}
                        onClick={() => listMods()}
                        startIcon={<ReplayIcon/>}>
                    Refresh
                </Button>
            </Box>

            <br/>

            <Paper>
                <DataGrid
                    rows={cachedMods}
                    columns={columns}
                    getRowId={x => x.id}
                    initialState={{pagination: {paginationModel}}}
                    pageSizeOptions={[10, 20, 30, 40, 50, 100]}
                    onRowSelectionModelChange={(rowSelectionModel, details) => handleRowSelectionModelChanged(rowSelectionModel, details)}
                    checkboxSelection
                    sx={{border: 0}}
                />
            </Paper>
        </DashboardContainer>
    );
}

export default ModsPage;