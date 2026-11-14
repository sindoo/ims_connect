import React, { useEffect } from 'react';
import { Stack, useRootNavigationState, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from 'react-native';
import CustomHeaderWithOutBackButton from "../components/ui/header/CustomHeaderWithOutBackButton";
import { checkTokenExpired, updateHeaderNotificationEveryWhere } from "../services/GeneralService";
import { getAuthToken, setAuthToken } from "../api/ApiManager";
import { setUserSliceToken } from "../redux/features/user/userSlice";
import CustomHeaderWithButton from "../components/ui/header/CustomHeaderWithButton";
import AlertMessageModal from "../components/ui/AlertMessageModal";
import NotificationLoadingOverlay from "../components/ui/NotificationLoadingOverlay";
import ChildSwitchLoader from "../components/ui/ChildSwitchLoader";

const AppNav = () => {
    const { i18n } = useTranslation();
    const { languageSelected } = useSelector((state: any) => state.language);
    const { userToken, user } = useSelector((state: any) => state.user);
    const { t } = useTranslation();
    const { selectedChild } = useSelector((state: any) => state.child);
    const dispatch = useDispatch();
    const router = useRouter();
    const rootNavigationState = useRootNavigationState();

    const handleBackRoute = (routeName: string) => {
        router.push(routeName);
    };

    useEffect(() => {
        const fetchData = async () => {
            await i18n.changeLanguage(languageSelected);
            const userToken = await getAuthToken();
            if (userToken !== null) {
                setAuthToken(userToken);
                dispatch(setUserSliceToken(userToken));
            }
            checkTokenExpired(userToken, dispatch);
        };
        fetchData().catch(error => console.log('AppNAvScreen 1', error));
    }, [i18n, languageSelected]);

    useEffect(() => {
        const fetchData = async () => {
            if (user !== null && user?.uuid) {
                await updateHeaderNotificationEveryWhere(user.uuid, dispatch);
            }
            checkTokenExpired(userToken, dispatch);
        };
        fetchData().catch(error => console.log('AppNAvScreen 2', error));
    }, [selectedChild, user]); // ✅ Ajout de 'user' comme dépendance

    // ✅ Vérification des notifications en attente quand l'utilisateur est authentifié
    useEffect(() => {
        if (userToken !== null && rootNavigationState?.key) {
            console.log('👤 Utilisateur authentifié, vérification des notifications en attente...');
        }
    }, [userToken, rootNavigationState?.key]);

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <Stack screenOptions={{}}>
                        <Stack.Protected guard={!(userToken !== null)}>
                            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                        </Stack.Protected>
                        <Stack.Protected guard={userToken !== null}>
                            <Stack.Screen
                                name="index"
                                options={{
                                    header: () => {
                                        return (
                                            <CustomHeaderWithOutBackButton
                                                title={t('profile_choice.title')}
                                            />
                                        ) as any;
                                    },
                                }}
                            />
                            <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
                            <Stack.Screen
                                name="pages/appointment/index"
                                options={{
                                    header: () => {
                                        return (
                                            <CustomHeaderWithButton
                                                handleBackRoute={handleBackRoute}
                                                title={t('appointment.details_title')}
                                                backRouteName="appointment/all-appointment"
                                            />
                                        ) as any;
                                    },
                                }}
                            />
                            <Stack.Screen
                                name="pages/appointment/preset-appointment-details"
                                options={{
                                    header: () => {
                                        return (
                                            <CustomHeaderWithButton
                                                handleBackRoute={handleBackRoute}
                                                title={t('appointment.details_title')}
                                                backRouteName="appointment/preset-appointment"
                                            />
                                        ) as any;
                                    },
                                }}
                            />
                            <Stack.Screen
                                name="pages/more/tuition/index"
                                options={{
                                    header: () => {
                                        return (
                                            <CustomHeaderWithButton
                                                handleBackRoute={handleBackRoute}
                                                title={t('appointment.details_title')}
                                                backRouteName="more/tuition/all-payment"
                                            />
                                        ) as any;
                                    },
                                }}
                            />
                            <Stack.Screen
                                name="pages/more/club/index"
                                options={{
                                    header: () => {
                                        return (
                                            <CustomHeaderWithButton
                                                handleBackRoute={handleBackRoute}
                                                title={t('more.mini_club_details')}
                                                backRouteName="more/club"
                                            />
                                        ) as any;
                                    },
                                }}
                            />
                            <Stack.Screen
                                name="pages/more/marketing/index"
                                options={{
                                    header: () => {
                                        return (
                                            <CustomHeaderWithButton
                                                handleBackRoute={handleBackRoute}
                                                title={t('more.product_details')}
                                                backRouteName="more/marketing"
                                            />
                                        ) as any;
                                    },
                                }}
                            />

                            <Stack.Screen
                                name="pages/notification/index"
                                options={{
                                    header: () => {
                                        return (
                                            <CustomHeaderWithButton
                                                handleBackRoute={handleBackRoute}
                                                title={t('notification.title')}
                                                backRouteName="(drawer)/(tabs)"
                                            />
                                        ) as any;
                                    },
                                }}
                            />

                            <Stack.Screen
                                name="pages/message/index"
                                options={{
                                    header: () => {
                                        return (
                                            <CustomHeaderWithButton
                                                handleBackRoute={handleBackRoute}
                                                title={t('conversationMessage.title')}
                                                backRouteName="(drawer)/(tabs)/message"
                                            />
                                        ) as any;
                                    },
                                }}
                            />

                            <Stack.Screen
                                name="pages/message/new-conversation"
                                options={{
                                    header: () => {
                                        return (
                                            <CustomHeaderWithButton
                                                handleBackRoute={handleBackRoute}
                                                title={t('contactNewMessage.title')}
                                                backRouteName="(drawer)/(tabs)/message"
                                            />
                                        ) as any;
                                    },
                                }}
                            />

                        </Stack.Protected>
                    </Stack>
                    {/* Modale d'alerte globale, au-dessus de l'écran courant */}
                    {userToken !== null && <AlertMessageModal />}
                    {/* Chargement affiché après un tap sur une notification */}
                    {userToken !== null && <NotificationLoadingOverlay />}
                    {/* Chargement affiché après un changement d'enfant, sur toutes les pages */}
                    {userToken !== null && <ChildSwitchLoader />}
                </GestureHandlerRootView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

export default AppNav;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});
