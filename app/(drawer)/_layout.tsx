import React from 'react';
import {useColorScheme} from "react-native";
import {COLORS} from "../../constants";
import {useTranslation} from "react-i18next";
import {Drawer} from "expo-router/drawer";
import {MaterialIcons} from "@expo/vector-icons";
import {globalStyles} from "../../style/Global";
import DrawerHeaderContent from "../../components/drawer/DrawerHeaderContent";


const DrawerLayout = () => {
    const colorScheme = useColorScheme();
    const theme = COLORS[colorScheme] ?? COLORS.light;
    const {t} = useTranslation();

    return (
        <Drawer
            id="DRAWER_ID"
            drawerContent={(props: any) => <DrawerHeaderContent {...props} />}
        >
            <Drawer.Screen
                name="(tabs)"
                options={{
                    drawerLabel: t('home.title'),
                    headerShown: false,
                    drawerIcon: () => (
                        <MaterialIcons name="home" size={24} color={theme.drawerIconColor} /> as any
                    ),
                    drawerLabelStyle: globalStyles.drawerLinkItem,
                    drawerItemStyle: {
                        marginTop: 0,
                        marginBottom: -5,
                        padding: 0,
                    },
                    drawerActiveTintColor: COLORS.white,
                    drawerStyle: {
                        width: '75%',
                    },
                }}
            />

            <Drawer.Screen
                name="profile"
                options={{
                    drawerLabel: t('drawer.profile'),
                    headerShown: false,
                    drawerIcon: () => (
                        <MaterialIcons name="person" size={24} color={theme.drawerIconColor} /> as any
                    ),
                    drawerLabelStyle: globalStyles.drawerLinkItem,
                    drawerItemStyle: {
                        marginTop: 0,
                        marginBottom: -5,
                        padding: 0,
                    },
                    drawerActiveTintColor: COLORS.white,
                    drawerStyle: {
                        width: '75%',
                    },
                }}
            />

            <Drawer.Screen
                name="password"
                options={{
                    drawerLabel: t('drawer.edit_password'),
                    headerShown: false,
                    drawerIcon: () => (
                        <MaterialIcons name="password" size={24} color={theme.drawerIconColor} /> as any
                    ),
                    drawerLabelStyle: globalStyles.drawerLinkItem,
                    drawerItemStyle: {
                        marginTop: 0,
                        marginBottom: -5,
                        padding: 0,
                    },
                    drawerActiveTintColor: COLORS.white,
                    drawerStyle: {
                        width: '75%',
                    },
                }}
            />
        </Drawer>
    );
};

export default DrawerLayout;
