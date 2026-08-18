import React, {useEffect} from 'react';
import {Stack} from "expo-router";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {useTranslation} from "react-i18next";
import {useSelector} from "react-redux";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {StyleSheet} from 'react-native';

const AppNav = () => {
    const {i18n} = useTranslation();
    const {languageSelected} = useSelector((state: any) => state.language);
    const {userToken, onBoardingStatus} = useSelector((state: any) => state.user);

    useEffect(() => {
        i18n.changeLanguage(languageSelected).catch((error) => console.log(error));
    }, [i18n, languageSelected]);

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <GestureHandlerRootView style={{flex: 1}}>
                    <Stack>
                       {/* <Stack.Screen name="index" options={{ headerShown: false }} />*/}
                        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                        <Stack.Protected guard={userToken !== null}>
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
