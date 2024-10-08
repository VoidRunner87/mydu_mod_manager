import {Outlet, useNavigate} from "react-router-dom";
import React from "react";
import {AppProvider, DashboardLayout, Navigation, Router} from "@toolpad/core";
import {createTheme} from "@mui/material";
import {NotificationsProvider} from '@toolpad/core/useNotifications';
import {DialogsProvider} from '@toolpad/core/useDialogs';
import {Inventory, Settings} from "@mui/icons-material";
import logo from '../../assets/images/logo.png';
import styled from "@emotion/styled";

const theme = createTheme({
    palette: {
        mode: 'dark'
    },
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

const LogoImg = styled.img`
    max-width: 80px;
    max-height: 40px;
    padding: 7px 8px 7px 8px;
    margin-left: -8px;
    background-color: rgb(18, 18, 18);
    border-radius: 2px;
`;

const Dashboard = (props: any) => {

    const [pathname, setPathname] = React.useState(window.location.pathname);
    const navigate = useNavigate();

    const NAVIGATION: Navigation = [
        {
            segment: 'mods',
            title: 'Mods',
            icon: <Inventory/>,
        },
        {
            segment: 'settings',
            title: 'Settings',
            icon: <Settings/>,
        }
    ];

    const router = React.useMemo<Router>(() => {
        return {
            pathname,
            searchParams: new URLSearchParams(),
            navigate: (path) => {
                const pathPieces = String(path).split('/');
                const lastPath = pathPieces[pathPieces.length - 1];

                setPathname(lastPath);
                navigate(lastPath);
            },
        };
    }, [pathname]);

    return <AppProvider
        branding={{
            title: "MyDU Mod Manager",
            // logo: <LogoImg src={logo} alt="logo"/>
        }}
        navigation={NAVIGATION}
        router={router}
        theme={theme}
    >
        <DashboardLayout>
            <DialogsProvider>
                <NotificationsProvider>
                    <Outlet/>
                </NotificationsProvider>
            </DialogsProvider>
        </DashboardLayout>
    </AppProvider>
};

export default Dashboard;