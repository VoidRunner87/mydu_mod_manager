import React, {useEffect, useState} from "react";
import {Box, Button, Paper, Stack, TextField} from "@mui/material";
import DashboardContainer from "../dashboard/dashboard-container";
import {AppConfig} from "../../common/config";

const SettingsPage: React.FC = () => {

    const [config, setConfig] = useState<AppConfig>({myDUPath: "", serverUrl: ""});
    const [valid, setValid] = useState<boolean>(false);

    useEffect(() => {
        window.api.readConfig()
            .then(config => {
                setConfig(config);
                checkPath(config.myDUPath);
            });
    }, []);

    const checkPath = async (val: string) => {
        let exists = await window.api.checkDualLauncherExists(val);
        setValid(exists);

        return exists;
    }

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newConfig = {
            ...config,
            myDUPath: event.target.value,
        };

        setConfig(newConfig);
        window.api.saveConfig(newConfig);

        checkPath(event.target.value);
    }

    return (
        <DashboardContainer title="Settings">
            <p>Manager Settings</p>
            <Paper>
                <Box
                    component="form"
                    sx={{'& .MuiTextField-root': {m: 1, width: '50ch'}}}
                    noValidate
                    autoComplete="off"
                >
                    <div>
                        <TextField
                            error={!valid}
                            helperText={valid ? "Valid path" : "Could not find MyDU on the path specified"}
                            aria-invalid={!valid}
                            id="outlined-disabled"
                            label="MyDU Client Folder"
                            value={config.myDUPath}
                            onChange={handleChange}
                        />
                    </div>
                </Box>
            </Paper>
        </DashboardContainer>
    );
}

export default SettingsPage;