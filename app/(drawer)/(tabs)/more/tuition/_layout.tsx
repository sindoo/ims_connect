import React, {useRef, useState} from 'react';
import {globalStyles} from "../../../../../style/Global";
import {COLORS} from "../../../../../constants";
import ViewThemed from "../../../../../components/ui/ViewThemed";
import {MaterialTopTabs} from "../../appointment/_layout";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import {AppState, View} from "react-native";

const TuitionLayout = () => {
    const {t} = useTranslation();
    const {selectedChild} = useSelector((state: any) => state.child);
    const {user, userToken} = useSelector((state:any) => state.user);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();
    const [count, setCount] = useState(0);
    const appState = useRef(AppState.currentState);

    return (
        <ViewThemed style={{...globalStyles.container}}>
            <MaterialTopTabs
                screenOptions={{
                    swipeEnabled: false,
                    tabBarLabelStyle: {
                        fontSize: 14,
                        textTransform: 'capitalize',
                        letterSpacing: 0.6,
                        fontWeight: '700',
                    },
                    tabBarStyle: {
                        backgroundColor: COLORS.white,
                        borderBottomColor: COLORS.white,
                        height: 53,
                    },
                    tabBarIndicatorStyle: {
                        borderBottomColor: COLORS.secondary,
                        borderBottomWidth: 1,
                    },
                    tabBarActiveTintColor: COLORS.secondary,
                    tabBarInactiveTintColor: COLORS.gray,
                    tabBarPressOpacity: 1,
                    tabBarPressColor: 'transparent',
                }}
            >
                <MaterialTopTabs.Screen
                    name="all-payment"
                    options={{
                        tabBarLabel:  t('more.all_payment'),
                        title:  t('more.all_payment'),
                        tabBarLabelStyle: {
                            textTransform: 'none',
                            fontSize: 15,
                            fontWeight: '700',
                        },
                    }}
                />

               <MaterialTopTabs.Screen
                    name="proforma"
                    options={{
                        tabBarLabel: t('more.proforma'),
                        title: t('more.proforma'),
                        tabBarLabelStyle: {
                            textTransform: 'none',
                            fontSize: 15,
                            fontWeight: '700',
                        },
                    }}
                />

                <MaterialTopTabs.Screen
                    name="deadline"
                    options={{
                        tabBarLabel: t('more.echeancier'),
                        title: t('more.echeancier'),
                        tabBarLabelStyle: {
                            textTransform: 'none',
                            fontSize: 15,
                            fontWeight: '700',
                        },
                    }}
                />
            </MaterialTopTabs>

        </ViewThemed>
    );
};

export default TuitionLayout;
