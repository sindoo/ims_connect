import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import {useColorScheme} from "react-native";
import {COLORS} from "../../../constants";
import {useTranslation} from "react-i18next";
import {MaterialCommunityIcons} from "@expo/vector-icons";
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
            }}
        >
            {/*<Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
                }}
            />*/}
            <Tabs.Screen
                name="index"
                options={{
                    title: `${t('home.tabs_label')}`,
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
                            <CustomHeader title={t('home.tabs_label')} />
                        ) as any;
                    },
                }}
            />
        </Tabs>
    );
}
