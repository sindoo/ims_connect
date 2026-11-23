// /pages/notification/index.tsx
import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableWithoutFeedback,
    Keyboard,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { Snackbar } from "react-native-paper";
import { format, toDate } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import debounce from 'lodash/debounce';

// Components
import ViewThemed from "../../../components/ui/ViewThemed";

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
    NOTIFICATION_MESSAGE_FR
} from "../../../constants";
import { globalStyles } from "../../../style/Global";
import {updateHeaderNotificationEveryWhere} from "../../../services/GeneralService";
import AppointmentService from "../../../services/AppointmentService";
import ConversationService from "../../../services/ConversationService";
import {setAppointmentDetailsInRedux} from "../../../redux/features/appointment/appointmentSlice";
import {router} from "expo-router";

import {captureFeatureError} from "../../../services/sentryService";
import {apiErrorMessage} from '../../../api/ApiManager';
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

// Handler inerte pour le champ de recherche (soumission désactivée) :
// hoisté hors du composant pour ne pas recréer cette fonction à chaque
// rendu.
const NOOP = () => {};

// Durée d'affichage du Snackbar (confirmation de suppression comme
// feedback de succès/erreur) - même principe que dans MiniClub.tsx.
const SNACKBAR_DURATION = 4000;

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
ReadNotReadNotificationFilter.displayName = 'ReadNotReadNotificationFilter';

const FilterNotificationType = React.memo(({
                                               filterType,
                                               setFilterType
                                           }: {
    filterType: string;
    setFilterType: (type: string) => void;
}) => {
    // ✅ Bug corrigé : ce composant utilisait le "t" importé directement
    // depuis "i18next" (import {t} from "i18next"), au lieu du "t" du hook
    // useTranslation() de ce composant. Les libellés étaient donc calculés
    // une seule fois (via useMemo avec des dépendances vides) avec la
    // langue active au moment du tout premier rendu de l'app, et ne se
    // mettaient jamais à jour si l'utilisateur changeait de langue
    // ensuite. On mémorise maintenant seulement les clés (stables), et on
    // traduit au rendu avec le "t" réactif du hook - comme le fait déjà
    // ReadNotReadNotificationFilter juste au-dessus.
    const { t } = useTranslation();

    const filterKeys = useMemo(() => [
        { key: 'rdv', label: 'notification.rdv' },
        { key: 'miniclubs', label: 'notification.mini_club' },
        { key: 'message_center', label: 'notification.message' },
        { key: 'imsday', label: 'notification.imsday' },
        { key: 'alertmessage', label: 'notification.alertmessage' },
        { key: 'sondage', label: 'notification.survey' },
        { key: 'documents', label: 'notification.school_document' },
    ], []);

    return (
        <View style={styles.filterTypeContainer}>
            {filterKeys.map(({ key, label }) => (
                <TouchableOpacity
                    key={key}
                    style={styles.notificationStatus}
                    onPress={() => setFilterType(key)}
                >
                    <Text style={filterType === key ? styles.filterActive : styles.filter}>
                        {t(label)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
});
FilterNotificationType.displayName = 'FilterNotificationType';

// ===== Composant d'élément de notification optimisé =====
const NotificationItem = React.memo(({
                                         notification,
                                         onPress,
                                         onDelete,
                                         isDeleting,
                                         isNavigating,
                                         language,
                                         childrenList,
                                         t
                                     }: {
    notification: Notification;
    onPress: (notification: Notification) => void;
    onDelete: (notification: Notification) => void;
    isDeleting: boolean;
    isNavigating: boolean;
    language: string;
    childrenList: Child[];
    t: (key: string) => string;
}) => {
    const notificationMsg = useMemo(() => {
        const messages = language === 'en' ? NOTIFICATION_MESSAGE_EN : NOTIFICATION_MESSAGE_FR;
        return messages.find(
            (notif: any) => notif?.tag === notification?.common?.tag &&
                notif.action === notification?.senderAction?.toLowerCase()
        );
    }, [notification, language]);

    const senderFrom = useMemo(() => {
        if (notification?.roleSender === 'TEACHER') {
            return notification?.nameSender || '';
        }
        else if (notification?.roleSender === 'ADMIN') {
            return t('notification.from_admin');
        }
        return t('notification.from_rdv');
    }, [notification, t]);

    // ✅ Nom de l'enfant concerné par la notification, selon le type de contenu
    const childName = useMemo(() => {
        let message: any = null;
        try {
            message = typeof notification.message === 'string' ? JSON.parse(notification.message) : notification.message;
        } catch {
            return '';
        }

        const fullName = (child: any) => (child?.person?.prenom ?? '').trim();
        const childId =
            message?.enfantId ??
            message?.space?.enfantId ??
            message?.creneauRdvs?.[0]?.creneauRdvEnfantParents?.[0]?.enfantId;

        if (childId) {
            const found = (childrenList || []).find((child: any) => child?.person?.id === childId);
            if (found) return fullName(found);
        }

        // Sondage destiné à des classes : enfants inscrits dans ces classes
        if (typeof message?.classes === 'string') {
            const classIds = message.classes.split(',').map((id: string) => parseInt(id));
            const names = (childrenList || [])
                .filter((child: any) => classIds.includes(child?.eleves?.[0]?.classe?.id))
                .map(fullName);
            if (names.length > 0) return names.join(', ');
        }

        // Alerte : `nom` contient le nom complet de l'enfant (on n'en garde que le prénom)
        if (notification?.common?.tag === 'alertmessage' && typeof message?.nom === 'string') {
            const found = (childrenList || []).find(
                (child: any) => `${child?.person?.prenom ?? ''} ${child?.person?.nom ?? ''}`.trim() === message.nom.trim(),
            );
            return found ? fullName(found) : message.nom.trim().split(' ')[0];
        }
        return '';
    }, [notification, childrenList]);

    const notificationDate = useMemo(() => toDate(notification.dateSent), [notification.dateSent]);

    const formattedDate = useMemo(() => {
        const dateObj = notificationDate;
        if (language === 'en') {
            return `${format(dateObj, 'MMM', { locale: enUS })} ${String(dateObj.getDate()).padStart(2, '0')}, ${format(dateObj, 'yyyy', { locale: enUS })}`;
        }
        return `${String(dateObj.getDate()).padStart(2, '0')} ${format(dateObj, 'MMM', { locale: fr })} ${format(dateObj, 'yyyy', { locale: fr })}`;
    }, [notificationDate, language]);

    // ✅ Style hoisté (dépend seulement de dateRead/isNavigating) au lieu
    // de recalculer un nouvel objet "{...styles.notificationItem, ...}" à
    // chaque rendu. L'élément s'estompe légèrement pendant sa propre
    // navigation, sans bloquer le reste de la liste (voir plus bas :
    // "isLoading" ne masque plus toute la liste à chaque tap).
    const itemStyle = useMemo(() => ([
        styles.notificationItem,
        { backgroundColor: notification.dateRead ? COLORS.grayVeryLight : COLORS.secondaryVeryLight },
        isNavigating && styles.notificationItemNavigating,
    ]), [notification.dateRead, isNavigating]);

    const handlePress = useCallback(() => {
        onPress(notification);
    }, [onPress, notification]);

    // ✅ Branché sur la vraie fonction de suppression (passée en prop
    // depuis le composant parent). Auparavant ce bouton appelait
    // "deleteOneNotification(notification)", une fonction qui n'existe
    // nulle part dans ce fichier : cliquer dessus provoquait un crash
    // (ReferenceError) au lieu de supprimer quoi que ce soit.
    const handleDeletePress = useCallback(() => {
        onDelete(notification);
    }, [onDelete, notification]);

    return (
        <TouchableOpacity
            activeOpacity={0.5}
            onPress={handlePress}
            style={itemStyle}
            disabled={isNavigating}
        >
            <View style={styles.itemRow}>
                <View style={styles.itemTextWrapper}>
                    <Text style={styles.notificationTitle}>
                        {notification?.title}
                    </Text>
                    <Text style={styles.notificationSender}>
                        {senderFrom}
                    </Text>
                    <Text style={styles.notificationMeta}>
                        {notificationMsg?.value} | {formattedDate}
                    </Text>
                    {!!childName && (
                        <View style={styles.childBadge}>
                            <MaterialIcons name="child-care" size={12} color="#5B9FD4" />
                            <Text style={styles.childBadgeText} numberOfLines={1}>{childName}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.deleteButtonWrapper}>
                    {isNavigating ? (
                        <View style={styles.deleteButton}>
                            <ActivityIndicator size="small" color={COLORS.gray} />
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={handleDeletePress}
                            activeOpacity={0.6}
                            style={styles.deleteButton}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <ActivityIndicator size="small" color={COLORS.gray} />
                            ) : (
                                <MaterialIcons name="delete-outline" size={24} color={COLORS.gray} />
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
});
NotificationItem.displayName = 'NotificationItem';

// Petit délai avant la navigation (laisse le temps à la modale/au clavier
// de se refermer visuellement). Retourne une Promise pour pouvoir
// l'attendre avec "await" au lieu d'un setTimeout "fire-and-forget".
const NAVIGATION_DELAY_MS = 400;
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ✅ Convertie en fonction async qui attend réellement le délai avant de
// naviguer (voir handleNotificationNavigation plus bas : c'est ce qui
// corrige le flash "loading -> contenu -> redirection").
const notificationToRoute = async (pathname: string, data: object) => {
    // Navigation vers la liste des rendez-vous
    await delay(NAVIGATION_DELAY_MS);
    router.push({
        pathname: pathname,
        params: {
            data: JSON.stringify(data?.id)
        }
    });
}
// ===== Composant principal =====
const Notification = () => {
    const { children } = useSelector((state: any) => state.child);
    const { user } = useSelector((state: any) => state.user);
    const { notificationList, notificationNumber } = useSelector((state: any) => state.notification);
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();

    // États
    const [search, setSearch] = useState('');
    // ✅ Recherche débouncée, comme dans MiniClub.tsx : "search" reste la
    // valeur affichée dans le champ (réactive à chaque frappe), mais le
    // filtrage réel de la liste (filteredNotifications plus bas) attend
    // "debouncedSearch", qui ne se met à jour que 300ms après la dernière
    // frappe. Sans ça, chaque caractère tapé relançait immédiatement le
    // filtrage sur toute la liste de notifications, ce qui pouvait donner
    // une saisie saccadée avec une liste un peu longue.
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [readStatus, setReadStatus] = useState('all');
    const [filterType, setFilterType] = useState('');
    const [filterBoxShow, setFilterBoxShow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // ✅ Un simple ensemble d'ids en cours de suppression : seul l'élément
    // concerné affiche un indicateur, au lieu de basculer "isLoading" (qui
    // masquerait toute la liste derrière un <ActivityIndicator/> plein
    // écran pour la suppression d'une seule notification).
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    // ✅ Même principe pour la navigation déclenchée par un tap sur une
    // notification : auparavant "isLoading" masquait TOUTE la liste
    // derrière un spinner plein écran à chaque tap (le temps de marquer la
    // notification comme lue, rafraîchir le compteur d'en-tête, puis
    // naviguer). Seul l'élément tapé affiche maintenant un indicateur, le
    // reste de la liste reste visible et utilisable.
    const [navigatingIds, setNavigatingIds] = useState<Set<string>>(new Set());

    // États pour le Snackbar (confirmation de suppression + feedback),
    // comme dans MiniClub.tsx.
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'confirm'>('success');
    const [snackbarAction, setSnackbarAction] = useState<{ label: string; onPress: () => void } | null>(null);

    // ===== Callbacks optimisés =====
    // Fonction de recherche débouncée : ne recalcule "debouncedSearch"
    // (utilisée pour le filtrage) que 300ms après la dernière frappe.
    const handleSearch = useCallback(
        debounce((searchTerm: string) => {
            setDebouncedSearch(searchTerm);
        }, 300),
        []
    );

    // Nettoie le debounce en attente au démontage du composant.
    useEffect(() => {
        return () => {
            handleSearch.cancel();
        };
    }, [handleSearch]);

    const handleSearchChange = useCallback((text: string) => {
        setSearch(text);
        handleSearch(text);
    }, [handleSearch]);

    const handleClearSearch = useCallback(() => {
        handleSearch.cancel();
        setSearch('');
        setDebouncedSearch('');
    }, [handleSearch]);

    const handleFilterBoxShow = useCallback(() => {
        setFilterBoxShow(prev => !prev);
        setFilterType('');
    }, []);

    // Les notifications donnent selon les cas l'id de l'enfant ou celui de sa
    // personne (enfantId) : on accepte les deux, comme l'affichage du nom.
    const handleChangeChild = useCallback((childSelectedId: string | number) => {
        if (childSelectedId == null) return;
        const findChild = children.find((child: Child) =>
            String(child?.id) === String(childSelectedId)
            || String((child as any)?.person?.id) === String(childSelectedId)
        );
        if (findChild) {
            dispatch(changeChild(findChild));
        }
    }, [children, dispatch]);

    const handleNotificationNavigation = useCallback(async (notification: Notification) => {
        if (!user?.uuid || !notification?.id) return;

        setNavigatingIds(prev => {
            if (prev.has(notification.id)) return prev;
            const next = new Set(prev);
            next.add(notification.id);
            return next;
        });

        try {
            const notificationId = notification.id;
            const notificationParseData = {
                ...notification,
                message: JSON.parse(notification.message),
            };

            // ✅ Le marquage "lu" est attendu (il doit être confirmé avant de
            // considérer l'action terminée), mais le rafraîchissement du
            // compteur de notifications dans l'en-tête (visible ailleurs
            // dans l'app) n'a pas besoin de bloquer la navigation : on le
            // lance sans l'attendre ("fire and forget"), ce qui retire un
            // aller-retour réseau complet du délai ressenti avant que
            // l'écran ne redirige.
            await WsNotificationService.updateNotification(user, notificationId);
            updateHeaderNotificationEveryWhere(user.uuid, dispatch).catch((error: any) => {
                console.log('Header notification refresh error:', error);
            });

            // Navigation selon le type de notification
            await handleNavigationByType(notificationParseData);
        } catch (error) {
            console.log('Navigation error:', error);
        } finally {
            setNavigatingIds(prev => {
                if (!prev.has(notification.id)) return prev;
                const next = new Set(prev);
                next.delete(notification.id);
                return next;
            });
        }
    }, [user, children, dispatch]);

    // Affiche un Snackbar de feedback simple (succès/erreur), sans action -
    // même principe que dans MiniClub.tsx.
    const showSnackbar = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setSnackbarAction(null);
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);
    }, []);

    // ✅ Suppression effective, déclenchée uniquement après confirmation
    // (appui sur le bouton d'action du Snackbar de confirmation, voir
    // requestDeleteNotification plus bas). Appelle le service (déjà
    // existant côté WSNotificationService mais jamais utilisé ici), retire
    // ensuite la notification de la liste Redux, et décrémente le compteur
    // de notifications non lues si celle supprimée ne l'était pas encore.
    const confirmDeleteNotification = useCallback(async (notification: Notification) => {
        if (!user?.uuid || !notification?.id) return;

        setSnackbarVisible(false);

        setDeletingIds(prev => {
            if (prev.has(notification.id)) return prev;
            const next = new Set(prev);
            next.add(notification.id);
            return next;
        });

        try {
            await WsNotificationService.deleteOneNotification(notification.id, user.uuid);

            dispatch(setNotificationList(
                notificationList.filter((notif: Notification) => notif.id !== notification.id)
            ));

            if (notification.dateRead === null) {
                dispatch(setNotificationNumber(Math.max(0, (notificationNumber || 0) - 1)));
            }

            showSnackbar(t('notification.delete_success'), 'success');
        } catch (error) {
            console.log('Delete notification error:', error);
            showSnackbar(apiErrorMessage(error, t('notification.delete_error')), 'error');
        } finally {
            setDeletingIds(prev => {
                if (!prev.has(notification.id)) return prev;
                const next = new Set(prev);
                next.delete(notification.id);
                return next;
            });
        }
    }, [user, notificationList, notificationNumber, dispatch, showSnackbar, t]);

    // ✅ Appui sur l'icône "delete-outline" : au lieu de supprimer
    // immédiatement, affiche un Snackbar react-native-paper de confirmation
    // (comme dans MiniClub.tsx) avec un bouton d'action à presser pour
    // confirmer. Sans cet appui, rien n'est supprimé - le Snackbar se
    // referme simplement après son délai.
    const requestDeleteNotification = useCallback((notification: Notification) => {
        setSnackbarMessage(t('notification.confirm_delete'));
        setSnackbarType('confirm');
        setSnackbarAction({
            label: t('notification.delete'),
            onPress: () => confirmDeleteNotification(notification),
        });
        setSnackbarVisible(true);
    }, [t, confirmDeleteNotification]);

    const handleNavigationByType = useCallback(async (notification: any) => {
        const tag = notification?.common?.tag;
        // Le message peut arriver sous forme de chaîne JSON (comme le gère déjà l'affichage)
        let message: any = notification?.message;
        if (typeof message === 'string') {
            try {
                message = JSON.parse(message);
            } catch {
                message = null;
            }
        }
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
                await handleDocumentNavigation(message);
                break;
            case 'miniclubs':
                await handleMiniClubNavigation(message);
                break;
            case 'imsday':
                await handleImsDayNavigation(message);
                break;
            case 'message_center':
                await handleMessageCenterNavigation(message);
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

            await notificationToRoute(pathname, appointmentDetails);
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

            await notificationToRoute(pathname, appointmentDetails);
        }

    }, [children, handleChangeChild]);

    const handleSurveyNavigation = useCallback(async (message: any) => {
        try {
            if (message?.classes) {
                const classrooms = message.classes.split(',').map((id: string) => parseInt(id));
                const childWithClass = children.find(
                    (child: Child) => classrooms.includes(child?.eleves?.[0]?.classe?.id)
                );

                if (childWithClass) {
                    handleChangeChild(String(childWithClass.id));
                    let pathname = '/(drawer)/(tabs)/more/survey';
                    await delay(NAVIGATION_DELAY_MS);
                    router.push(pathname);
                }
            }
        }
        catch (error) {
            console.error("[NotificationHeader]: Error occurred on Survey router redirection", error)
        }
    }, [children, handleChangeChild]);

    const handleDocumentNavigation = useCallback(async (message: any) => {
        try {
            if (message.enfantId) {
                handleChangeChild(message.enfantId);

                let pathname = '/(drawer)/(tabs)/more/document';
                await delay(NAVIGATION_DELAY_MS);
                router.push(pathname);
            }
        }
        catch (error) {
            console.error("[NotificationHeader]: Error occurred on Document router redirection", error)
        }
    }, [handleChangeChild]);


    const handleMiniClubNavigation = useCallback(async (message: any) => {
        try {
            const childWithClass = children.find(child => child?.eleves[0].classe .id === message?.classeMiniClubs[0]?.classeId);

            if (childWithClass) {
                const childSelectedID = childWithClass?.enfantParents[0]?.enfantId;
                handleChangeChild(childSelectedID);

                const pathname = '/pages/more/club';
                await delay(NAVIGATION_DELAY_MS);
                router.push({
                    pathname: pathname,
                    params: {
                        miniClubId: JSON.stringify(message?.id),
                        registrationStatus: 0,
                    }
                });
            }
        }
        catch (error) {
            console.error("[NotificationHeader]: Error occurred on Miniclub router redirection", error)
        }
    }, [children, handleChangeChild]);

    const handleImsDayNavigation = useCallback(async (message: any) => {
        try {
            if(message) {
                const childSelectedID = message?.enfantId;
                handleChangeChild(childSelectedID);

                const pathname = '/(drawer)/(tabs)/imsday';
                await delay(NAVIGATION_DELAY_MS);
                router.push({
                    pathname: pathname,
                    params: {
                        // Id de la journée IMS : l'écran affiche cette journée
                        imsDayId: message?.id != null ? String(message.id) : undefined,
                        // Rend chaque ouverture unique (même notification touchée deux fois)
                        openedAt: String(Date.now()),
                    }
                });
            }
        }
        catch (error) {
            console.error("[NotificationHeader]: Error occurred on IMS Day router redirection", error)
        }
    }, [children, handleChangeChild]);

    const handleMessageCenterNavigation = useCallback(async (message: any) => {
        try {
            // Deux formes de notification : la conversation (message.space) ou
            // un message (filDiscussionId + enfantId, sans objet space).
            let space = message?.space;
            const threadId = space?.id ?? message?.filDiscussionId;
            const enfantId = space?.enfantId ?? message?.enfantId;

            // Sans conversation identifiable, on prévient l'utilisateur au lieu
            // de ne rien faire, et on remonte la structure reçue à Sentry.
            if (threadId == null) {
                showSnackbar(t('notification.conversation_not_found'), 'error');
                captureFeatureError('notification.message_center.no_space', null, {
                    messageType: typeof message,
                    messageKeys: message && typeof message === 'object' ? Object.keys(message).join(',') : null,
                });
                return;
            }

            handleChangeChild(enfantId);

            // Sans objet space, on récupère la conversation pour l'écran Message.
            if (!space) {
                const child = children.find((c: Child) => String(c?.id) === String(enfantId));
                space = await ConversationService.getDiscussionById(threadId, user, child);
                if (!space) {
                    showSnackbar(t('notification.conversation_not_found'), 'error');
                    captureFeatureError('notification.message_center.thread_not_found', null, {
                        threadId: String(threadId),
                        enfantId: enfantId != null ? String(enfantId) : null,
                    });
                    return;
                }
            }

            const pathname = '/pages/message';
            await delay(NAVIGATION_DELAY_MS);
            router.push({
                pathname: pathname,
                params: {
                    discussionThreadId: String(threadId),
                    // Conversation de secours si elle n'est pas dans la liste en mémoire
                    space: JSON.stringify(space),
                }
            });
        }
        catch (error) {
            console.error("[NotificationHeader]: Error occurred on Message Center router redirection", error)
            showSnackbar(t('notification.conversation_not_found'), 'error');
            captureFeatureError('notification.message_center.navigation', error, {});
        }
    }, [children, user, handleChangeChild, showSnackbar, t]);


    // ✅ Suppression effective de toutes les notifications, déclenchée
    // uniquement après confirmation (appui sur le bouton d'action du
    // Snackbar de confirmation, voir requestClearAllNotifications
    // plus bas) - même principe que confirmDeleteNotification pour une
    // notification unique.
    const confirmClearAllNotifications = useCallback(async () => {
        if (!user?.uuid) return;

        setSnackbarVisible(false);

        try {
            setIsLoading(true);
            await WsNotificationService.deleteAllNotification(
                user.uuid,
                notificationList.map((notif: Notification) => notif.id),
            );
            dispatch(initializeNotification());
            showSnackbar(t('notification.delete_all_success'), 'success');
        } catch (error) {
            console.log('Clear notifications error:', error);
            showSnackbar(apiErrorMessage(error, t('notification.delete_all_error')), 'error');
        } finally {
            setIsLoading(false);
        }
    }, [user, notificationList, dispatch, showSnackbar, t]);

    // ✅ Appui sur le bouton "Tout supprimer" : affiche un Snackbar de
    // confirmation (comme pour la suppression d'une notification) au lieu
    // de supprimer immédiatement. Rien n'est supprimé tant que le bouton
    // d'action du Snackbar n'est pas pressé.
    const requestClearAllNotifications = useCallback(() => {
        if (notificationList.length === 0) return;

        setSnackbarMessage(t('notification.confirm_delete_all'));
        setSnackbarType('confirm');
        setSnackbarAction({
            label: t('notification.delete'),
            onPress: () => confirmClearAllNotifications(),
        });
        setSnackbarVisible(true);
    }, [notificationList, t, confirmClearAllNotifications]);


    // ===== Filtrage des notifications =====
    // ✅ Un seul passage .filter() sur la liste (au lieu d'enchaîner jusqu'à
    // 3 .filter() successifs, un par critère actif), et retourne
    // directement "notificationList" sans nouvelle allocation quand aucun
    // filtre n'est actif (cas le plus courant à l'ouverture de l'écran).
    // Se base sur "debouncedSearch" plutôt que "search" (voir plus haut).
    const filteredNotifications = useMemo(() => {
        const searchLower = debouncedSearch.trim().toLowerCase();
        const hasSearch = searchLower.length > 0;
        const hasReadFilter = readStatus !== 'all';
        const hasTypeFilter = Boolean(filterType);

        if (!hasSearch && !hasReadFilter && !hasTypeFilter) {
            return notificationList;
        }

        return notificationList.filter((notif: Notification) => {
            if (hasSearch && !notif.title?.toLowerCase().includes(searchLower)) {
                return false;
            }
            if (hasReadFilter) {
                const isRead = notif.dateRead !== null;
                if (readStatus === 'read' && !isRead) return false;
                if (readStatus === 'unread' && isRead) return false;
            }
            if (hasTypeFilter && notif.common?.tag !== filterType) {
                return false;
            }
            return true;
        });
    }, [notificationList, debouncedSearch, readStatus, filterType]);

    // ===== Rendu d'élément de liste =====
    const renderNotificationItem = useCallback(({ item }: { item: Notification }) => (
        <NotificationItem
            notification={item}
            onPress={handleNotificationNavigation}
            onDelete={requestDeleteNotification}
            isDeleting={deletingIds.has(item.id)}
            isNavigating={navigatingIds.has(item.id)}
            language={i18n.language}
            childrenList={children}
            t={t}
        />
    ), [handleNotificationNavigation, requestDeleteNotification, deletingIds, navigatingIds, i18n.language, children, t]);

    // ===== Clé d'élément de liste =====
    const keyExtractor = useCallback((item: Notification) => item.id, []);

    // Couleur du snackbar selon le type (confirmation, succès, erreur).
    const snackbarColor = snackbarType === 'success'
        ? COLORS.secondary
        : snackbarType === 'error'
            ? COLORS.red
            : COLORS.blackLight;

    return (
        <>
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
                                    onChangeText={handleSearchChange}
                                    onSubmitEditing={NOOP}
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
                                                {t('notification.filter_by')}
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
                                        {t('notification.empty_notification')}
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
                        {notificationList.length > 0 && (
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={requestClearAllNotifications}
                                disabled={isLoading}
                            >
                                <Text style={styles.clearButtonText}>
                                    {t('notification.clear_all')}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ViewThemed>
            </TouchableWithoutFeedback>

            {/* Snackbar react-native-paper : confirmation de suppression
            (avec bouton d'action) puis feedback succès/erreur - même
            composant réutilisé pour les deux, comme dans MiniClub.tsx. */}
            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => {
                    setSnackbarVisible(false);
                    setSnackbarAction(null);
                }}
                duration={SNACKBAR_DURATION}
                style={[styles.snackbar, { backgroundColor: snackbarColor }]}
                wrapperStyle={styles.snackbarWrapper}
                theme={{ colors: { surface: snackbarColor } }}
                action={snackbarAction ?? undefined}
            >
                <Text style={styles.snackbarText}>{snackbarMessage}</Text>
            </Snackbar>
        </>
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
    notificationItemNavigating: {
        opacity: 0.5,
    },
    itemRow: {
        flexDirection: 'row',
    },
    itemTextWrapper: {
        flex: 1,
    },
    deleteButtonWrapper: {
        justifyContent: 'flex-start',
        zIndex: 10,
    },
    deleteButton: {
        padding: 5,
    },
    notificationTitle: {
        color: COLORS.gray,
        fontWeight: '600',
    },
    notificationSender: {
        color: COLORS.gray,
    },
    childBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginTop: 4,
        paddingVertical: 1,
        paddingHorizontal: 7,
        borderRadius: 10,
        backgroundColor: '#E6F1FA',
    },
    childBadgeText: {
        marginLeft: 3,
        fontSize: 11,
        fontWeight: 'normal',
        color: '#5B9FD4',
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
    snackbar: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 8,
        elevation: 4,
    },
    snackbarWrapper: {
        bottom: 0,
        position: 'absolute',
    },
    snackbarText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
});
