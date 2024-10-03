import {Box, Button, IconButton, Paper, TextField} from "@mui/material";
import DashboardContainer from "../dashboard/dashboard-container";
import {DataGrid, GridColDef} from "@mui/x-data-grid";
import DownloadIcon from '@mui/icons-material/Download';
import ReplayIcon from '@mui/icons-material/Replay';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import React, {useEffect, useState} from "react";
import {AppConfig} from "../../common/config";

interface ModItem {
    id: string;
}

interface Manifest {
    name: string;
    mods: string[];
}

const ModsPage = () => {

    const [downloadCompletedRegistered, setDownloadCompletedRegistered] = useState(false);
    const [cachedMods, setCachedMods] = useState<ModItem[]>([]);
    const [installedMods, setInstalledMods] = useState<Record<string, ModItem>>({});
    const [config, setConfig] = useState<AppConfig>({myDUPath: "", serverUrl: ""});
    const [manifest, setManifest] = useState<Manifest>();

    const listMods = () => {
        window.api.listCachedMods()
            .then(mods => setCachedMods(mods.map(m => {
                return {
                    id: m
                }
            })));

        window.api.listInstalledMods()
            .then(mods => {
                let map = {} as Record<string, ModItem>;

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

    const columns: GridColDef[] = [
        {field: 'id', headerName: 'Title', width: 600,},
        {field: 'status', headerName: 'Status', width: 150,
            valueGetter: (value, row) => !!installedMods[row.id],
            renderCell: params =>  params.value ? (<IconButton title="Installed"><CheckCircleIcon /></IconButton>) : ""
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
                    const baseUrl = config.serverUrl.replace("manifest.json", "");
                    const downloadUrl = `${baseUrl}/${fileName}`;

                    if (!cachedMods.map(x => x.id).includes(mod)) {
                        window.api.downloadFile(downloadUrl, fileName);
                        return;
                    }

                    console.log(`Skipped ${mod}`);
                }
            });
    };

    const serverSync = () => {
        window.api.downloadFile(config.serverUrl, 'manifest.json');

        if (downloadCompletedRegistered)
        {
            return;
        }

        window.api.onDownloadComplete(filename => {
            if (filename.endsWith("manifest.json"))
            {
                processManifestFile(filename);
                return;
            }

            if (filename.endsWith(".zip"))
            {
                if (!config.myDUPath)
                {
                    return;
                }

                console.log(config.myDUPath);
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
        window.api.installMods();
    };

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
                    label="Server Mod List API URL"
                    variant="standard"
                    size="small"
                    value={config.serverUrl}
                    onChange={handleChanged}
                    fullWidth
                />
                <Button color="primary" variant="outlined" sx={{minWidth: '100px'}} onClick={() => serverSync()} startIcon={<ReplayIcon />}>
                    Sync
                </Button>
                <Button color="primary" variant="contained" sx={{minWidth: '100px'}} onClick={() => installMods()} startIcon={<DownloadIcon />}>
                    Install
                </Button>
            </Box>

            <br />

            <Paper>
                <DataGrid
                    rows={cachedMods}
                    columns={columns}
                    getRowId={x => x.id}
                    initialState={{pagination: {paginationModel}}}
                    pageSizeOptions={[10, 20, 30, 40, 50, 100]}
                    checkboxSelection
                    sx={{border: 0}}
                />
            </Paper>
        </DashboardContainer>
    );
}

export default ModsPage;