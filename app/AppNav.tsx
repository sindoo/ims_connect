import React, {useEffect} from 'react';
import {Stack} from "expo-router";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {StyleSheet} from 'react-native';
import CustomHeaderWithOutBackButton from "../components/ui/header/CustomHeaderWithOutBackButton";
import {checkTokenExpired} from "../services/GeneralService";
import {getAuthToken, setAuthToken} from "../api/ApiManager";
import {setUserSliceToken} from "../redux/features/user/userSlice";

const AppNav = () => {
    const {i18n} = useTranslation();
    const {languageSelected} = useSelector((state: any) => state.language);
    const {userToken} = useSelector((state: any) => state.user);
    const {t} = useTranslation();
    const dispatch = useDispatch();

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
