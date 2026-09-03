import { ReduxProvider } from "../redux/provider";
import i18next from '../i18next/i18next';
import { I18nextProvider } from 'react-i18next';
import React, { useEffect, useState, useRef } from "react";
import AppNav from "./AppNav";
import { getApp } from "@react-native-firebase/app";
import { getMessaging, setBackgroundMessageHandler } from "@react-native-firebase/messaging";
import {
    setupNotificationChannel,
    requestUserPermission,
    setupNotificationListeners,
    markAppReady,
    handleInitialNotification,
} from "../services/notificationService";
import * as Notifications from 'expo-notifications';
import {AppState, Platform} from 'react-native';

// ✅ Gestion des messages en background - UNIQUEMENT pour les data-only
// mais avec un try/catch pour éviter les erreurs
try {
    const messagingInstance = getMessaging(getApp());
    setBackgroundMessageHandler(messagingInstance, async remoteMessage => {
        console.log('📨 Message reçu en background:', remoteMessage);
        if (!remoteMessage.notification) {
            try {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: remoteMessage.data?.title as string ?? 'Nouvelle notification',
                        body: remoteMessage.data?.body as string ?? '',
                        data: remoteMessage.data,
                        ...(Platform.OS === 'android' && { channelId: 'default' }),
                    },
                    trigger: null,
                });
            } catch (e) {
                console.error('Erreur affichage notification background:', e);
            }
        }
    });
} catch (e) {
    console.warn("Firebase Messaging non disponible en background");
}

const RootLayout = () => {
    const [appReady, setAppReady] = useState(false);
    const cleanupRef = useRef<(() => void) | null>(null);
    const appState = useRef(AppState.currentState);
    const hasHandledInitialNotification = useRef(false);

    // ✅ Marquer l'app comme prête
    useEffect(() => {
        console.log('🚀 Initialisation de l\'application...');

        const readyTimer = setTimeout(() => {
            setAppReady(true);
            markAppReady(true);
            console.log('✅ Application prête');
        }, 600);

        return () => {
            clearTimeout(readyTimer);
            markAppReady(false);
        };
    }, []);

    // ✅ Initialisation des notifications
    useEffect(() => {
        if (!appReady) return;

        console.log('📱 Initialisation des notifications...');

        const initNotifications = async () => {
            try {
                // 1. Setup des canaux
                await setupNotificationChannel();

                // 2. Demander les permissions
                const hasPermission = await requestUserPermission();
                console.log('✅ Permission notifications:', hasPermission);

                if (hasPermission) {
                    // 3. Configurer les listeners
                    const cleanup = setupNotificationListeners();
                    cleanupRef.current = cleanup.unsubscribe;

                    // 4. Vérifier les notifications initiales (une seule fois)
                    if (!hasHandledInitialNotification.current) {
                        hasHandledInitialNotification.current = true;
                        await handleInitialNotification();
                    }

                    console.log('✅ Notifications initialisées');
                }
            } catch (error) {
                console.error('❌ Erreur init notifications:', error);
            }
        };

        // Délai pour s'assurer que tout est prêt
        const timer = setTimeout(initNotifications, 500);

        return () => {
            clearTimeout(timer);
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
        };
    }, [appReady]);

    // ✅ Surveillance de l'état de l'app
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (appState.current.match?.(/background|inactive/) && nextAppState === 'active') {
                console.log('📱 App au premier plan');
                // Vérifier les notifications en attente
                if (!hasHandledInitialNotification.current) {
                    hasHandledInitialNotification.current = true;
                    handleInitialNotification().catch(error => { console.log(error)});
                }
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
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
