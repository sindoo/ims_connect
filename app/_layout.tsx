import {ReduxProvider} from "../redux/provider";
import i18next from '../i18next/i18next';
import {I18nextProvider} from 'react-i18next';
import React, {useEffect} from "react";
import AppNav from "./AppNav";
import { getApp } from "@react-native-firebase/app";
import { getMessaging, setBackgroundMessageHandler } from "@react-native-firebase/messaging";
import {
    notificationListener,
    notificationResponseListener,
    requestUserPermission,
    setupNotificationChannel
} from "../services/notificationService";
import * as Notifications from 'expo-notifications';

try {
    const messagingInstance = getMessaging(getApp());
    setBackgroundMessageHandler(messagingInstance, async remoteMessage => {
        console.log('Message reçu en background:', remoteMessage);
        // Si le payload est data-only (pas de bloc "notification"),
        // Android ne l'affiche jamais tout seul — il faut le faire nous-mêmes.
        if (!remoteMessage.notification) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: remoteMessage.data?.title as string ?? 'Nouvelle notification',
                    body: remoteMessage.data?.body as string ?? '',
                    data: remoteMessage.data,
                },
                trigger: null,
            });
        }
    });
}
catch (e) {
    console.warn("Firebase Messaging n'est pas disponible sur cet environnement (Expo Go ou Web)");
}

const RootLayout = () => {
    useEffect(() => {
        // 🟢 Initialisation globale des notifications lors du montage de l'application
        const initNotifications = async () => {
            await setupNotificationChannel();
            const hasPermission = await requestUserPermission();
            if (hasPermission) {
                // Attacher les écouteurs de notifications (Foreground, Background-Click, Initial Notification)
                const unsubscribeFcm = notificationListener();
                const unsubscribeResponse = notificationResponseListener();
                return () => {
                    unsubscribeFcm();
                    unsubscribeResponse.remove();
                };
                //return unsubscribe;
            }
        };

        const cleanupPromise = initNotifications();
        return () => {
            cleanupPromise.then((cleanup) => cleanup && cleanup());
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
