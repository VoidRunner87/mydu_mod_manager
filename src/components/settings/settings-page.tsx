import React from "react";
import {Box, Button, Paper, Stack, TextField} from "@mui/material";
import DashboardContainer from "../dashboard/dashboard-container";

const SettingsPage: React.FC = () => {
    return (
        <DashboardContainer title="Settings">
            <p>Manager Settings</p>
            <Stack spacing={2} direction="row">
                <Button variant="contained">Save</Button>
            </Stack>
            <br/>
            <Paper>
                <Box
                    component="form"
                    sx={{'& .MuiTextField-root': {m: 1, width: '50ch'}}}
                    noValidate
                    autoComplete="off"
                >
                    <div>
                        <TextField
                            id="outlined-disabled"
                            label="MyDU Client Folder"
                            defaultValue="C:\ProgramData\My Dual Universe"
                        />
                    </div>
                </Box>
            </Paper>
        </DashboardContainer>
    );
}

export default SettingsPage;