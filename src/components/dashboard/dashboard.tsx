import {Outlet, useNavigate} from "react-router-dom";
import React from "react";
import {AppProvider, DashboardLayout, Navigation, Router} from "@toolpad/core";
import {createTheme} from "@mui/material";
import {Inventory, Settings} from "@mui/icons-material";

const NAVIGATION: Navigation = [
    {
        segment: 'mods',
        title: 'Mods',
        icon: <Inventory/>,
    },
    {
        segment: 'main_window',
        title: 'Settings',
        icon: <Settings/>,
    }
];

const theme = createTheme({
    cssVariables: {
        colorSchemeSelector: 'data-toolpad-color-scheme',
    },
    colorSchemes: {light: true, dark: true},
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 600,
            lg: 1200,
            xl: 1536,
        },
    },
});

const Dashboard = (props: any) => {

    const [pathname, setPathname] = React.useState(window.location.pathname);
    const navigate = useNavigate();

    const router = React.useMemo<Router>(() => {
        return {
            pathname,
            searchParams: new URLSearchParams(),
            navigate: (path) => {
                setPathname(String(path));
                navigate(path);
            },
        };
    }, [pathname, navigate]);

    return <AppProvider
        branding={{
            title: "MyDU Mod Manager"
        }}
        navigation={NAVIGATION}
        router={router}
        theme={theme}
    >
        <DashboardLayout>
            <Outlet/>
        </DashboardLayout>
    </AppProvider>
};

export default Dashboard;