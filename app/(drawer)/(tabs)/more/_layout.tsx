import React from 'react';
import {useTranslation} from "react-i18next";
import {Stack, useRouter} from "expo-router";
import CustomHeader from "../../../../components/ui/header/CustomHeader";
import CustomHeaderWithButton from "../../../../components/ui/header/CustomHeaderWithButton";

const MoreLayout = () => {
    const {t} = useTranslation();
    const router = useRouter();

    const handleBackRoute = (routeName: string) => {
        router.push(routeName);
    }

    return (
        <Stack
            /*screenOptions={{
                headerShown: true,
            }}*/
        >
            <Stack.Screen
                name="index"
                options={{
                    animate: false,
                    headerShown: true,
                    header: () => {
                        return (
                            <CustomHeader title={t('systemTranslation.tab_nav_more')} />
                        ) as any;
                    },
                }}
            />
            <Stack.Screen
                name="tuition"
                options={{
                    animate: false,
                    header: () => {
                        return (
                            <CustomHeaderWithButton
                                handleBackRoute={handleBackRoute}
                                title={t('more.schooling')}
                                backRouteName="more"
                            />
                        ) as any;
                    },
                }}
            />

            <Stack.Screen
                name="club/index"
                options={{
                    animate: false,
                    header: () => {
                        return (
                            <CustomHeaderWithButton
                                handleBackRoute={handleBackRoute}
                                title={t('more.mini_club')}
                                backRouteName="more"
                            />
                        ) as any;
                    },
                }}
            />

            {/*<Stack.Screen
                name="average/index"
                options={{
                    header: () => {
                        return (
                            <CustomHeaderWithButton
                                handleBackRoute={handleBackRoute}
                                title={t('more.average')}
                                backRouteName="/more"
                            />
                        ) as any;
                    },
                }}
            />

            <Stack.Screen
                name="bulletin/index"
                options={{
                    header: () => {
                        return (
                            <CustomHeaderWithButton
                                handleBackRoute={handleBackRoute}
                                title={t('more.bulletin')}
                                backRouteName="/more"
                            />
                        ) as any;
                    },
                }}
            />

            <Stack.Screen
                name="teacher/index"
                options={{
                    header: () => {
                        return (
                            <CustomHeaderWithButton
                                handleBackRoute={handleBackRoute}
                                title={t('more.teachers')}
                                backRouteName="/more"
                            />
                        ) as any;
                    },
                }}
            />*/}

        </Stack>
    );
};

export default MoreLayout;
