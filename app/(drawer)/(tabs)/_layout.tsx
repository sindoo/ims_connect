import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import {Pressable, useColorScheme} from "react-native";
import {COLORS} from "../../../constants";
import {useTranslation} from "react-i18next";
import {MaterialCommunityIcons, MaterialIcons} from "@expo/vector-icons";
import CustomHeader from "../../../components/ui/header/CustomHeader";

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const theme = COLORS[colorScheme] ?? COLORS.light;
    const {t} = useTranslation();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.tabIconColorFocused,
                tabBarInactiveTintColor: theme.tabIconColor,
                tabBarStyle: {
                    backgroundColor: theme.navBackground,
                    paddingTop: 2,
                    paddingBottom: 5,
                    height: 60,
                },
                tabBarButton: (props) => (
                    <Pressable
                        {...props}
                        android_ripple={{ color: 'transparent' }}
                        style={({ pressed }) => [
                            props.style,
                            { opacity: 1 },
                        ]}
                    />
                ),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: t('home.title'),
                    headerTintColor: theme.tabIconColorFocused,
                    tabBarIcon: ({ focused }) => (
                        <MaterialCommunityIcons
                            size={28}
                            name="home"
                            color={focused ? theme.tabIconColorFocused : theme.tabIconColor }
                        /> as any
                    ),
                    header: () => {
                        return (
                            <CustomHeader title={t('home.title')} />
                        ) as any;
                    },
                }}
            />

            <Tabs.Screen
                name="imsday/index"
                options={{
                    title: t('myDayAtIms.title'),
                    headerTintColor: theme.tabIconColorFocused,
                    unmountOnBlur: true,
                    tabBarIcon: ({ focused }) => (
                        <MaterialCommunityIcons
                            size={28}
                            name="account-edit-outline"
                            color={focused ? theme.tabIconColorFocused : theme.tabIconColor }
                        /> as any
                    ),
                    header: () => {
                        return (
                            <CustomHeader title={t('myDayAtIms.title')} />
                        ) as any;
                    },
                }}
            />

            <Tabs.Screen
                name="message/index"
                options={{
                    title: t('message.title'),
                    headerTintColor: theme.tabIconColorFocused,
                    unmountOnBlur: true,
                    tabBarIcon: ({ focused }) => (
                        <MaterialIcons
                            size={28}
                            name="add-circle-outline"
                            color={focused ? theme.tabIconColorFocused : theme.tabIconColor }
                        /> as any
                    ),
                    header: () => {
                        return (
                            <CustomHeader title={t('message.title')} />
                        ) as any;
                    },
                }}
            />

            <Tabs.Screen
                name="appointment/index"
                options={{
                    title: t('appointment.title'),
                    headerTintColor: theme.tabIconColorFocused,
                    unmountOnBlur: true,
                    tabBarIcon: ({ focused }) => (
                        <MaterialIcons
                            size={28}
                            name="event-note"
                            color={focused ? theme.tabIconColorFocused : theme.tabIconColor }
                        /> as any
                    ),
                    header: () => {
                        return (
                            <CustomHeader title={t('appointment.title')} />
                        ) as any;
                    },
                }}
            />

            <Tabs.Screen
                name="more/index"
                options={{
                    title: t('systemTranslation.tab_nav_more'),
                    headerTintColor: theme.tabIconColorFocused,
                    tabBarIcon: ({ focused }) => (
                        <MaterialIcons
                            size={28}
                            name="more-horiz"
                            color={focused ? theme.tabIconColorFocused : theme.tabIconColor }
                        /> as any
                    ),
                    header: () => {
                        return (
                            <CustomHeader title={t('systemTranslation.tab_nav_more')} />
                        ) as any;
                    },
                }}
            />

        </Tabs>
    );
}
