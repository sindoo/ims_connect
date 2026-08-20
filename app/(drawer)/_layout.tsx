import React from 'react';
import {useColorScheme} from "react-native";
import {COLORS} from "../../constants";
import {useTranslation} from "react-i18next";
import {Drawer} from "expo-router/drawer";
import {MaterialIcons} from "@expo/vector-icons";
import {globalStyles} from "../../style/Global";


const DrawerLayout = () => {
    const colorScheme = useColorScheme();
    const theme = COLORS[colorScheme] ?? COLORS.light;
    const {t} = useTranslation();

    return (
        <Drawer>
            <Drawer.Screen
                name="(tabs)" // This is the name of the page and must match the url from root
                options={{
                    drawerLabel: 'Accueil',
                    title: 'home',
                    headerShown: false,
                    drawerIcon: () => (
                        <MaterialIcons name="home" size={26} color={theme.drawerIconColor} /> as any
                    ),
                    drawerLabelStyle: globalStyles.drawerLinkItem,
                    drawerItemStyle: {
                        marginTop: 0,
                        marginBottom: 0,
                    },
                    drawerActiveTintColor: COLORS.white,
                    drawerStyle: {
                        width: '78%',
                    },
                }}
            />
        </Drawer>
    );
};

export default DrawerLayout;
