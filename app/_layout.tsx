import {ReduxProvider} from "../redux/provider";
import i18next from '../i18next/i18next';
import {I18nextProvider} from 'react-i18next';
import React, {useEffect} from "react";
import AppNav from "./AppNav";
import { getApp } from "@react-native-firebase/app";
import { getMessaging, setBackgroundMessageHandler } from "@react-native-firebase/messaging";
import {notificationListener, requestUserPermission} from "../services/notificationService";

try {
    const messagingInstance = getMessaging(getApp());
    setBackgroundMessageHandler(messagingInstance, async remoteMessage => {
        console.log('Message reçu en background:', remoteMessage);
    });
}
catch (e) {
    console.warn("Firebase Messaging n'est pas disponible sur cet environnement (Expo Go ou Web)");
}

const RootLayout = () => {
    useEffect(() => {
        // 🟢 Initialisation globale des notifications lors du montage de l'application
        const initNotifications = async () => {
            const hasPermission = await requestUserPermission();
            if (hasPermission) {
                // Attacher les écouteurs de notifications (Foreground, Background-Click, Initial Notification)
                const unsubscribe = notificationListener();
                return unsubscribe;
            }
        };

        const unsubscribePromise = initNotifications();

        return () => {
            // Nettoyage de l'écouteur lors du démontage
            unsubscribePromise.then((unsubscribe) => {
                if (unsubscribe) unsubscribe();
            });
        };
    }, []);


    return (
        <ReduxProvider>
            <I18nextProvider i18n={i18next}>
                <AppNav />
            </I18nextProvider>
        </ReduxProvider>
    );
};

export default RootLayout;
