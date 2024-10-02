import React from 'react';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import {createBrowserRouter, Navigate, RouterProvider} from "react-router-dom";
import Dashboard from "./dashboard/dashboard";
import {Container, Typography} from "@mui/material";
import SettingsPage from "./settings/settings-page";

function App() {

    const ErrorPage = () => {
        return (<Container>
            <Typography variant="h1">404</Typography>
        </Container>);
    }

    const router = createBrowserRouter([
        {
            path: '/',
            element: <Dashboard/>,
            errorElement: <ErrorPage/>,
            children: [
                {path: '', element: <Navigate to="settings" replace/>},
                {path: 'main_window', element: <SettingsPage/>},
            ]
        }
    ]);

    return (<RouterProvider router={router}/>);
}

export default App;
