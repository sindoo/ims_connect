import { Stack } from "expo-router";
import {StatusBar} from "expo-status-bar";
import React from "react";
import {useTranslation} from "react-i18next";

export default function AuthLayout() {
    const {t} = useTranslation();

    return (
        <>
            <StatusBar
                value="auto"
                translucent
                backgroundColor="transparent"
            />

            <Stack
                screenOptions={{
                    headerShown: false,
                    //animation: "none"
                }}
            >
                <Stack.Screen
                    name="index"
                    options={{
                        title: t('login.title')
                    }}
                />

                <Stack.Screen
                    name="password-forget"
                    options={{
                        title: t('forgetPassword.title')
                    }}
                />
            </Stack>
        </>
    );
}
