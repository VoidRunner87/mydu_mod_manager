import React from 'react';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import {
    createMemoryRouter,
    Link,
    Navigate,
    RouterProvider,
    useNavigate
} from "react-router-dom";
import Dashboard from "./dashboard/dashboard";
import {Container, Typography} from "@mui/material";
import SettingsPage from "./settings/settings-page";
import ModsPage from "./mods/mods-page";

function App() {

    const ErrorPage = () => {
        const navigate = useNavigate();

        return (<Container>
            <Typography variant="h1">404</Typography>
            <ul>
                <li><Link to={"/settings"}>/settings</Link></li>
                <li><Link to={"settings"}>settings</Link></li>
                <li><Link to={"/mods"}>/mods</Link></li>
                <li><Link to={"mods"}>mods</Link></li>
                <button onClick={() => navigate("/settings")}></button>
            </ul>
        </Container>);
    }

    const router = createMemoryRouter([
        {
            path: '/',
            element: <Dashboard/>,
            errorElement: <ErrorPage/>,
            children: [
                {path: '', element: <Navigate to="mods" replace/>},
                {path: 'settings', element: <SettingsPage/>},
                {path: 'mods', element: <ModsPage/>},
            ]
        }
    ]);

    return (<RouterProvider router={router}/>);
}

export default App;
