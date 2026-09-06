// /pages/notification/index.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { format, toDate } from "date-fns";
import { enUS, fr } from "date-fns/locale";

// Components
import ViewThemed from "../../../components/ui/ViewThemed";
import SearchBox from "../../../components/ui/SearchBox";

// Services & Constants
import WsNotificationService from "../../../services/WSNotificationService";
import {
    initializeNotification,
    setNotificationList,
    setNotificationNumber
} from "../../../redux/features/notification/notificationSlide";
import { changeChild } from "../../../redux/features/child/childSlice";
import { setAlertMessageHeader, setDataNotification } from "../../../redux/features/alertmessage/alertMessageSlide";
import {
    COLORS,
    NOTIFICATION_MESSAGE_EN,
    NOTIFICATION_MESSAGE_FR,
    NOTIFICATION_NAGIVATION,
    ROUTES
} from "../../../constants";
import { globalStyles } from "../../../style/Global";
import {updateHeaderNotificationEveryWhere} from "../../../services/GeneralService";
import AppointmentService from "../../../services/AppointmentService";
import {setAppointmentDetailsInRedux} from "../../../redux/features/appointment/appointmentSlice";
import {router} from "expo-router";

// Types
interface Notification {
    id: string;
    title: string;
    dateSent: number;
    dateRead: string | null;
    message: string;
    common: {
        tag: string;
    };
    senderAction: string;
    roleSender: string;
    nameSender: string;
}

interface Child {
    id: string;
    person: {
        id: string;
        nom: string;
        prenom: string;
    };
    eleves?: Array<{ classe?: { id: number } }>;
}

// ===== Composants de filtre optimisés =====
const ReadNotReadNotificationFilter = React.memo(({
                                                      readStatus,
                                                      setReadStatus,
                                                      setFilterBoxShow
                                                  }: {
    readStatus: string;
    setReadStatus: (status: string) => void;
    setFilterBoxShow: (show: boolean) => void;
}) => {
    const { t } = useTranslation();

    const handleReadStatusChange = useCallback((status: string) => {
        setReadStatus(status);
        setFilterBoxShow(false);
    }, [setReadStatus, setFilterBoxShow]);

    const filters = useMemo(() => [
        { key: 'all', label: 'notification.all' },
        { key: 'read', label: 'notification.read' },
        { key: 'unread', label: 'notification.unread' }
    ], []);

    return (
        <View style={styles.filterGroup}>
            {filters.map(({ key, label }) => (
                <View
                    key={key}
                    style={readStatus === key ? styles.filterBtnActive : styles.filterBtn}
                >
                    <TouchableOpacity
                        style={styles.notificationStatus}
                        onPress={() => handleReadStatusChange(key)}
                    >
                        <Text style={{
                            color: readStatus === key ? COLORS.white : COLORS.blackLight,
                            fontSize: 12
                        }}>
                            {t(label)}
                        </Text>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );
});

const FilterNotificationType = React.memo(({
                                               filterType,
                                               setFilterType
                                           }: {
    filterType: string;
    setFilterType: (type: string) => void;
}) => {
    const filters = useMemo(() => [
        { key: 'rdv', label: 'Rendez-vous' },
        { key: 'miniclubs', label: 'Mini-clubs' },
        { key: 'messages', label: 'Message' }
    ], []);

    return (
        <View style={styles.filterTypeContainer}>
            {filters.map(({ key, label }) => (
                <TouchableOpacity
                    key={key}
                    style={styles.notificationStatus}
                    onPress={() => setFilterType(key)}
                >
                    <Text style={filterType === key ? styles.filterActive : styles.filter}>
                        {label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
});

// ===== Composant d'élément de notification optimisé =====
const NotificationItem = React.memo(({
                                         notification,
                                         onPress,
                                         language,
                                         children,
                                         t
                                     }: {
    notification: Notification;
    onPress: (notification: Notification) => void;
    language: string;
    children: Child[];
    t: (key: string) => string;
}) => {
    const notificationMsg = useMemo(() => {
        const messages = language === 'en' ? NOTIFICATION_MESSAGE_EN : NOTIFICATION_MESSAGE_FR;
        return messages.find(
            (notif: any) => notif?.tag === notification?.common?.tag &&
                notif.action === notification?.senderAction?.toLowerCase()
        );
    }, [notification, language]);

    const notificationNavigation = useMemo(() =>
            NOTIFICATION_NAGIVATION.find((notif: any) => notif.tag === notification?.common?.tag),
        [notification]
    );

    const senderFrom = useMemo(() => {
        if (notification?.roleSender === 'TEACHER') {
            return notification?.nameSender || '';
        }
        else if (notification?.roleSender === 'ADMIN') {
            return t('notification.from_admin');
        }
        return t('notification.from_rdv');
    }, [notification, t]);

    const notificationDate = useMemo(() => toDate(notification.dateSent), [notification.dateSent]);

    const formattedDate = useMemo(() => {
        const dateObj = notificationDate;
        if (language === 'en') {
            return `${format(dateObj, 'MMM', { locale: enUS })} ${String(dateObj.getDate()).padStart(2, '0')}, ${format(dateObj, 'yyyy', { locale: enUS })}`;
        }
        return `${String(dateObj.getDate()).padStart(2, '0')} ${format(dateObj, 'MMM', { locale: fr })} ${format(dateObj, 'yyyy', { locale: fr })}`;
    }, [notificationDate, language]);

    return (
        <TouchableOpacity
            activeOpacity={0.5}
            onPress={() => onPress(notification)}
            style={{...styles.notificationItem, backgroundColor: notification.dateRead ? COLORS.grayVeryLight : COLORS.secondaryVeryLight}}
        >
            <View>
                <Text style={styles.notificationTitle}>
                    {notification?.title}
                </Text>
                <Text style={styles.notificationSender}>
                    {senderFrom}
                </Text>
                <Text style={styles.notificationMeta}>
                    {notificationMsg?.value} | {formattedDate}
                </Text>
            </View>
        </TouchableOpacity>
    );
});

const notificationToRoute = (pathname: string, data:object) => {
    // Navigation vers la liste des rendez-vous
    setTimeout(() => {
        router.push({
            pathname: pathname,
            params: {
                data: JSON.stringify(data?.id)
            }
        });
    }, 400);
}
// ===== Composant principal =====
const Notification = () => {
    const { children } = useSelector((state: any) => state.child);
    const { user } = useSelector((state: any) => state.user);
    const { notificationList } = useSelector((state: any) => state.notification);
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();

    // États
    const [search, setSearch] = useState('');
    const [readStatus, setReadStatus] = useState('all');
    const [filterType, setFilterType] = useState('');
    const [filterBoxShow, setFilterBoxShow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // ===== Callbacks optimisés =====
    const handleClearSearch = useCallback(() => setSearch(''), []);

    const handleFilterBoxShow = useCallback(() => {
        setFilterBoxShow(prev => !prev);
        setFilterType('');
    }, []);

    const handleChangeChild = useCallback((childSelectedId: string) => {
        const findChild = children.find((child: Child) => child?.id === childSelectedId);
        if (findChild) {
            dispatch(changeChild(findChild));
        }
    }, [children, dispatch]);

    const handleNotificationNavigation = useCallback(async (notification: Notification) => {
        if (!user?.uuid) return;

        try {
            setIsLoading(true);
            const notificationId = notification?.id;
            const notificationParseData = {
                ...notification,
                message: JSON.parse(notification.message),
            };

            await WsNotificationService.updateNotification(user, notificationId);
            await updateHeaderNotificationEveryWhere(user.uuid, dispatch);
            /*const responseList = await WsNotificationService.getAllNotification(user.uuid);
            const allNotification = WsNotificationService.getRecentNotificationList(responseList);*/

            /*dispatch(setNotificationNumber(0));
            dispatch(setNotificationList([]));

            if (allNotification.length > 0) {
                dispatch(setNotificationNumber(allNotification.length));
                dispatch(setNotificationList(allNotification));
            }*/

            // Navigation selon le type de notification
            await handleNavigationByType(notificationParseData);
        } catch (error) {
            console.log('Navigation error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, children, dispatch]);

    const handleNavigationByType = useCallback(async (notification: any) => {
        const tag = notification?.common?.tag;
        const message = notification?.message;
        const childId = message?.enfantId;

        // Gestion du changement d'enfant
        if (childId && childId !== 0 && childId !== null) {
            handleChangeChild(childId);
        }

        // Navigation selon le tag
        switch (tag) {
            case 'rdv':
                await handleRdvNavigation(notification, message);
                break;
            case 'alertmessage':
                dispatch(setDataNotification(notification));
                dispatch(setAlertMessageHeader(true));
                break;
            case 'sondage':
                await handleSurveyNavigation(message);
                break;
            case 'documents':
            case 'miniclubs':
            case 'imsday':
            case 'message_center':
                // Navigation vers les écrans correspondants
                break;
            default:
                break;
        }
    }, [handleChangeChild, dispatch]);

    const handleRdvNavigation = useCallback(async (notification: any, message: any) => {

        if (message?.meetingType === 'NORMAL') {
            const creneauRdvEnfantParents = message?.creneauRdvs?.[0]?.creneauRdvEnfantParents;
            if (creneauRdvEnfantParents?.length > 0 && creneauRdvEnfantParents[0]?.enfantId) {
                handleChangeChild(creneauRdvEnfantParents[0]?.enfantId);
            }

            const appointmentDetails = await AppointmentService.getAppointmentById(notification?.message?.id);
            let pathname = '/(drawer)/(tabs)/appointment/all-appointment';
            if(appointmentDetails !== undefined && appointmentDetails !== null){
                dispatch(setAppointmentDetailsInRedux(appointmentDetails));
                pathname = '/pages/appointment';
            }

            notificationToRoute(pathname, appointmentDetails);
        }
        else if (message?.meetingType === 'PRESET' && message?.classeId) {
            const childWithClass = children.find(
                (child: Child) => child?.eleves?.[0]?.classe?.id === message.classeId
            );
            if (childWithClass) {
                handleChangeChild(childWithClass.id);
            }

            const appointmentDetails = await AppointmentService.getAppointmentById(notification?.message?.id);
            let pathname = '/(drawer)/(tabs)/appointment/preset-appointment';
            if(appointmentDetails !== undefined && appointmentDetails !== null){
                dispatch(setAppointmentDetailsInRedux(appointmentDetails));
                pathname = '/pages/appointment/preset-appointment-details';
            }

            notificationToRoute(pathname, appointmentDetails);
        }


    }, [children, handleChangeChild]);

    const handleSurveyNavigation = useCallback(async (message: any) => {
        if (message?.classes) {
            const classrooms = message.classes.split(',').map((id: string) => parseInt(id));
            const childWithClass = children.find(
                (child: Child) => classrooms.includes(child?.eleves?.[0]?.classe?.id)
            );
            if (childWithClass) {
                handleChangeChild(String(childWithClass.id));
            }
        }
    }, [children, handleChangeChild]);

    const handleClearNotification = useCallback(async () => {
        if (!user?.uuid || notificationList.length === 0) return;

        try {
            setIsLoading(true);
            await WsNotificationService.deleteAllNotification(user.uuid);
            dispatch(initializeNotification());
        } catch (error) {
            console.log('Clear notifications error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, notificationList, dispatch]);

    // ===== Filtrage des notifications =====
    const filteredNotifications = useMemo(() => {
        let filtered = [...notificationList];

        // Filtre de recherche
        if (search.trim()) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter((notif: Notification) =>
                notif.title?.toLowerCase().includes(searchLower)
            );
        }

        // Filtre de statut de lecture
        if (readStatus !== 'all') {
            filtered = filtered.filter((notif: Notification) =>
                readStatus === 'read' ? notif.dateRead !== null : notif.dateRead === null
            );
        }

        // Filtre par type
        if (filterType) {
            filtered = filtered.filter((notif: Notification) =>
                notif.common?.tag === filterType
            );
        }

        return filtered;
    }, [notificationList, search, readStatus, filterType]);

    // ===== Rendu d'élément de liste =====
    const renderNotificationItem = useCallback(({ item }: { item: Notification }) => (
        <NotificationItem
            notification={item}
            onPress={handleNotificationNavigation}
            language={i18n.language}
            children={children}
            t={t}
        />
    ), [handleNotificationNavigation, i18n.language, children, t]);

    // ===== Clé d'élément de liste =====
    const keyExtractor = useCallback((item: Notification) => item.id, []);

    // ===== Chargement initial =====
    useEffect(() => {
        return () => {
            // Cleanup si nécessaire
        };
    }, []);

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ViewThemed style={globalStyles.container}>
                <View style={styles.container}>
                    {/* Barre de recherche */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchBar}>
                            <TextInput
                                style={styles.input}
                                placeholder={t('allAppointment.search')}
                                placeholderTextColor={COLORS.gray}
                                value={search}
                                onChangeText={setSearch}
                                onSubmitEditing={() => {}}
                                inputMode="search"
                                returnKeyType="search"
                            />
                            {search.length > 0 && (
                                <TouchableOpacity onPress={handleClearSearch}>
                                    <MaterialIcons name="close" size={18} color={COLORS.gray} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Filtres */}
                    <View style={styles.filtersContainer}>
                        <View style={styles.filtersRow}>
                            <ReadNotReadNotificationFilter
                                readStatus={readStatus}
                                setReadStatus={setReadStatus}
                                setFilterBoxShow={setFilterBoxShow}
                            />

                            <View style={styles.filterButtonWrapper}>
                                <View style={[
                                    styles.filterBtn,
                                    filterBoxShow && styles.filterBtnActive
                                ]}>
                                    <TouchableOpacity
                                        style={styles.filterButtonContent}
                                        onPress={handleFilterBoxShow}
                                    >
                                        <MaterialIcons
                                            name="filter-list"
                                            size={16}
                                            color={filterBoxShow ? COLORS.white : COLORS.blackLight}
                                        />
                                        <Text style={{
                                            color: filterBoxShow ? COLORS.white : COLORS.blackLight,
                                            fontSize: 12
                                        }}>
                                            Filtrer par
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Filtres par type */}
                        {filterBoxShow && (
                            <View style={styles.filterTypeWrapper}>
                                <FilterNotificationType
                                    filterType={filterType}
                                    setFilterType={setFilterType}
                                />
                            </View>
                        )}
                    </View>

                    {/* Liste des notifications */}
                    <View style={styles.modalContent}>
                        {isLoading ? (
                            <View style={styles.loaderContainer}>
                                <ActivityIndicator size="large" color={COLORS.secondary} />
                            </View>
                        ) : filteredNotifications.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>
                                    {search.trim() || filterType || readStatus !== 'all'
                                        ? t('notification.empty_notification')
                                        : t('notification.empty_notification')}
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={filteredNotifications}
                                renderItem={renderNotificationItem}
                                keyExtractor={keyExtractor}
                                contentContainerStyle={styles.notificationContent}
                                showsVerticalScrollIndicator={false}
                                initialNumToRender={15}
                                maxToRenderPerBatch={10}
                                windowSize={5}
                            />
                        )}
                    </View>

                    {/* Bouton de suppression - visible uniquement s'il y a des notifications */}
                    {/*{notificationList.length > 0 && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={handleClearNotification}
                            disabled={isLoading}
                        >
                            <Text style={styles.clearButtonText}>
                                {t('notification.clear_all')}
                            </Text>
                        </TouchableOpacity>
                    )}*/}
                </View>
            </ViewThemed>
        </TouchableWithoutFeedback>
    );
};

export default Notification;

// ===== Styles =====
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        padding: 10,
        paddingHorizontal: 15,
    },
    searchBar: {
        flexDirection: 'row',
        marginTop: 10,
        padding: 6,
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor: COLORS.grayVeryLight,
        borderRadius: 6,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        padding: 3,
        fontSize: 16,
        borderRadius: 0,
        color: COLORS.gray,
        marginLeft: 4,
    },
    filtersContainer: {
        paddingVertical: 0,
        paddingHorizontal: 15,
    },
    filtersRow: {
        flexDirection: 'row',
        paddingVertical: 5,
    },
    filterGroup: {
        gap: 10,
        flexDirection: 'row',
    },
    filterButtonWrapper: {
        flex: 1,
        alignItems: 'flex-end',
    },
    filterButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
        gap: 4,
    },
    filterTypeWrapper: {
        paddingVertical: 5,
    },
    filterTypeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    modalContent: {
        flex: 1,
        padding: 8,
        paddingTop: 20,
    },
    notificationContent: {
        paddingHorizontal: 10,
        paddingBottom: 20,
    },
    notificationItem: {
        borderBottomColor: COLORS.grayVeryLight,
        borderBottomWidth: 1,
        paddingBottom: 10,
        marginBottom: 15,
        paddingHorizontal: 10,
        paddingVertical: 10
    },
    notificationTitle: {
        color: COLORS.gray,
        fontWeight: '600',
    },
    notificationSender: {
        color: COLORS.gray,
    },
    notificationMeta: {
        color: COLORS.gray,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.grayVeryLight,
        paddingHorizontal: 7,
        borderRadius: 5,
        padding: 4,
    },
    filterBtnActive: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 7,
        borderRadius: 5,
        padding: 4,
    },
    notificationStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 2,
    },
    filter: {
        marginVertical: 5,
        padding: 4,
        paddingHorizontal: 7,
        fontSize: 12,
        fontWeight: '400',
        borderRadius: 5,
        color: COLORS.blackLight,
        backgroundColor: COLORS.grayVeryLight,
        marginRight: 10,
    },
    filterActive: {
        marginVertical: 5,
        padding: 4,
        paddingHorizontal: 7,
        fontSize: 12,
        fontWeight: '400',
        borderRadius: 5,
        color: COLORS.secondary,
        backgroundColor: COLORS.secondaryLight,
        marginRight: 10,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.gray,
        textAlign: 'center',
    },
    clearButton: {
        backgroundColor: COLORS.red,
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    clearButtonText: {
        color: COLORS.white,
        fontWeight: '600',
    },
});
