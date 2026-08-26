import React, {useEffect, useRef, useState} from 'react';
import ViewThemed from "../../../../components/ui/ViewThemed";
import {globalStyles} from "../../../../style/Global";
import {COLORS} from "../../../../constants";
import {withLayoutContext} from "expo-router";
import {
    MaterialTopTabNavigationEventMap,
    MaterialTopTabNavigationOptions,
    createMaterialTopTabNavigator,
} from "expo-router/js-top-tabs";
import { ParamListBase, TabNavigationState } from 'expo-router/react-navigation';
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import {AppState, Pressable} from "react-native";
import EmployeeService from "../../../../services/EmployeeService";
import {getEmployeesTeacher} from "../../../../redux/features/employee/employeeSlice";
import AppointmentService from "../../../../services/AppointmentService";
import {setAllAppointmentList, setPresetAppointmentList} from "../../../../redux/features/appointment/appointmentSlice";
import {checkAppState, checkTokenExpired} from "../../../../services/GeneralService";
import Loading from "../../../../components/ui/Loading";

const { Navigator } = createMaterialTopTabNavigator();
export const MaterialTopTabs = withLayoutContext<
    MaterialTopTabNavigationOptions,
    typeof Navigator,
    TabNavigationState<ParamListBase>,
    MaterialTopTabNavigationEventMap
>(Navigator);
const AppointmentLayout = () => {
    const {t} = useTranslation();
    const {selectedChild} = useSelector((state: any) => state.child);
    const {user, userToken} = useSelector((state:any) => state.user);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();
    const [count, setCount] = useState(0);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                if(selectedChild !== null) {
                    //GET EMPLOYEES AND TEACHERS OF CHILD CLASS
                    const employeesRes = await EmployeeService.getChildClassEmployees(selectedChild);
                    dispatch(getEmployeesTeacher({
                            employees: employeesRes.employees,
                            teacher: employeesRes.teacher,
                            teacherList: employeesRes.teacherList,
                            employeesClassList: employeesRes.employeesClassList,
                        }),
                    );
                    // GET CHILD APPOINTMENT LIST
                    const appointmentReq = await AppointmentService.getAllAppointment(selectedChild.person.id);
                    dispatch(setAllAppointmentList(appointmentReq));
                    setLoading(false);

                    const presetAppointment = await AppointmentService.getAllPresetAppointment(selectedChild);
                    dispatch(setPresetAppointmentList(presetAppointment));

                    if(user !== null) {
                        // GET ALL NOTIFICATIONS AND DELETE OLD ONE
                        //await updateHeaderNotificationEveryWhere(user.uuid, dispatch);
                    }
                }
                else {
                    setLoading(false);
                }

                checkTokenExpired(userToken, dispatch);
            }
            catch (error) {
                console.log("Error fetching data in AppointmentLayout:", error);
                setLoading(false);
                checkTokenExpired(userToken, dispatch);
            }
        };
        fetchData().catch(error => {
            console.log("Error in fetchData catch block:", error);
        });
        const subscription = checkAppState(appState, setCount);
        return () => {
            subscription.remove();
        };
    }, [selectedChild]);

    if (loading) {
        return <Loading />;
    }

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
                    name="upcoming-appointment"
                    options={{
                        tabBarLabel: t('appointment.upcoming'),
                        title: t('appointment.upcoming'),
                        tabBarLabelStyle: {
                            textTransform: 'none',
                            fontSize: 15,
                            fontWeight: '700',
                        },
                    }}
                    initialParams={{
                        //selectedPeriodId: selectedPeriod.idperiod
                    }}
                />

                <MaterialTopTabs.Screen
                    name="preset-appointment"
                    options={{
                        tabBarLabel: t('appointment.preset_appointment'),
                        title: t('appointment.preset_appointment'),
                        tabBarLabelStyle: {
                            textTransform: 'none',
                            fontSize: 15,
                            fontWeight: '700',
                        },
                    }}
                    initialParams={{
                        //selectedPeriodId: selectedPeriod.idperiod,
                    }}
                />

                <MaterialTopTabs.Screen
                    name="all-appointment"
                    options={{
                        tabBarLabel: t('appointment.all_appointment'),
                        title: t('appointment.all_appointment'),
                        tabBarLabelStyle: {
                            textTransform: 'none',
                            fontSize: 15,
                            fontWeight: '700',
                        },
                    }}
                    initialParams={{
                        //selectedPeriodId: selectedPeriod.idperiod,
                    }}
                />
            </MaterialTopTabs>

        </ViewThemed>
    );
};

export default AppointmentLayout;
