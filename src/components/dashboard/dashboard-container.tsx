import {Alert, Container, Typography} from "@mui/material";
import React from "react";

interface DashboardContainerProps
{
    children: any;
    title: string;
    error?: any;
}

const DashboardContainer = (props: DashboardContainerProps) => {

    return (
        <Container>
            {props.error ? <Alert severity="error">{props.error}</Alert> : null}
            {/*<Breadcrumbs>*/}
            {/*    <Link color="inherit" underline="hover" href="/">Home</Link>*/}
            {/*    <Typography sx={{ color: 'text.primary' }}>{props.title}</Typography>*/}
            {/*</Breadcrumbs>*/}
            <Typography variant="h2" gutterBottom>{props.title}</Typography>
            {props.children}
        </Container>
    );
};

export default DashboardContainer;