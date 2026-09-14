import React from 'react';
import {useColorScheme} from "react-native";
import {COLORS} from "../../constants";
import {useTranslation} from "react-i18next";
import {Drawer} from "expo-router/drawer";
import {MaterialIcons} from "@expo/vector-icons";
import {globalStyles} from "../../style/Global";
import DrawerHeaderContent from "../../components/drawer/DrawerHeaderContent";
import CustomHeaderWithButton from "../../components/ui/header/CustomHeaderWithButton";
import {router} from "expo-router";


const DrawerLayout = () => {
    const colorScheme = useColorScheme();
    const theme = COLORS[colorScheme] ?? COLORS.light;
    const {t} = useTranslation();

    const handleBackRoute = (routeName: string) => {
        router.push(routeName);
    };

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
                name="profile/index"
                options={{
                    drawerLabel: t('drawer.profile'),
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
                    header: () => {
                        return (
                            <CustomHeaderWithButton
                                handleBackRoute={handleBackRoute}
                                title={t('drawer.profile')}
                                backRouteName="/(drawer)/(tabs)"
                            />
                        ) as any;
                    },
                }}
            />

            <Drawer.Screen
                name="password/index"
                options={{
                    drawerLabel: t('drawer.edit_password'),
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
                    header: () => {
                        return (
                            <CustomHeaderWithButton
                                handleBackRoute={handleBackRoute}
                                title={t('drawer.edit_password')}
                                backRouteName="/(drawer)/(tabs)"
                            />
                        ) as any;
                    },
                }}
            />
        </Drawer>
    );
};

export default DrawerLayout;
