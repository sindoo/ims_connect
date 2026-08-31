import React, {useEffect} from 'react';
import {Stack, useRouter} from "expo-router";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {StyleSheet} from 'react-native';
import CustomHeaderWithOutBackButton from "../components/ui/header/CustomHeaderWithOutBackButton";
import {checkTokenExpired, updateHeaderNotificationEveryWhere} from "../services/GeneralService";
import {getAuthToken, setAuthToken} from "../api/ApiManager";
import {setUserSliceToken} from "../redux/features/user/userSlice";
import CustomHeaderWithButton from "../components/ui/header/CustomHeaderWithButton";
import { handlePendingNotificationIfAny } from "../services/notificationService";

const AppNav = () => {
    const {i18n} = useTranslation();
    const {languageSelected} = useSelector((state: any) => state.language);
    const {userToken, user} = useSelector((state: any) => state.user);
    const {t} = useTranslation();
    const {selectedChild} = useSelector((state: any) => state.child);
    const dispatch = useDispatch();
    const router = useRouter();

    const handleBackRoute = (routeName: string) => {
        router.push(routeName);
    }

    useEffect(() => {
        //i18n.changeLanguage(languageSelected).catch((error) => console.log(error));
        const fetchData = async () => {
            await i18n.changeLanguage(languageSelected);
            const userToken = await getAuthToken();
            if(userToken !== null) {
                setAuthToken(userToken);
                dispatch(setUserSliceToken(userToken));
            }
            checkTokenExpired(userToken, dispatch);
        };
        fetchData().catch(error => {
            console.log(error);
        });
    }, [i18n, languageSelected]);

    useEffect(() => {
        const fetchData = async () => {
            if(user !== null) {
                // GET ALL NOTIFICATIONS AND DELETE OLD ONE
                await updateHeaderNotificationEveryWhere(user.uuid, dispatch);
            }
            checkTokenExpired(userToken, dispatch);
        };
        fetchData().catch(error => {
            console.log(error);
        })
    }, [selectedChild]);

    useEffect(() => {
        const pendingNotification = async () => {
            if (userToken !== null) {
                await handlePendingNotificationIfAny();
            }
        }
        pendingNotification().catch(error  => {
            console.log(error);
        });
    }, [userToken]);

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <GestureHandlerRootView style={{flex: 1}}>
                    <Stack
                        screenOptions={{
                            //headerShown: false,
                            //animation: "none"
                        }}
                    >
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
                            <Stack.Screen name="(drawer)" options={{headerShown: false}} />
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
                            {/*<Stack.Screen
                                name="pages/more/exchangelibrary"
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
                            />*/}


                        </Stack.Protected>
                    </Stack>
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
