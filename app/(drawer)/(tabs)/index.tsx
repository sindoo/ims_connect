// home/index.tsx - Version corrigée
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, AppState, RefreshControl } from "react-native";
import ViewThemed from "../../../components/ui/ViewThemed";
import { globalStyles } from "../../../style/Global";
import { CANTEEN_OBSERVATION_EN, CANTEEN_OBSERVATION_FR, COLORS, IMAGES, TIME_ZONE_ABIDJAN } from "../../../constants";
import { ImageBackground, Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import FlatButton from "../../../components/ui/FlatButton";
import { format, getHours, getMinutes, getTime, set, toDate } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import ImsDayService from "../../../services/ImsDayService";
import { checkAppState, checkTokenExpired } from "../../../services/GeneralService";
import { toZonedTime } from "date-fns-tz";
import EmployeeService from "../../../services/EmployeeService";
import { getEmployeesTeacher } from "../../../redux/features/employee/employeeSlice";
import Loading from "../../../components/ui/Loading";
import AppointmentService from "../../../services/AppointmentService";
import { setAllAppointmentList } from "../../../redux/features/appointment/appointmentSlice";
import { changeChild } from "../../../redux/features/child/childSlice";
import MenuYearService from "../../../services/MenuYearService";
import WeekService from "../../../services/WeekService";
import Card from "../../../components/ui/Card";
import { BASEURL_IMG } from "../../../api/appUrl";
import WeekCalendar from "../../../components/ui/WeekCalendar";
import HomeAppointment from "../../../components/tabs/home/HomeAppointment";
import { useRouter } from "expo-router";

// Hook personnalisé pour la logique métier
const useHomeData = (selectedChild, children, userToken, dispatch) => {
    const { i18n } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [menuYearLoading, setMenuYearLoading] = useState(false);
    const [imsDayInfo, setImsDayInfo] = useState(null);
    const [upcomingAppointHome, setUpcomingAppointHome] = useState([]);
    const [dayMenuDetails, setDayMenuDetails] = useState([]);
    const [date, setDate] = useState(new Date());
    const [week, setWeek] = useState('');
    const [workDaysNameList, setWorkDaysNameList] = useState([]);
    const [dataMenuJourList, setDataMenuJourList] = useState([]);
    const [menuPLatCanteen, setMenuPLatCanteen] = useState([]);
    const [dataMenuList, setDataMenuList] = useState([]);
    const [weekData, setWeekData] = useState([]);
    const [workDaysList, setWorkDaysList] = useState([]);
    const [statusMenuApp, setStatusMenuApp] = useState(false);
    const [count, setCount] = useState(0);
    const appState = useRef(AppState.currentState);

    const fetchMenuData = useCallback(async () => {
        setMenuYearLoading(true);
        try {
            const [dishRequestList, menuCanteenRequest, canteenWeek, menuJourListRequest] = await Promise.all([
                MenuYearService.getPlatCanteen(),
                MenuYearService.getMenuCanteen(),
                WeekService.getAllWeekData(),
                MenuYearService.getMenuByDayList()
            ]);

            setMenuPLatCanteen(dishRequestList);
            setDataMenuList(menuCanteenRequest);
            setDataMenuJourList(menuJourListRequest);

            // Traitement des semaines
            const sortedWeeks = [...canteenWeek].sort((a, b) => a.dateDebut - b.dateDebut);
            const formattedWeeks = WeekService.formatWeekData(sortedWeeks, i18n);
            setWeekData(formattedWeeks);

            // Semaine courante
            const todayDate = new Date();
            const todayTimestamp = getTime(set(todayDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }));
            const currentWeek = sortedWeeks.find(w => todayTimestamp >= w.dateDebut && w.dateFin >= todayTimestamp);
            const selectedWeek = formattedWeeks.find(w => w.id === currentWeek?.id) || formattedWeeks[formattedWeeks.length - 1];
            setWeek(selectedWeek);

            // Jours travaillés
            const workdays = await WeekService.getWorkDays();
            setWorkDaysList(workdays);
            if (workdays.length > 0) {
                const workDayNames = workdays.map(w => w.jour.toLowerCase());
                setWorkDaysNameList(workDayNames);

                const dayName = format(todayDate, 'EEEE', { locale: fr }).toUpperCase();
                const selectedDay = workdays.find(w => w.jour.toUpperCase() === dayName) || workdays[0];

                const dayMenu = MenuYearService.getMenuDayList(
                    menuJourListRequest,
                    selectedDay,
                    selectedWeek,
                    menuCanteenRequest,
                    dishRequestList
                );
                setDayMenuDetails(dayMenu);
            }

            const status = await MenuYearService.getStatusMenuYear();
            setStatusMenuApp(status?.statut);
        } catch (error) {
            console.error('Erreur menu:', error);
        } finally {
            setMenuYearLoading(false);
        }
    }, [i18n]);

    const fetchData = useCallback(async () => {
        if (!selectedChild) return;
        setLoading(true);

        try {
            // Récupération parallèle des données
            const [employeesRes, allRdvListSort, allImsDayList] = await Promise.all([
                EmployeeService.getChildClassEmployees(selectedChild),
                AppointmentService.getAllAppointment(selectedChild.person.id),
                ImsDayService.getChildImsDay(selectedChild?.person?.id)
            ]);

            // Employees
            if (employeesRes) {
                dispatch(getEmployeesTeacher({
                    employees: employeesRes.employees || [],
                    teacher: employeesRes.teacher || null,
                    teacherList: employeesRes.teacherList || [],
                    employeesClassList: employeesRes.employeesClassList || [],
                }));
            }

            // Rendez-vous
            if (allRdvListSort?.length > 0) {
                dispatch(setAllAppointmentList(allRdvListSort));
                const activeAppointments = AppointmentService.getChildActiveAppointmentList(allRdvListSort);
                setUpcomingAppointHome(activeAppointments?.slice(0, 3) || []);
            } else {
                setUpcomingAppointHome([]);
            }

            // IMS Day
            if (allImsDayList?.length > 0) {
                const latestIms = allImsDayList.reverse()[0];
                setImsDayInfo({
                    ...latestIms,
                    timeDebutSieste: latestIms.timeDebutSieste ? toZonedTime(latestIms.timeDebutSieste, TIME_ZONE_ABIDJAN) : null,
                    timeFinSieste: latestIms.timeFinSieste ? toZonedTime(latestIms.timeFinSieste, TIME_ZONE_ABIDJAN) : null,
                });
            } else {
                setImsDayInfo(null);
            }

            // Menu
            await fetchMenuData();

            // Vérification token
            if (userToken) {
                checkTokenExpired(userToken, dispatch);
            }
        }
        catch (error) {
            console.error('Erreur fetchData:', error);
            if (userToken) {
                checkTokenExpired(userToken, dispatch);
            }
        } finally {
            setLoading(false);
        }
    }, [selectedChild, userToken, dispatch, fetchMenuData]);

    const handleChangeChild = useCallback((childSelectedId) => {
        if (children?.length > 0 && childSelectedId) {
            const findChild = children.find((child) => child?.person?.id === childSelectedId);
            if (findChild) {
                dispatch(changeChild(findChild));
            }
        }
    }, [children, dispatch]);

    const handleMenuDateChange = useCallback((dateSelect) => {
        setDate(dateSelect);
        const dayName = format(dateSelect, 'EEEE', { locale: fr }).toUpperCase();
        const selectedDay = workDaysList.find(w => w.jour.toUpperCase() === dayName) || workDaysList[0];

        if (selectedDay && week && dataMenuJourList.length > 0) {
            const dayMenu = MenuYearService.getMenuDayList(
                dataMenuJourList,
                selectedDay,
                week,
                dataMenuList,
                menuPLatCanteen
            );
            setDayMenuDetails(dayMenu || []);
        }
    }, [workDaysList, dataMenuJourList, week, dataMenuList, menuPLatCanteen]);

    // Effet principal
    useEffect(() => {
        fetchData();

        const subscription = AppState.addEventListener('change', nextAppState => {
            setCount(c => c + 1);
            appState.current = nextAppState;
        });

        return () => subscription.remove();
    }, [fetchData]);

    return {
        loading,
        menuYearLoading,
        imsDayInfo,
        upcomingAppointHome,
        dayMenuDetails,
        date,
        workDaysNameList,
        statusMenuApp,
        handleMenuDateChange,
        handleChangeChild,
        refetch: fetchData
    };
};

// Composant IMS Day optimisé
const ImsDaySection = React.memo(({ imsDayInfo, i18n, router }) => {
    if (!imsDayInfo) return null;

    const formatTime = (time) => {
        if (!time) return '--:--';
        return format(time, i18n.language === 'en' ? 'hh:mm a' : 'H:mm');
    };

    return (
        <View style={styles.imsDayContainer}>
            <View style={styles.titleContainer}>
                <Text style={{ color: COLORS.gray, fontWeight: '600' }}>
                    {i18n.t('home.my_day_ims_title')}
                </Text>
                <Text style={styles.todayImsDay}>
                    {format(
                        imsDayInfo.theDate,
                        i18n.language === 'en' ? 'EEEE, MMMM dd yyyy' : 'EEEE, dd MMMM yyyy',
                        { locale: i18n.language === 'en' ? enUS : fr }
                    )}
                </Text>
            </View>

            <View style={styles.imsDayItem}>
                <View style={styles.imsDayItemText}>
                    <Text style={globalStyles.titleH2}>{i18n.t('home.nap_time')}</Text>
                    {imsDayInfo.sieste ? (
                        <>
                            <Text style={globalStyles.paragraph}>
                                {i18n.t('home.start_nap_time')} : {formatTime(imsDayInfo.timeDebutSieste)}
                            </Text>
                            <Text style={globalStyles.paragraph}>
                                {i18n.t('home.end_nap_time')} : {formatTime(imsDayInfo.timeFinSieste)}
                            </Text>
                        </>
                    ) : (
                        <Text style={globalStyles.paragraph}>{i18n.t('myDayAtIms.no_nap_time')}</Text>
                    )}
                </View>
                <View style={styles.imsDayItemImage}>
                    <Image source={IMAGES.sleepNatimeImage} contentFit="cover" style={styles.dayItemImageCover} />
                </View>
            </View>

            {imsDayInfo.observationCantine && (
                <View style={styles.imsDayItem}>
                    <View style={styles.imsDayItemText}>
                        <Text style={globalStyles.titleH2}>{i18n.t('home.how_i_ate')}</Text>
                        <Text style={globalStyles.paragraph}>
                            {i18n.language === 'en'
                                ? CANTEEN_OBSERVATION_EN[imsDayInfo.observationCantine] || imsDayInfo.observationCantine
                                : CANTEEN_OBSERVATION_FR[imsDayInfo.observationCantine] || imsDayInfo.observationCantine}
                        </Text>
                    </View>
                    <View style={styles.imsDayItemImage}>
                        <Image source={IMAGES.howIateImage} contentFit="cover" style={styles.dayItemImageCover} />
                    </View>
                </View>
            )}

            <View style={{ marginTop: 10, marginBottom: 10 }}>
                <FlatButton
                    title={i18n.t('home.more_details')}
                    fontWeight="400"
                    fontSize={16}
                    backgroundColor={COLORS.secondary}
                    paddingVertical={12}
                    borderRadius={20}
                    onPress={() => router.push('imsday')}
                    disabled={false}
                />
            </View>
        </View>
    );
});

// Composant Menu optimisé
const MenuSection = React.memo(({
                                    dayMenuDetails,
                                    menuYearLoading,
                                    statusMenuApp,
                                    date,
                                    workDaysNameList,
                                    onDateChange,
                                    i18n
                                }) => {
    return (
        <>
            <WeekCalendar
                date={date}
                onChange={onDateChange}
                workDayNameList={workDaysNameList}
            />
            {(dayMenuDetails?.length === 0 || statusMenuApp) && (
                <View style={{ marginTop: 15 }}>
                    {menuYearLoading ? (
                        <Loading size="small" />
                    ) : (
                        <Text style={{ textAlign: 'center', color: COLORS.black }}>
                            {i18n.t('home.empty_menu_year')}
                        </Text>
                    )}
                </View>
            )}
            {dayMenuDetails?.length > 0 && !statusMenuApp && (
                dayMenuDetails.map((detailsMenu, index) => (
                    <View style={globalStyles.detailsContainer} key={detailsMenu?.itemMenuCanteenJourId || index}>
                        <Card borderRaduis={10}>
                            <View style={globalStyles.imageMenu}>
                                <Image
                                    source={
                                        detailsMenu?.photo && detailsMenu.photo !== ''
                                            ? { uri: `${BASEURL_IMG}/${detailsMenu.photo}` }
                                            : IMAGES.photoMenu
                                    }
                                    contentFit="cover"
                                    style={globalStyles.imageMenuCover}
                                />
                            </View>
                            <View style={globalStyles.infoMenuContainer}>
                                <Text style={globalStyles.titleH2}>{detailsMenu.nom || 'Menu'}</Text>
                                {['entree', 'plat', 'dessert'].map((type) => (
                                    <View key={type} style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                        <Text style={globalStyles.entreeDish}>
                                            {i18n.t(`home.${type === 'entree' ? 'starter_dish' : type}`)} :{' '}
                                        </Text>
                                        <Text style={{ ...globalStyles.entreeDish, fontWeight: '700' }}>
                                            {detailsMenu[type] || '-'}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </Card>
                    </View>
                ))
            )}
        </>
    );
});

// Composant Rendez-vous optimisé
const AppointmentSection = React.memo(({ appointments, employeesClassList, selectedChild, selectedChildClass }) => {
    const { i18n } = useTranslation();

    if (!appointments || appointments.length === 0) {
        return (
            <View style={{ paddingVertical: 20 }}>
                <Text style={{ textAlign: 'center' }}>{i18n.t('appointment.empty_appointment')}</Text>
            </View>
        );
    }

    return (
        <ScrollView>
            <View style={styles.appointmentContainer}>
                {appointments.map((appointment) => {
                    let dayDate = toZonedTime(toDate(appointment.dateDebut), TIME_ZONE_ABIDJAN);
                    let dayDateFin = toZonedTime(toDate(appointment.dateFin), TIME_ZONE_ABIDJAN);
                    let startTime = format(dayDate, 'HH:mm');
                    let endTime = format(dayDateFin, 'HH:mm');
                    let employeesFind = employeesClassList?.find(
                        (emp) => emp.id === appointment.creneauRdvs?.[0]?.creneauRdvEmployees?.[0]?.employeeId
                    );

                    if (appointment.meetingType === 'PRESET' && appointment.creneauRdvs?.length > 0) {
                        for (const creneau of appointment.creneauRdvs) {
                            const enfantParent = creneau.creneauRdvEnfantParents?.[0];
                            if (enfantParent?.enfantId === selectedChild?.person?.id) {
                                dayDate = toZonedTime(toDate(enfantParent.dateDebut), TIME_ZONE_ABIDJAN);
                                dayDateFin = toZonedTime(toDate(enfantParent.dateFin), TIME_ZONE_ABIDJAN);
                                startTime = format(dayDate, 'HH:mm');
                                endTime = format(dayDateFin, 'HH:mm');
                                employeesFind = undefined;
                                break;
                            }
                        }
                    }

                    return (
                        <View style={styles.appointItemContainer} key={appointment.id}>
                            <HomeAppointment
                                appointment={appointment}
                                employeesFind={employeesFind}
                                dayDate={dayDate}
                                startTime={startTime}
                                endTime={endTime}
                                selectedChildClass={selectedChildClass}
                            />
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
});

// Composant principal
const HomeScreen = () => {
    const { i18n } = useTranslation();
    const dispatch = useDispatch();
    const router = useRouter();

    const { selectedChild, children } = useSelector((state: any) => state.child);
    const { employeesClassList } = useSelector((state: any) => state.employee);
    const { userToken } = useSelector((state: any) => state.user);

    const selectedChildClass = useMemo(() => selectedChild?.eleves?.[0]?.classe ?? null, [selectedChild]);

    const {
        loading,
        menuYearLoading,
        imsDayInfo,
        upcomingAppointHome,
        dayMenuDetails,
        date,
        workDaysNameList,
        statusMenuApp,
        handleMenuDateChange,
        refetch
    } = useHomeData(selectedChild, children, userToken, dispatch);

    if (loading) {
        return <Loading />;
    }

    return (
        <ViewThemed style={globalStyles.container}>
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={refetch} />
                }
            >
                <ImageBackground
                    source={IMAGES.backgroundImageApp}
                    contentFit="cover"
                    style={styles.backgroundImage}
                >
                    {/* IMS DAY */}
                    <View style={styles.imsDay}>
                        <Text style={globalStyles.title}>{i18n.t('home.my_day_ims')}</Text>
                        <ImsDaySection imsDayInfo={imsDayInfo} i18n={i18n} router={router} />
                    </View>

                    {/* MENU */}
                    <View style={globalStyles.dayMenuContainer}>
                        <Text style={globalStyles.title}>{i18n.t('home.menu_of_day')}</Text>
                        <MenuSection
                            dayMenuDetails={dayMenuDetails}
                            menuYearLoading={menuYearLoading}
                            statusMenuApp={statusMenuApp}
                            date={date}
                            workDaysNameList={workDaysNameList}
                            onDateChange={handleMenuDateChange}
                            i18n={i18n}
                        />
                    </View>

                    {/* APPOINTMENTS */}
                    <View style={styles.appointment}>
                        <Text style={globalStyles.title}>{i18n.t('home.incomming_appoint')}</Text>
                        <AppointmentSection
                            appointments={upcomingAppointHome}
                            employeesClassList={employeesClassList}
                            selectedChild={selectedChild}
                            selectedChildClass={selectedChildClass}
                        />
                    </View>
                </ImageBackground>
            </ScrollView>
        </ViewThemed>
    );
};

export default HomeScreen;

// Styles optimisés
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingBottom: 20,
    },
    backgroundImage: {
        flex: 1,
        paddingHorizontal: 10,
    },
    imsDay: {
        paddingTop: 20,
    },
    imsDayContainer: {
        borderRadius: 10,
        backgroundColor: COLORS.grayVeryLight,
        paddingVertical: 15,
        paddingHorizontal: 15,
    },
    titleContainer: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: 'wrap',
    },
    todayImsDay: {
        textAlign: 'center',
        color: COLORS.gray,
        marginBottom: 15,
        textTransform: 'capitalize',
        fontWeight: '600',
    },
    imsDayItem: {
        flexDirection: 'row',
        borderRadius: 10,
        padding: 10,
        backgroundColor: COLORS.white,
        marginBottom: 15,
    },
    imsDayItemText: {
        flex: 3,
        minHeight: 80,
    },
    imsDayItemImage: {
        flex: 1,
        alignItems: 'center',
        overflow: 'hidden',
    },
    dayItemImageCover: {
        width: '100%',
        height: 80,
    },
    appointment: {
        paddingTop: 20,
        paddingBottom: 20,
    },
    appointmentContainer: {
        paddingBottom: 10,
    },
    appointItemContainer: {
        flex: 1,
        marginBottom: 8,
    },
});
