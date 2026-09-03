import {JSX, useCallback, useEffect, useMemo, useState} from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
    Pressable,
    TextInput,
    ActivityIndicator,
} from "react-native";
import * as yup from 'yup';
import {useTranslation} from "react-i18next";
import {COLORS, IMAGES, TIME_ZONE_ABIDJAN} from "../../../constants";
import {useDispatch, useSelector} from "react-redux";
import {request} from "../../../api/ApiManager";
import {setAppointmentDetailsInRedux, updateAppointment} from "../../../redux/features/appointment/appointmentSlice";
import {useRouter} from "expo-router";
import {format, getHours, getMinutes, getTime, set, toDate} from "date-fns";
import {fromZonedTime, toZonedTime} from "date-fns-tz";
import AppointmentService from "../../../services/AppointmentService";
import {globalStyles} from "../../../style/Global";
import {MaterialIcons, MaterialCommunityIcons} from "@expo/vector-icons";
import {Formik} from "formik";
import {enUS, fr} from "date-fns/locale";
import FlatButton from "../../ui/FlatButton";
import DatePicker from "react-native-date-picker";
import DropDownPicker from "react-native-dropdown-picker";
import {BASEURL_IMG} from "../../../api/appUrl";
import SelectDropdown from "react-native-select-dropdown";
import {Image} from "expo-image";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {Snackbar} from 'react-native-paper';

// Constantes
const DAYS_OFF = ['saturday', 'sunday'];
const DATA_START_TIME = [
    {label: '15:30', value: 1},
    {label: '15:50', value: 2},
    {label: '16:10', value: 3},
];

const newAppointmentFormSchema = yup.object({
    appointmentTitle: yup.string().required().min(3),
    appointmentDescription: yup.string(),
});

// Types
interface SnackbarState {
    visible: boolean;
    message: string;
    duration: number;
}

interface ButtonActionStatusProps {
    data: any;
    snackbarShowMessage?: (message: string, duration?: number) => void;
    setAppointmentDetails: (data: any) => void;
    parentId: number;
    userId: number;
    location?: string;
}

// Statuts valides pour chaque action
const STATUS_GROUPS = {
    EDITABLE: ['WAIT', 'REPORT', 'PARTIAL_CONFIRM', 'NOT_HELD'],
    CONFIRMABLE: ['REPORT', 'PARTIAL_CONFIRM', 'NOT_HELD'],
    CANCELABLE: ['CONFIRM', 'NOT_RESPECTED'],
    DISABLED: ['CANCEL'],
    WAITING: ['WAIT'],
};

const ButtonActionStatus: React.FC<ButtonActionStatusProps> = ({
                                                                   data,
                                                                   snackbarShowMessage,
                                                                   setAppointmentDetails,
                                                                   parentId,
                                                                   userId,
                                                                   location,
                                                               }) => {
    const {t, i18n} = useTranslation();
    const dispatch = useDispatch();
    const router = useRouter();
    const {selectedChild} = useSelector((state: any) => state.child);
    const {employeesClassList} = useSelector((state: any) => state.employee);
    const {user} = useSelector((state: any) => state.user);

    // États du formulaire
    const [editModal, setEditModal] = useState(false);
    const [teacherDest, setTeacherDest] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [buttonStatus, setButtonStatus] = useState(false);
    const [bntActionStatus, setBntActionStatus] = useState('');

    // États des dates/heures
    const newDate = new Date();
    const [date, setDate] = useState(newDate);
    const [startTime, setStartTime] = useState(newDate);
    const [endTime, setEndTime] = useState(newDate);
    const [openDatePicker, setOpenDatePicker] = useState(false);
    const [openEndTimePicker, setOpenEndTimePicker] = useState(false);
    const [openStartTimeDropDown, setOpenStartTimeDropDown] = useState(false);
    const [startTimeValue, setStartTimeValue] = useState<any>(null);
    const [startTimeData, setStartTimeData] = useState(DATA_START_TIME);

    // États des modals
    const [openDates, setOpenDates] = useState(false);
    const [openDatesData, setOpenDatesData] = useState<any[]>([]);

    // États d'erreur
    const [errorMsgToday, setErrorMsgToday] = useState('');
    const [errorMsgStartTime, setErrorMsgStartTime] = useState('');

    // État du Snackbar local
    const [localSnackbar, setLocalSnackbar] = useState<SnackbarState>({
        visible: false,
        message: '',
        duration: 3000,
    });

    const status = data.meetingStatus;
    const deadline = data.dateDebut - data.deadlineUpdate;
    const todayDeadline = newDate.setHours(23, 59, 59, 0);
    const statusDeadline = deadline > todayDeadline;
    const selectedChildClass = selectedChild?.eleves?.[0]?.classe;
    const isOwner = userId === data.userInitor;
    const canEdit = data?.creneauRdvs[0]?.creneauRdvEnfantParents[0]?.parentId === user.userDetails.personDetails?.person?.id ||
        data?.creneauRdvs[0]?.creneauRdvEnfantParents[0]?.parentId === 0 || data?.creneauRdvs[0]?.creneauRdvEnfantParents[0]?.parentId === null;

    // ========== FONCTIONS SNACKBAR ==========
    const showSnackbar = useCallback((message: string, duration = 3000) => {
        setLocalSnackbar({visible: true, message, duration});
        if (snackbarShowMessage) {
            snackbarShowMessage(message, duration);
        }
    }, [snackbarShowMessage]);

    const hideSnackbar = useCallback(() => {
        setLocalSnackbar(prev => ({...prev, visible: false}));
    }, []);

    // ========== FONCTIONS DE VALIDATION ==========
    const isDayValid = useCallback((dateToCheck: Date) => {
        const dayName = format(dateToCheck, 'EEEE', {locale: enUS}).toLowerCase();
        return !DAYS_OFF.includes(dayName);
    }, []);

    const isDateValid = useCallback((dateToCheck: Date) => {
        return getTime(new Date()) <= getTime(dateToCheck);
    }, []);

    const isDeadlineValid = useCallback(() => {
        const dateDebutMeeting = data.dateDebut - data.deadlineUpdate;
        const today = new Date().setHours(23, 59, 59, 0);
        return dateDebutMeeting > 0 && today < dateDebutMeeting;
    }, [data.dateDebut, data.deadlineUpdate]);

    // ========== FONCTIONS DE RÉINITIALISATION ==========
    const resetFields = useCallback(() => {
        setDate(newDate);
        setStartTime(newDate);
        setEndTime(newDate);
        setStartTimeValue(null);
        setErrorMsgToday('');
        setErrorMsgStartTime('');
        setButtonStatus(false);
    }, []);

    const handleCloseModal = useCallback(() => {
        setEditModal(false);
        resetFields();
        hideSnackbar();
    }, [resetFields, hideSnackbar]);

    // ========== FONCTIONS DE GESTION DES DATES/HEURES ==========
    const handleStartTimeChange = useCallback((value: any) => {
        const hourFind = DATA_START_TIME.find((hour: any) => hour.value === value);
        if (hourFind) {
            const [hours, minutes] = hourFind.label.split(':').map(Number);
            const timeStart = set(date, {hours, minutes, seconds: 0});
            const timeEnd = set(date, {hours, minutes: minutes + 20, seconds: 0});
            setStartTime(timeStart);
            setEndTime(timeEnd);
            setErrorMsgStartTime('');
        }
    }, [date]);

    const handleOpenDatesModal = useCallback(() => setOpenDates(true), []);

    // ========== FONCTIONS DE CONSTRUCTION DES DONNÉES ==========
    const buildAppointmentData = useCallback((overrides: any = {}) => {
        return {
            id: data.id,
            meetingType: data.meetingType,
            dateDebut: data.dateDebut,
            dateFin: data.dateFin,
            objet: data.objet,
            details: data.details,
            classeId: data.classeId,
            maxInviter: data.maxInviter,
            dureeMeeting: data.dureeMeeting,
            deadlineUpdate: data.deadlineUpdate,
            meetingStatus: data.meetingStatus,
            totalCreneau: data.totalCreneau,
            maxEnfantChoice: data.maxEnfantChoice,
            userInitor: data.userInitor,
            creneauRdvs: data.creneauRdvs,
            common: data.common,
            ...overrides,
        };
    }, [data]);

    const buildCreneauData = useCallback((overrides: any = {}) => {
        return {
            ...data.creneauRdvs[0],
            creneauRdvEnfantParents: [
                {
                    ...data.creneauRdvs[0].creneauRdvEnfantParents[0],
                    ...overrides,
                    parentId: parentId,
                },
            ],
        };
    }, [data]);

    // ========== FONCTIONS D'ACTION PRINCIPALES ==========
    const executeAppointmentAction = useCallback((
        actionType: 'confirm' | 'cancel' | 'update',
        dataToSend: any,
        successMessage: string
    ) => {
        setLoading(true);

        if (!isDeadlineValid()) {
            setLoading(false);
            showSnackbar(t('snackBar.sb_error_deadline_exceeded'));
            return;
        }

        if (!canEdit) {
            setLoading(false);
            showSnackbar(t('allAppointment.cannot_edit_preset_appointment'));
            return;
        }

        //console.log(`Executing ${actionType} action with data:`, JSON.stringify(dataToSend));

        request('PUT', '', `/extra/rdv/${data.id}`, dataToSend)
            .then(response => {
                dispatch(updateAppointment(response.data));
                dispatch(setAppointmentDetailsInRedux(response.data));
                setAppointmentDetails(response.data);
                setLoading(false);
                //setEditModal(false);
                showSnackbar(successMessage);
                //const route = location === 'home' ? '/(tabs)' : '/(tabs)/appointment/all-appointment';
                //router.push(route);
            })
            .catch(error => {
                setLoading(false);
                const msg = error.response?.data?.codeMessage === 'RDV_DATE_NOT_FREE'
                    ? t('allAppointment.rdv_date_not_free')
                    : t('snackBar.sb_error');
                showSnackbar(msg);
                console.log(`Error ${actionType}ing appointment:`, JSON.stringify(error));
            });
    }, [data, canEdit, isDeadlineValid, dispatch, setAppointmentDetails, location, router, t, showSnackbar]);

    // Confirmation du rendez-vous
    const handleConfirmAppointment = useCallback(() => {
        const dataToSend = buildAppointmentData({
            creneauRdvs: [
                buildCreneauData({
                    meetingStatus: 'CONFIRM',
                    dateDebut: data.creneauRdvs[0].creneauRdvEmployees[0].dateDebut,
                    dateFin: data.creneauRdvs[0].creneauRdvEmployees[0].dateFin,

                }),
            ],
        });
        executeAppointmentAction('confirm', dataToSend, t('appointment.success_save'));
    }, [buildAppointmentData, buildCreneauData, data, executeAppointmentAction, t]);

    // Annulation du rendez-vous
    const handleCancelAppointment = useCallback(() => {
        const dataToSend = buildAppointmentData({
            creneauRdvs: [
                buildCreneauData({meetingStatus: 'CANCEL',}),
            ],
        });
        executeAppointmentAction('cancel', dataToSend, t('snackBar.sb_succes_save'));
    }, [buildAppointmentData, buildCreneauData, executeAppointmentAction, t]);

    // ========== FONCTIONS D'ÉDITION ==========
    const setupEditData = useCallback((dateDebut: Date, dateFin: Date, meetingStatus?: string) => {
        const employeesFind = employeesClassList.find(
            (employee: any) => employee.id === data.creneauRdvs[0]?.creneauRdvEmployees[0]?.employeeId,
        );
        setTeacherDest(employeesFind || null);
        setDate(dateDebut);
        setStartTime(dateDebut);
        setEndTime(dateFin);
    }, [data, employeesClassList]);

    const getTimeValueFromDate = useCallback((dateToCheck: Date) => {
        const timeStr = `${getHours(dateToCheck)}:${getMinutes(dateToCheck)}`;
        return DATA_START_TIME.find((hour: any) => hour.label === timeStr);
    }, []);

    // Édition du rendez-vous
    const handleEditAppointment = useCallback(() => {
        try {
            setEditModal(true);
            setBntActionStatus('EDIT');

            if (data.meetingStatus === 'REPORT' && data.creneauRdvs[0].lastReportDateDebut) {
                let dateEditDebut = toZonedTime(
                    toDate(data.creneauRdvs[0].lastReportDateDebut),
                    TIME_ZONE_ABIDJAN
                );
                let dateEditFin = toZonedTime(
                    toDate(data.creneauRdvs[0].lastReportDateFin),
                    TIME_ZONE_ABIDJAN
                );
                const hourFind = getTimeValueFromDate(dateEditDebut);
                setStartTimeValue(hourFind?.value);
                setupEditData(dateEditDebut, dateEditFin);
            } else {
                const hourFind = getTimeValueFromDate(startTime);
                if (hourFind) {
                    setStartTimeValue(hourFind.value);
                    const [hours, minutes] = hourFind.label.split(':').map(Number);
                    const timeStart = set(date, {hours, minutes, seconds: 0});
                    const timeEnd = set(date, {hours, minutes: minutes + 20, seconds: 0});
                    setupEditData(timeStart, timeEnd);
                } else {
                    const defaultHour = DATA_START_TIME[0];
                    setStartTimeValue(defaultHour.value);
                    const [hours, minutes] = defaultHour.label.split(':').map(Number);
                    const timeStart = set(date, {hours, minutes, seconds: 0});
                    const timeEnd = set(date, {hours, minutes: minutes + 20, seconds: 0});
                    setupEditData(timeStart, timeEnd);
                }
            }
        } catch (error) {
            console.log('Error editing appointment:', error);
        }
    }, [data, startTime, date, getTimeValueFromDate, setupEditData]);

    // Reprogrammation du rendez-vous
    const handleRescheduleAppointment = useCallback(() => {
        try {
            setEditModal(true);
            setBntActionStatus('CONFIRM');

            const employeesFind = employeesClassList.find(
                (employee: any) => employee.id === data.creneauRdvs[0]?.creneauRdvEmployees[0]?.employeeId,
            );
            setTeacherDest(employeesFind || null);

            let dateEditDebut = toZonedTime(toDate(data.creneauRdvs[0].dateDebut), TIME_ZONE_ABIDJAN);
            let dateEditFin = toZonedTime(toDate(data.creneauRdvs[0].dateFin), TIME_ZONE_ABIDJAN);

            const hourFind = getTimeValueFromDate(dateEditDebut);
            setStartTimeValue(hourFind?.value);
            setupEditData(dateEditDebut, dateEditFin);
        } catch (error) {
            console.log('Error rescheduling appointment:', error);
        }
    }, [data, employeesClassList, getTimeValueFromDate, setupEditData]);

    // ========== SOUMISSION DU FORMULAIRE D'ÉDITION ==========
    const handleSubmitEdit = useCallback(async (formData: any, actions: any) => {
        setButtonStatus(true);

        if (!startTimeValue) {
            setErrorMsgStartTime(t('login.required_field'));
            setButtonStatus(false);
            showSnackbar(t('login.required_field'));
            return;
        }

        // Validations
        if (!isDeadlineValid()) {
            setButtonStatus(false);
            showSnackbar(t('snackBar.sb_error_deadline_exceeded'));
            return;
        }

        if (!isDayValid(date)) {
            setButtonStatus(false);
            showSnackbar(t('allAppointment.no_duty'));
            return;
        }

        let dateDebut = fromZonedTime(
            set(date, {hours: getHours(startTime), minutes: getMinutes(startTime)}),
            TIME_ZONE_ABIDJAN
        );
        let dateFin = fromZonedTime(
            set(date, {hours: getHours(endTime), minutes: getMinutes(endTime)}),
            TIME_ZONE_ABIDJAN
        );

        if (!isDateValid(dateDebut)) {
            setErrorMsgToday(t('allAppointment.no_right_date'));
            setButtonStatus(false);
            showSnackbar(t('allAppointment.no_right_date'));
            return;
        }

        if (!statusDeadline) {
            setEditModal(false);
            showSnackbar(t('appointment.no_action_available'));
            return;
        }

        if (!canEdit) {
            setButtonStatus(false);
            showSnackbar(t('allAppointment.cannot_edit_preset_appointment'));
            return;
        }

        // Construction des données selon le type d'action
        let dataToSend: any = null;
        const creneauUpdate = {
            dateDebut: getTime(dateDebut),
            dateFin: getTime(dateFin),
        };

        if (bntActionStatus === 'EDIT') {
            if (data.meetingStatus === 'WAIT' && isOwner) {
                dataToSend = buildAppointmentData({
                    dateDebut: getTime(dateDebut),
                    dateFin: getTime(dateFin),
                    objet: formData.appointmentTitle,
                    details: formData.appointmentDescription,
                    creneauRdvs: [
                        buildCreneauData(creneauUpdate),
                    ],
                });
            } else if (data.meetingStatus === 'REPORT') {
                dataToSend = buildAppointmentData({
                    creneauRdvs: [
                        buildCreneauData({
                            ...creneauUpdate,
                            meetingStatus: 'REPORT',
                        }),
                    ],
                });
            } else if (data.meetingStatus === 'WAIT' && !isOwner) {
                dataToSend = buildAppointmentData({
                    meetingStatus: 'REPORT',
                    creneauRdvs: [
                        buildCreneauData({
                            ...creneauUpdate,
                            meetingStatus: 'REPORT',
                        }),
                    ],
                });
            }
        } else if (bntActionStatus === 'CONFIRM') {
            dataToSend = buildAppointmentData({
                creneauRdvs: [
                    buildCreneauData({
                        ...creneauUpdate,
                        meetingStatus: 'REPORT',
                    }),
                ],
            });
        }

        if (dataToSend) {
            try {
                const response = await request('PUT', '', `/extra/rdv/${data.id}`, dataToSend);
                dispatch(updateAppointment(response.data));
                setAppointmentDetails(response.data);
                actions.resetForm();
                resetFields();
                setEditModal(false);
                setButtonStatus(false);
                showSnackbar(t('appointment.success_update'));
                //const route = location === 'home' ? '/(tabs)' : '/(tabs)/appointment/all-appointment';
                //router.push(route);
            } catch (error: any) {
                setButtonStatus(false);
                const msg = error.response?.data?.codeMessage === 'RDV_DATE_NOT_FREE'
                    ? t('allAppointment.rdv_date_not_free')
                    : t('snackBar.sb_error');
                showSnackbar(msg);
                console.log('Error updating appointment:', error);
            }
        }
    }, [startTimeValue, date, startTime, endTime, data, isOwner, statusDeadline, canEdit, bntActionStatus, resetFields, location, router, t, showSnackbar, isDayValid, isDateValid, isDeadlineValid, buildAppointmentData, buildCreneauData]);

    // ========== CHARGEMENT INITIAL ==========
    useEffect(() => {
        const fetchData = async () => {
            try {
                let dateDebut = toZonedTime(toDate(data?.dateDebut), TIME_ZONE_ABIDJAN);
                let dateFin = toZonedTime(toDate(data?.dateFin), TIME_ZONE_ABIDJAN);

                const employeesFind = employeesClassList.find(
                    (employee: any) => employee.id === data.creneauRdvs[0]?.creneauRdvEmployees[0]?.employeeId,
                );
                setTeacherDest(employeesFind || null);
                setDate(dateDebut);
                setStartTime(dateDebut);
                setEndTime(dateFin);

                const openDatesDataList = await AppointmentService.getAppointmentByDate(selectedChild);
                setOpenDatesData(openDatesDataList || []);
            } catch (error) {
                console.log('Error loading data:', error);
            }
        };
        fetchData();
    }, [data, employeesClassList, selectedChild]);

    // ========== MÉMORISATION ==========
    const childName = useMemo(() => {
        if (!selectedChild) return '';
        return `${selectedChild.person.prenom} ${selectedChild.person.nom}`;
    }, [selectedChild]);

    // ========== FONCTIONS DE RENDU DES BOUTONS ==========
    const getButtonStyle = useCallback((type: 'left' | 'right' | 'cancel' | 'disabled' | 'confirm') => {
        const stylesMap = {
            left: styles.leftButton,
            right: styles.confirmButton,
            cancel: styles.cancelButton,
            disabled: styles.disabledButton,
            confirm: styles.confirmButton,
        };
        return stylesMap[type] || {};
    }, []);

    const isStatusInGroup = useCallback((status: string, group: string[]) => {
        return group.includes(status);
    }, []);

    // Rendu du bouton de gauche
    const renderLeftButton = useCallback(() => {
        if (isStatusInGroup(status, STATUS_GROUPS.EDITABLE)) {
            return (
                <TouchableOpacity
                    style={[styles.button, getButtonStyle('left')]}
                    onPress={handleEditAppointment}
                >
                    <Text style={styles.buttonTextLeft}>{t('upcomingAppointment.edit_btn')}</Text>
                </TouchableOpacity>
            );
        }

        if (isStatusInGroup(status, STATUS_GROUPS.CANCELABLE) && statusDeadline) {
            return (
                <TouchableOpacity
                    style={[styles.button, getButtonStyle('cancel')]}
                    onPress={handleCancelAppointment}
                    disabled={!isOwner}
                >
                    <Text style={styles.buttonTextCancel}>{t('upcomingAppointment.cancel_btn')}</Text>
                </TouchableOpacity>
            );
        }

        if (isStatusInGroup(status, STATUS_GROUPS.DISABLED)) {
            return (
                <TouchableOpacity style={[styles.button, getButtonStyle('disabled')]} disabled>
                    <Text style={styles.disabledButtonText}>{t('upcomingAppointment.cancel_btn')}</Text>
                </TouchableOpacity>
            );
        }

        return null;
    }, [status, statusDeadline, isOwner, getButtonStyle, isStatusInGroup, t, handleEditAppointment, handleCancelAppointment]);

    // Rendu du bouton de droite
    const renderRightButton = useCallback(() => {
        if (isStatusInGroup(status, STATUS_GROUPS.DISABLED)) {
            return (
                <TouchableOpacity style={[styles.button, getButtonStyle('disabled')]} disabled>
                    <Text style={styles.disabledButtonText}>{t('appointmentDetails.save_btn')}</Text>
                </TouchableOpacity>
            );
        }

        if (isStatusInGroup(status, STATUS_GROUPS.CONFIRMABLE)) {
            return (
                <TouchableOpacity
                    style={[styles.button, getButtonStyle('confirm')]}
                    onPress={handleConfirmAppointment}
                >
                    <Text style={styles.buttonTextRight}>{t('upcomingAppointment.confirm_btn')}</Text>
                </TouchableOpacity>
            );
        }

        if (isStatusInGroup(status, STATUS_GROUPS.WAITING)) {
            if (!isOwner) {
                return (
                    <TouchableOpacity
                        style={[styles.button, getButtonStyle('confirm')]}
                        onPress={handleConfirmAppointment}
                    >
                        <Text style={styles.buttonTextRight}>{t('upcomingAppointment.confirm_btn')}</Text>
                    </TouchableOpacity>
                );
            }
            return (
                <TouchableOpacity style={[styles.button, getButtonStyle('disabled')]} disabled>
                    <Text style={styles.disabledButtonText}>{t('upcomingAppointment.confirm_btn')}</Text>
                </TouchableOpacity>
            );
        }

        if (isStatusInGroup(status, STATUS_GROUPS.CANCELABLE) && statusDeadline) {
            return (
                <TouchableOpacity
                    style={[styles.button, getButtonStyle('confirm')]}
                    onPress={handleRescheduleAppointment}
                >
                    <Text style={styles.buttonTextRight}>{t('upcomingAppointment.reschedule_btn')}</Text>
                </TouchableOpacity>
            );
        }

        return null;
    }, [status, statusDeadline, isOwner, getButtonStyle, isStatusInGroup, t, handleConfirmAppointment, handleRescheduleAppointment]);

    // ========== COMPOSANT COMMUN POUR LES CHAMPS DE SAISIE ==========
    const renderTextField = useCallback((
        label: string,
        value: string,
        onChange: (text: string) => void,
        onBlur: (e: any) => void,
        placeholder?: string,
        editable: boolean = true,
        multiline: boolean = false,
        error?: string
    ) => (
        <View style={styles.inputField}>
            <Text style={styles.modalInputLabel}>{label}</Text>
            <TextInput
                style={[editable ? styles.inputModal : styles.inputModalDisabled, multiline && styles.textArea]}
                editable={editable}
                multiline={multiline}
                placeholder={placeholder}
                placeholderTextColor={editable ? COLORS.gray : COLORS.grayDarkLess}
                onChangeText={onChange}
                value={value}
                onBlur={onBlur}
            />
            {error && <Text style={globalStyles.errorText}>{error}</Text>}
        </View>
    ), []);

    // ========== RENDU PRINCIPAL ==========
    return (
        <View style={styles.container}>
            {/* Boutons d'action */}
            <View style={styles.buttonsContainer}>
                <View style={styles.leftButtonWrapper}>{renderLeftButton()}</View>
                <View style={styles.rightButtonWrapper}>{renderRightButton()}</View>
            </View>

            {/* Loading */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.secondary} />
                </View>
            )}

            {/* Modal d'édition */}
            <Modal visible={editModal} animationType="slide">
                <SafeAreaProvider>
                    <SafeAreaView style={styles.safeArea}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View style={styles.modalContainer}>
                                <View style={styles.modalHeader}>
                                    <View style={styles.modalTitle}>
                                        <Text style={styles.modalTitleText}>
                                            {t('allAppointment.edit_appointment')}
                                        </Text>
                                    </View>
                                    <TouchableWithoutFeedback onPress={handleCloseModal}>
                                        <MaterialIcons name="close" size={22} color={COLORS.gray} />
                                    </TouchableWithoutFeedback>
                                </View>

                                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                                    <Formik
                                        initialValues={{
                                            appointmentTitle: data.objet || '',
                                            appointmentDescription: data.details || '',
                                            appointmentTeacher: '',
                                        }}
                                        validationSchema={newAppointmentFormSchema}
                                        onSubmit={handleSubmitEdit}
                                    >
                                        {formikProps => (
                                            <>
                                                {/* Messages d'erreur */}
                                                <View style={styles.errorContainer}>
                                                    {errorMsgToday && (
                                                        <View style={styles.errorMessageContainer}>
                                                            <MaterialIcons
                                                                name="error"
                                                                size={20}
                                                                color={COLORS.redIms}
                                                                style={styles.errorIcon}
                                                            />
                                                            <Text style={styles.errorMessageText}>
                                                                {errorMsgToday}
                                                            </Text>
                                                        </View>
                                                    )}
                                                    {errorMsgStartTime && (
                                                        <View style={styles.errorMessageContainer}>
                                                            <MaterialIcons
                                                                name="info"
                                                                size={20}
                                                                color={COLORS.orange}
                                                                style={styles.errorIcon}
                                                            />
                                                            <Text style={styles.errorMessageText}>
                                                                {errorMsgStartTime}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>

                                                {/* Champ Enfant */}
                                                {renderTextField(
                                                    t('allAppointment.child_field_label'),
                                                    childName,
                                                    () => {},
                                                    () => {},
                                                    undefined,
                                                    false
                                                )}

                                                {/* Champ Employé */}
                                                <View style={styles.inputField}>
                                                    <Text style={styles.modalInputLabel}>
                                                        {t('allAppointment.employee_field_label')}
                                                    </Text>
                                                    {teacherDest ? (
                                                        <SelectDropdown
                                                            disabled={true}
                                                            data={employeesClassList}
                                                            onSelect={() => {}}
                                                            buttonStyle={styles.dropdown3BtnStyle}
                                                            renderCustomizedButtonChild={(selectedItem: any) => (
                                                                <View style={styles.dropdown3BtnChildStyle}>
                                                                    <Image
                                                                        source={
                                                                            selectedItem?.person?.photo
                                                                                ? {uri: `${BASEURL_IMG}/${selectedItem.person.photo}`}
                                                                                : IMAGES.avatar
                                                                        }
                                                                        style={styles.dropdown3BtnImage}
                                                                    />
                                                                    <Text style={styles.dropdown3BtnTxt}>
                                                                        {selectedItem
                                                                            ? `${selectedItem.person.prenom} ${selectedItem.person.nom}`
                                                                            : t('allAppointment.employee_select_placeholder')}
                                                                    </Text>
                                                                    <MaterialIcons name="expand-more" color={COLORS.gray} size={22} />
                                                                </View>
                                                            )}
                                                            dropdownStyle={styles.dropdown3DropdownStyle}
                                                            rowStyle={styles.dropdown3RowStyle}
                                                            renderCustomizedRowChild={(item: any) => (
                                                                <View style={styles.dropdown3RowChildStyle}>
                                                                    <Image
                                                                        source={
                                                                            item?.person?.photo
                                                                                ? {uri: `${BASEURL_IMG}/${item.person.photo}`}
                                                                                : IMAGES.avatar
                                                                        }
                                                                        style={styles.dropdownRowImage}
                                                                    />
                                                                    <Text style={styles.dropdown3RowTxt}>
                                                                        {item?.person?.prenom || ''} {item?.person?.nom || ''}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                            defaultValue={teacherDest}
                                                        />
                                                    ) : (
                                                        <TextInput
                                                            style={styles.inputModalDisabled}
                                                            editable={false}
                                                            value={`${t('appointment.no_teacher_selected')} ${selectedChildClass?.nom || ''}`}
                                                        />
                                                    )}
                                                </View>

                                                {/* Champ Titre */}
                                                {renderTextField(
                                                    t('allAppointment.title_field_label'),
                                                    formikProps.values.appointmentTitle,
                                                    formikProps.handleChange('appointmentTitle'),
                                                    formikProps.handleBlur('appointmentTitle'),
                                                    t('allAppointment.title_placeholder'),
                                                    isOwner,
                                                    false,
                                                    formikProps.touched.appointmentTitle && formikProps.errors.appointmentTitle
                                                        ? t('login.required_field')
                                                        : undefined
                                                )}

                                                {/* Champ Description */}
                                                {renderTextField(
                                                    t('allAppointment.description_field_label'),
                                                    formikProps.values.appointmentDescription,
                                                    formikProps.handleChange('appointmentDescription'),
                                                    formikProps.handleBlur('appointmentDescription'),
                                                    t('allAppointment.description_placeholder'),
                                                    isOwner,
                                                    true
                                                )}

                                                {/* Champ Date */}
                                                <View style={styles.inputField}>
                                                    <View style={styles.dateHeaderRow}>
                                                        <View style={styles.dateHeaderLabel}>
                                                            <Text style={styles.modalInputLabel}>
                                                                {t('allAppointment.date_field_label')}
                                                            </Text>
                                                        </View>
                                                        <TouchableOpacity
                                                            onPress={handleOpenDatesModal}
                                                            style={styles.timeNotAvailableButton}
                                                        >
                                                            <MaterialIcons
                                                                name="info-outline"
                                                                color={COLORS.primary}
                                                                size={15}
                                                                style={styles.infoIcon}
                                                            />
                                                            <Text style={styles.timeNotAvailableText}>
                                                                {t('allAppointment.time_not_available')}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                    <Pressable onPress={() => setOpenDatePicker(true)}>
                                                        <Text style={styles.inputModal}>
                                                            {format(date, 'P', {
                                                                locale: i18n.language === 'en' ? enUS : fr,
                                                            })}
                                                        </Text>
                                                    </Pressable>
                                                </View>

                                                <DatePicker
                                                    modal
                                                    open={openDatePicker}
                                                    date={date}
                                                    mode="date"
                                                    minimumDate={newDate}
                                                    locale={i18n.language}
                                                    onConfirm={(selectedDate) => {
                                                        setOpenDatePicker(false);
                                                        setDate(selectedDate);
                                                        setErrorMsgToday('');
                                                    }}
                                                    onCancel={() => setOpenDatePicker(false)}
                                                />

                                                {/* Champ Heure de début */}
                                                <View style={[styles.inputField, {zIndex: 2}]}>
                                                    <Text style={styles.modalInputLabel}>
                                                        {t('allAppointment.startime_field_label')}
                                                    </Text>
                                                    <DropDownPicker
                                                        open={openStartTimeDropDown}
                                                        value={startTimeValue}
                                                        items={startTimeData}
                                                        setOpen={setOpenStartTimeDropDown}
                                                        setValue={setStartTimeValue}
                                                        setItems={setStartTimeData}
                                                        listMode="SCROLLVIEW"
                                                        onChangeValue={handleStartTimeChange}
                                                        placeholder={t('allAppointment.startime_field_label')}
                                                        style={styles.dropdownStyle}
                                                        dropDownContainerStyle={styles.dropdownContainerStyle}
                                                        labelStyle={styles.dropdownLabelStyle}
                                                        containerStyle={styles.dropdownContainer}
                                                        placeholderStyle={styles.dropdownPlaceholderStyle}
                                                        listItemLabelStyle={styles.dropdownListItemStyle}
                                                        // @ts-ignore
                                                        language={i18n.language.toUpperCase()}
                                                    />
                                                </View>

                                                {/* Champ Heure de fin */}
                                                <View style={[styles.inputField, {marginBottom: 40, zIndex: 1}]}>
                                                    <Text style={styles.modalInputLabel}>
                                                        {t('allAppointment.endtime_field_label')}
                                                    </Text>
                                                    <Pressable onPress={() => setOpenEndTimePicker(true)}>
                                                        <Text style={styles.inputModal}>
                                                            {format(endTime, 'p', {
                                                                locale: i18n.language === 'en' ? enUS : fr,
                                                            })}
                                                        </Text>
                                                    </Pressable>
                                                </View>

                                                <DatePicker
                                                    modal
                                                    open={openEndTimePicker}
                                                    date={endTime}
                                                    minimumDate={startTime}
                                                    mode="time"
                                                    locale={i18n.language}
                                                    onConfirm={(selectedEndTime) => {
                                                        setOpenEndTimePicker(false);
                                                        setEndTime(selectedEndTime);
                                                    }}
                                                    onCancel={() => setOpenEndTimePicker(false)}
                                                />

                                                {/* Bouton de soumission */}
                                                <FlatButton
                                                    title={t('allAppointment.edit_form')}
                                                    fontWeight="500"
                                                    fontSize={16}
                                                    backgroundColor={COLORS.secondary}
                                                    paddingVertical={12}
                                                    borderRadius={20}
                                                    onPress={formikProps.handleSubmit}
                                                    disabled={buttonStatus}
                                                />
                                                <View style={styles.bottomSpacer} />
                                            </>
                                        )}
                                    </Formik>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>

                        {/* Snackbar intégré */}
                        <Snackbar
                            style={styles.snackbar}
                            visible={localSnackbar.visible}
                            onDismiss={hideSnackbar}
                            duration={localSnackbar.duration}
                            elevation={3}
                            action={{
                                label: '',
                                icon: () => (
                                    <MaterialCommunityIcons name="close" size={22} color={COLORS.white} />
                                ),
                                onPress: hideSnackbar,
                            }}
                        >
                            {localSnackbar.message}
                        </Snackbar>
                    </SafeAreaView>
                </SafeAreaProvider>
            </Modal>
        </View>
    );
};

export default ButtonActionStatus;

// Styles inchangés...
const styles = StyleSheet.create({
    container: {
        marginTop: 30,
        marginBottom: 10,
    },
    buttonsContainer: {
        flex: 1,
        flexDirection: 'row',
        marginTop: 5,
        alignItems: 'center',
    },
    leftButtonWrapper: {
        flex: 1,
        paddingRight: 10,
    },
    rightButtonWrapper: {
        flex: 1,
        paddingLeft: 10,
    },
    button: {
        flex: 1,
        borderRadius: 5,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    leftButton: {
        backgroundColor: COLORS.grayVeryLight,
        borderColor: COLORS.grayLight,
        borderWidth: 1,
    },
    confirmButton: {
        backgroundColor: COLORS.secondary,
    },
    cancelButton: {
        backgroundColor: COLORS.redIms,
        borderColor: COLORS.redIms,
        borderWidth: 1,
    },
    disabledButton: {
        backgroundColor: COLORS.grayVeryLight,
    },
    buttonTextLeft: {
        color: COLORS.gray,
        fontWeight: '400',
    },
    buttonTextRight: {
        color: COLORS.white,
        fontWeight: '400',
    },
    buttonTextCancel: {
        color: COLORS.white,
        fontWeight: '400',
    },
    disabledButtonText: {
        color: COLORS.grayLight,
    },
    loadingContainer: {
        ...globalStyles.loading,
        marginTop: 100,
    },
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    modalContainer: {
        flex: 1,
        padding: 15,
    },
    modalHeader: {
        flexDirection: 'row',
        paddingTop: 5,
        paddingBottom: 5,
    },
    modalTitle: {
        flex: 1,
        alignItems: 'center',
    },
    modalTitleText: {
        fontSize: 18,
        fontWeight: '500',
        letterSpacing: 1,
        color: COLORS.secondary,
    },
    modalContent: {
        flex: 1,
        paddingTop: 20,
    },
    inputField: {
        marginBottom: 15,
    },
    modalInputLabel: {
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 1,
        color: COLORS.black,
        paddingLeft: 2,
        paddingBottom: 5,
    },
    inputModal: {
        borderWidth: 1,
        borderColor: COLORS.grayMedium,
        padding: 10,
        fontSize: 16,
        borderRadius: 4,
        color: COLORS.gray,
        zIndex: 0,
    },
    inputModalDisabled: {
        borderWidth: 1,
        borderColor: COLORS.grayMedium,
        padding: 10,
        fontSize: 16,
        borderRadius: 4,
        color: COLORS.grayDarkLess,
        zIndex: 0,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    errorContainer: {
        marginBottom: 8,
        minHeight: 15,
    },
    errorMessageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
    },
    errorIcon: {
        marginRight: 8,
    },
    errorMessageText: {
        flex: 1,
        color: COLORS.redIms,
        fontSize: 14,
    },
    dateHeaderRow: {
        flexDirection: 'row',
    },
    dateHeaderLabel: {
        flex: 2,
    },
    timeNotAvailableButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIcon: {
        marginRight: 3,
    },
    timeNotAvailableText: {
        color: COLORS.primary,
        fontSize: 12,
        fontStyle: 'italic',
    },
    dropdown3BtnStyle: {
        width: '100%',
        backgroundColor: COLORS.white,
        paddingHorizontal: 0,
        borderWidth: 1,
        borderRadius: 6,
        borderColor: COLORS.grayMedium,
    },
    dropdown3BtnChildStyle: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    dropdown3BtnImage: {
        width: 35,
        height: 35,
        resizeMode: 'cover',
        borderRadius: 35,
    },
    dropdown3BtnTxt: {
        flex: 1,
        color: COLORS.gray,
        textAlign: 'left',
        fontSize: 16,
        marginHorizontal: 12,
    },
    dropdown3DropdownStyle: {
        backgroundColor: COLORS.white,
    },
    dropdown3RowStyle: {
        borderColor: COLORS.grayVeryLight,
        borderBottomColor: COLORS.grayVeryLight,
    },
    dropdown3RowChildStyle: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    dropdownRowImage: {
        width: 35,
        height: 35,
        resizeMode: 'cover',
        borderRadius: 35,
    },
    dropdown3RowTxt: {
        color: COLORS.gray,
        textAlign: 'center',
        fontSize: 16,
        marginHorizontal: 12,
    },
    dropdownStyle: {
        borderRadius: 4,
        borderColor: COLORS.grayMedium,
        padding: 0,
    },
    dropdownContainerStyle: {
        borderColor: COLORS.grayMedium,
        borderRadius: 4,
    },
    dropdownLabelStyle: {
        color: COLORS.gray,
        fontSize: 16,
        padding: 0,
    },
    dropdownContainer: {
        borderColor: COLORS.grayLight,
        padding: 0,
    },
    dropdownPlaceholderStyle: {
        color: COLORS.gray,
        fontSize: 16,
    },
    dropdownListItemStyle: {
        fontSize: 16,
        color: COLORS.gray,
    },
    snackbar: {
        backgroundColor: COLORS.gray,
        marginBottom: 20,
        marginHorizontal: 15,
        zIndex: 999,
    },
    bottomSpacer: {
        marginTop: 20,
    },
});

