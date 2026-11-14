import '../expo-crypto-polyfill.js'; // Chemin vers votre fichier polyfill
import { ReduxProvider } from "../redux/provider";
import i18next from '../i18next/i18next';
import { I18nextProvider } from 'react-i18next';
import React, { useEffect, useRef } from "react";
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
import {AppState, Platform, View} from 'react-native';
import { updateHeaderNotificationEveryWhere } from "../services/GeneralService";
import { store } from "../redux/store";
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import UpdateBanner from "../components/ui/UpdateBanner";
import OfflineBanner from "../components/ui/OfflineBanner";
import { initSentry, bindSentryToStore, wrapWithSentry } from "../services/sentryService";

// ✅ Suivi des erreurs en production (inactif tant que le DSN n'est pas
// renseigné dans app.json > extra.sentry, et inactif en développement).
initSentry();
bindSentryToStore(store);

// Regex hoistée : évite une recompilation à chaque changement d'AppState
const BACKGROUND_STATE_REGEX = /background|inactive/;
// Anti-rebond : évite des appels réseau redondants si l'app passe
// plusieurs fois au premier plan en peu de temps
const FOREGROUND_REFRESH_MIN_INTERVAL_MS = 3000;

// ✅ InteractionManager est déprécié par React Native (message : "use
// requestIdleCallback instead"). requestIdleCallback n'est cependant pas
// garanti disponible sur tous les runtimes RN/Hermes selon la version : on
// l'utilise quand il existe, avec un repli sur setTimeout(fn, 0) sinon (qui
// a le même effet recherché ici — sortir ce travail du rendu initial
// synchrone — sans dépendre d'une API dépréciée).
const runWhenIdle = (callback: () => void): (() => void) => {
    if (typeof (globalThis as any).requestIdleCallback === 'function') {
        const handle = (globalThis as any).requestIdleCallback(callback);
        return () => (globalThis as any).cancelIdleCallback?.(handle);
    }
    const timeoutId = setTimeout(callback, 0);
    return () => clearTimeout(timeoutId);
};

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
                console.log('Erreur affichage notification background:', e);
            }
        }
    });
} catch (e) {
    console.warn("Firebase Messaging non disponible en background");
}

const RootLayout = () => {
    const cleanupRef = useRef<(() => void) | null>(null);
    const appState = useRef(AppState.currentState);
    const hasHandledInitialNotification = useRef(false);
    const lastForegroundRefreshAt = useRef(0);

    // ✅ App prête immédiatement : plus de délai fixe arbitraire (600ms).
    // Le rendu de <AppNav /> ci-dessous n'a jamais été bloqué par ce délai ;
    // il ne servait qu'à retarder inutilement l'init des notifications.
    useEffect(() => {
        console.log('🚀 Initialisation de l\'application...');
        markAppReady(true);
        console.log('✅ Application prête');

        return () => {
            markAppReady(false);
        };
    }, []);

    // ✅ Initialisation des notifications, différée après les premières
    // interactions/animations (au lieu d'un setTimeout(500) arbitraire)
    // pour ne pas ralentir le thread JS pendant le premier rendu, tout en
    // démarrant dès que possible.
    useEffect(() => {
        let cancelled = false;

        const initNotifications = async () => {
            try {
                console.log('📱 Initialisation des notifications...');

                // 1. Setup des canaux
                await setupNotificationChannel();
                if (cancelled) return;

                // 2. Demander les permissions
                const hasPermission = await requestUserPermission();
                console.log('✅ Permission notifications:', hasPermission);
                if (cancelled || !hasPermission) return;

                // 3. Configurer les listeners
                const cleanup = setupNotificationListeners();
                cleanupRef.current = cleanup.unsubscribe;

                // 4. Vérifier les notifications initiales (une seule fois)
                if (!hasHandledInitialNotification.current) {
                    hasHandledInitialNotification.current = true;
                    await handleInitialNotification();
                }

                console.log('✅ Notifications initialisées');
            } catch (error) {
                console.log('❌ Erreur init notifications:', error);
            }
        };

        const cancelIdle = runWhenIdle(initNotifications);

        return () => {
            cancelled = true;
            cancelIdle();
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
        };
    }, []);

    // ✅ Surveillance de l'état de l'app
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (BACKGROUND_STATE_REGEX.test(appState.current) && nextAppState === 'active') {
                console.log('📱 App au premier plan');

                // ✅ Mettre à jour les notifications quand l'app revient au premier plan,
                // avec un anti-rebond pour éviter des appels réseau en rafale
                const now = Date.now();
                if (now - lastForegroundRefreshAt.current > FOREGROUND_REFRESH_MIN_INTERVAL_MS) {
                    lastForegroundRefreshAt.current = now;
                    const state = store.getState();
                    if (state.user?.user?.uuid) {
                        updateHeaderNotificationEveryWhere(state.user.user.uuid, store.dispatch)
                            .catch(error => console.log('Erreur refresh notifications:', error));
                    }
                }

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
        <KeyboardProvider>
            <ReduxProvider>
                <I18nextProvider i18n={i18next}>
                    {/* SafeAreaProvider ajouté ici uniquement pour que
                        UpdateBanner puisse lire l'inset du haut (encoche/
                        status bar) via useSafeAreaInsets et s'y adapter —
                        AppNav, lui, continue de gérer ses propres écrans
                        exactement comme avant (aucun edge/inset forcé sur
                        son conteneur). Le bandeau est un simple frère placé
                        avant <AppNav />, qui pousse la navigation vers le
                        bas de sa propre hauteur quand il est visible, et
                        disparaît complètement (0px) sinon. */}
                    <SafeAreaProvider>
                        <View style={{flex: 1}}>
                            <OfflineBanner />
                            <UpdateBanner />
                            <View style={{flex: 1}}>
                                <AppNav />
                            </View>
                        </View>
                    </SafeAreaProvider>
                </I18nextProvider>
            </ReduxProvider>
        </KeyboardProvider>
    );
};

export default wrapWithSentry(RootLayout);
