import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {useDispatch, useSelector} from "react-redux";
import {useTranslation} from "react-i18next";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {MaterialIcons, MaterialCommunityIcons} from "@expo/vector-icons";
import {Formik} from "formik";
import {format, getHours, getMinutes, getTime, set} from "date-fns";
import {fromZonedTime} from "date-fns-tz";
import {enUS, fr} from "date-fns/locale";
import DropDownPicker from "react-native-dropdown-picker";
import DatePicker from "react-native-date-picker";
import {Snackbar} from 'react-native-paper';
import AppointmentService from "../../../services/AppointmentService";
import {COLORS, CONSTANT, TIME_ZONE_ABIDJAN} from "../../../constants";
import {addNewAppointment} from "../../../redux/features/appointment/appointmentSlice";
import {request} from "../../../api/ApiManager";
import {globalStyles} from "../../../style/Global";
import FlatButton from "../../ui/FlatButton";
import DatesReservedModal from "./DatesReservedModal";

// Constantes extraites
const DAYS_OFF = ['saturday', 'sunday'];
const DATA_START_TIME = [
  {label: '15:30', value: 1},
  {label: '15:50', value: 2},
  {label: '16:10', value: 3},
];

// Types
interface AppointmentFormProps {
  addModal: boolean;
  setAddModal: (value: boolean) => void;
  newAppointmentFormSchema: any;
  teacherDest: any;
  selectedChild: any;
  employeesClassList: any[];
  setTeacherDest: (value: any) => void;
  snackbarShowMessage?: (message: string, duration?: number) => void;
}

interface FormValues {
  appointmentTitle: string;
  appointmentDescription: string;
  appointmentTeacher: string;
}

interface SnackbarState {
  visible: boolean;
  message: string;
  duration: number;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
                                                           addModal,
                                                           setAddModal,
                                                           newAppointmentFormSchema,
                                                           teacherDest,
                                                           selectedChild,
                                                           employeesClassList,
                                                           setTeacherDest,
                                                           snackbarShowMessage,
                                                         }) => {
  const {t, i18n} = useTranslation();
  const dispatch = useDispatch();
  const {user} = useSelector((state: any) => state.user);

  // États
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [openEndTimePicker, setOpenEndTimePicker] = useState(false);
  const [openStartTimeDropDown, setOpenStartTimeDropDown] = useState(false);
  const [startTimeValue, setStartTimeValue] = useState<any>(null);
  const [startTimeData, setStartTimeData] = useState(DATA_START_TIME);
  const [openDates, setOpenDates] = useState(false);
  const [openDatesData, setOpenDatesData] = useState<any[]>([]);
  const [buttonStatus, setButtonStatus] = useState(false);

  // États d'erreur
  const [errorMsgTeacher, setErrorMsgTeacher] = useState('');
  const [errorMsgToday, setErrorMsgToday] = useState('');
  const [errorMsgStartTime, setErrorMsgStartTime] = useState('');
  const [errorMsgDuty, setErrorMsgDuty] = useState('');

  // État du Snackbar local
  const [localSnackbar, setLocalSnackbar] = useState<SnackbarState>({
    visible: false,
    message: '',
    duration: 3000,
  });

  const parentId = user?.userDetails?.personDetails?.person?.id;
  const today = new Date();
  const newDate = new Date();

  // Fonction pour afficher le snackbar localement
  const showSnackbar = useCallback((message: string, duration = 3000) => {
    setLocalSnackbar({
      visible: true,
      message,
      duration,
    });
    // Appeler aussi le snackbar parent si nécessaire
    if (snackbarShowMessage) {
      snackbarShowMessage(message, duration);
    }
  }, [snackbarShowMessage]);

  // Fonction pour fermer le snackbar
  const hideSnackbar = useCallback(() => {
    setLocalSnackbar(prev => ({...prev, visible: false}));
  }, []);

  // Chargement des dates réservées
  useEffect(() => {
    const loadDates = async () => {
      try {
        if (!selectedChild) {
          console.log('⚠️ Aucun enfant sélectionné');
          return;
        }

        const openDatesDataList = await AppointmentService.getAppointmentByDate(selectedChild);
        setOpenDatesData(openDatesDataList || []);
      } catch (error) {
        console.log('❌ Error loading dates:', error);
        setOpenDatesData([]);
      }
    };

    if (selectedChild) {
      loadDates().catch(e => console.log('❌ Error in loadDates:', e));
    }
  }, [selectedChild]);

  // Réinitialisation des champs de date/heure
  const resetDateTimeFields = useCallback(() => {
    setDate(new Date());
    setStartTime(new Date());
    setEndTime(new Date());
    setStartTimeValue(null);
  }, []);

  // Gestion du changement d'heure de début
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

  // Vérification de la validité du jour
  const isDayValid = useCallback((dateToCheck: Date) => {
    const dayName = format(dateToCheck, 'EEEE', {locale: enUS}).toLowerCase();
    return !DAYS_OFF.includes(dayName);
  }, []);

  // Vérification de la validité de la date
  const isDateValid = useCallback((dateToCheck: Date) => {
    const todayTimestamp = getTime(new Date());
    return todayTimestamp <= getTime(dateToCheck);
  }, []);

  // Soumission du formulaire
  const handleSubmit = useCallback(async (values: FormValues, actions: any) => {
    setButtonStatus(true);

    if (!startTimeValue) {
      setErrorMsgStartTime(t('login.required_field'));
      setButtonStatus(false);
      showSnackbar(t('login.required_field'));
      return;
    }

    if (!selectedChild) {
      setButtonStatus(false);
      showSnackbar(t('allAppointment.no_child_selected'));
      return;
    }

    setErrorMsgTeacher('');
    setErrorMsgStartTime('');
    setErrorMsgToday('');
    setErrorMsgDuty('');

    const dayIsValid = isDayValid(date);
    if (!dayIsValid) {
      setErrorMsgDuty(t('allAppointment.no_duty'));
      setButtonStatus(false);
      showSnackbar(t('allAppointment.no_duty'));
      return;
    }

    let dateDebut = set(date, {
      hours: getHours(startTime),
      minutes: getMinutes(startTime),
      seconds: 0,
    });
    let dateFin = set(date, {
      hours: getHours(endTime),
      minutes: getMinutes(endTime),
      seconds: 0,
    });

    dateDebut = fromZonedTime(dateDebut, TIME_ZONE_ABIDJAN);
    dateFin = fromZonedTime(dateFin, TIME_ZONE_ABIDJAN);

    if (!isDateValid(dateDebut)) {
      setErrorMsgToday(t('allAppointment.no_right_date'));
      setButtonStatus(false);
      showSnackbar(t('allAppointment.no_right_date'));
      return;
    }

    const dataToSend = {
      meetingType: 'NORMAL',
      dateDebut: getTime(dateDebut),
      dateFin: getTime(dateFin),
      objet: values.appointmentTitle,
      details: values.appointmentDescription,
      maxInviter: 1,
      dureeMeeting: 0,
      deadlineUpdate: 0,
      meetingStatus: 'WAIT',
      totalCreneau: 1,
      maxEnfantChoice: 0,
      userInitor: 0,
      creneauRdvs: [],
      common: CONSTANT.common,
    };

    try {
      const response = await request(
          'POST',
          '',
          `/extra/rdv/mobile/normal/${selectedChild?.person.id}/${parentId}/${
              selectedChild?.eleves?.length > 0 ? selectedChild?.eleves[0]?.classe?.id : null
          }`,
          dataToSend
      );

      dispatch(addNewAppointment(response.data));
      actions.resetForm({
        values: {
          appointmentTitle: '',
          appointmentDescription: '',
          appointmentTeacher: '',
        },
      });
      resetDateTimeFields();
      setAddModal(false);
      setStartTimeValue(null);

      // Message de succès
      showSnackbar(t('appointment.success_save'));
    }
    catch (error: any) {
      if (error.response?.data?.codeMessage === 'RDV_DATE_NOT_FREE') {
        setErrorMsgToday(t('allAppointment.rdv_date_not_free'));
        showSnackbar(t('allAppointment.rdv_date_not_free'));
      } else {
        const errorMessage = error.response?.data?.message || t('snackBar.sb_error');
        showSnackbar(errorMessage);
      }
      console.log('Error creating appointment:', error);
    } finally {
      setButtonStatus(false);
    }
  }, [startTimeValue, selectedChild, date, startTime, endTime, parentId, dispatch, setAddModal, resetDateTimeFields, t, isDayValid, isDateValid, showSnackbar]);

  // Mémorisation du champ enfant
  const childName = useMemo(() => {
    if (!selectedChild) return '';
    return `${selectedChild.person.prenom} ${selectedChild.person.nom}`;
  }, [selectedChild]);

  // Gestion de l'ouverture du modal des dates réservées
  const handleOpenDatesModal = useCallback(() => {
    setOpenDates(true);
  }, [openDatesData]);

  // Gestion de la fermeture du modal principal
  const handleCloseModal = useCallback(() => {
    setAddModal(false);
    resetDateTimeFields();
    setStartTimeValue(null);
    setErrorMsgTeacher('');
    setErrorMsgToday('');
    setErrorMsgStartTime('');
    setErrorMsgDuty('');
    hideSnackbar();
  }, [setAddModal, resetDateTimeFields, hideSnackbar]);

  return (
      <>
        <Modal visible={addModal} animationType="slide">
          <SafeAreaProvider>
            <SafeAreaView style={styles.safeArea}>
              <DatesReservedModal
                  visibility={openDates}
                  setOpenDates={setOpenDates}
                  openDatesData={openDatesData}
              />
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalContainer}>
                  {/* Header */}
                  <View style={styles.modalHeader}>
                    <View style={styles.modalTitle}>
                      <Text style={styles.modalTitleText}>
                        {t('allAppointment.new_appointment')}
                      </Text>
                    </View>
                    <TouchableWithoutFeedback onPress={handleCloseModal}>
                      <MaterialIcons
                          name="close"
                          size={22}
                          color={COLORS.gray}
                      />
                    </TouchableWithoutFeedback>
                  </View>

                  <ScrollView
                      style={styles.modalContent}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                  >
                    <Formik<FormValues>
                        initialValues={{
                          appointmentTitle: '',
                          appointmentDescription: '',
                          appointmentTeacher: '',
                        }}
                        validationSchema={newAppointmentFormSchema}
                        onSubmit={handleSubmit}
                    >
                      {formikProps => (
                          <>
                            {/* Zone pour les messages d'erreur */}
                            <View style={styles.errorContainer}>
                              {errorMsgToday && (
                                  <View style={styles.errorMessageContainer}>
                                    <MaterialIcons
                                        name="error-outline"
                                        size={20}
                                        color={COLORS.redIms}
                                        style={styles.errorIcon}
                                    />
                                    <Text style={styles.errorMessageText}>
                                      {errorMsgToday}
                                    </Text>
                                  </View>
                              )}
                              {errorMsgDuty && (
                                  <View style={styles.errorMessageContainer}>
                                    <MaterialIcons
                                        name="warning"
                                        size={20}
                                        color={COLORS.orange}
                                        style={styles.errorIcon}
                                    />
                                    <Text style={styles.errorMessageText}>
                                      {errorMsgDuty}
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
                            <View style={styles.inputField}>
                              <Text style={styles.modalInputLabel}>
                                {t('allAppointment.child_field_label')}
                              </Text>
                              <TextInput
                                  style={styles.inputModalDisabled}
                                  editable={false}
                                  value={childName}
                              />
                            </View>

                            {/* Champ Titre */}
                            <View style={styles.inputField}>
                              <Text style={styles.modalInputLabel}>
                                {t('allAppointment.title_field_label')}
                              </Text>
                              <TextInput
                                  style={styles.inputModal}
                                  placeholder={t('allAppointment.title_placeholder')}
                                  placeholderTextColor={COLORS.grayDarkLess}
                                  onChangeText={formikProps.handleChange('appointmentTitle')}
                                  value={formikProps.values.appointmentTitle}
                                  onBlur={formikProps.handleBlur('appointmentTitle')}
                              />
                              {formikProps.touched.appointmentTitle && formikProps.errors.appointmentTitle && (
                                  <Text style={globalStyles.errorText}>
                                    {t('login.required_field')}
                                  </Text>
                              )}
                            </View>

                            {/* Champ Description */}
                            <View style={styles.inputField}>
                              <Text style={styles.modalInputLabel}>
                                {t('allAppointment.description_field_label')}
                              </Text>
                              <TextInput
                                  multiline
                                  style={[styles.inputModal, styles.textArea]}
                                  placeholder={t('allAppointment.description_placeholder')}
                                  placeholderTextColor={COLORS.grayDarkLess}
                                  onChangeText={formikProps.handleChange('appointmentDescription')}
                                  value={formikProps.values.appointmentDescription}
                                  onBlur={formikProps.handleBlur('appointmentDescription')}
                              />
                              {formikProps.touched.appointmentDescription && formikProps.errors.appointmentDescription && (
                                  <Text style={globalStyles.errorText}>
                                    {t('login.required_field')}
                                  </Text>
                              )}
                            </View>

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
                                      name="info"
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
                                minimumDate={today}
                                locale={i18n.language}
                                onConfirm={(selectedDate) => {
                                  setOpenDatePicker(false);
                                  setDate(selectedDate);
                                  setErrorMsgDuty('');
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
                                title={t('allAppointment.save_form')}
                                fontWeight="500"
                                fontSize={16}
                                backgroundColor={COLORS.secondary}
                                paddingVertical={12}
                                borderRadius={20}
                                onPress={formikProps.handleSubmit}
                                disabled={buttonStatus}
                            />
                          </>
                      )}
                    </Formik>
                    <View style={styles.bottomSpacer} />
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>

              {/* Snackbar intégré dans le modal */}
              <Snackbar
                  style={styles.snackbar}
                  visible={localSnackbar.visible}
                  onDismiss={hideSnackbar}
                  duration={localSnackbar.duration}
                  elevation={3}
                  action={{
                    label: '',
                    icon: () => (
                        <MaterialCommunityIcons
                            name="close"
                            size={22}
                            color={COLORS.white}
                        />
                    ),
                    onPress: hideSnackbar,
                  }}
              >
                {localSnackbar.message}
              </Snackbar>
            </SafeAreaView>
          </SafeAreaProvider>
        </Modal>
      </>
  );
};

export default AppointmentForm;

const styles = StyleSheet.create({
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
