import {ReduxProvider} from "../redux/provider";
import i18next from '../i18next/i18next';
import {I18nextProvider} from 'react-i18next';
import React from "react";
import AppNav from "./AppNav";

const RootLayout = () => {
    return (
        <ReduxProvider>
            <I18nextProvider i18n={i18next}>
                <AppNav />
            </I18nextProvider>
        </ReduxProvider>
    );
};

export default RootLayout;
