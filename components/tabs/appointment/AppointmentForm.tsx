import React, {useEffect, useState} from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {useDispatch, useSelector} from "react-redux";
import {useTranslation} from "react-i18next";
import AppointmentService from "../../../services/AppointmentService";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import DatesReservedModal from "./DatesReservedModal";
import {MaterialIcons} from "@expo/vector-icons";
import {COLORS, CONSTANT, TIME_ZONE_ABIDJAN} from "../../../constants";
import {Formik} from "formik";
import {format, getHours, getMinutes, getTime, set} from "date-fns";
import {fromZonedTime} from "date-fns-tz";
import {enUS, fr} from "date-fns/locale";
import {request} from "../../../api/ApiManager";
import {addNewAppointment} from "../../../redux/features/appointment/appointmentSlice";
import {globalStyles} from "../../../style/Global";
import DatePicker from "react-native-date-picker";
import FlatButton from "../../ui/FlatButton";
import DropDownPicker from "react-native-dropdown-picker";


const dataStartTime = [
  {label: '15:30', value: 1},
  {label: '15:50', value: 2},
  {label: '16:10', value: 3},
];

const dayListOff = ['saturday', 'sunday'];

function AppointmentForm(props: any) {
  const {
    addModal,
    setAddModal,
    newAppointmentFormSchema,
    teacherDest,
    selectedChild,
    employeesClassList,
    setTeacherDest,
  } = props;

  const dispatch = useDispatch();
  const {t, i18n} = useTranslation();
  const [errorMsgTeacher, setErrorMsgTeacher] = useState('');
  const [errorMsgToday, setErrorMsgToday] = useState('');
  const [errorMsgStartTime, setErrorMsgStartTime] = useState('');
  const [errorMsgDuty, setErrorMsgDuty] = useState('');
  //const [date, setDate] = useState(new Date());
  //const [startTime, setStartTime] = useState(new Date());

  const newDate = new Date();

  const [date, setDate] = useState(newDate);
  const [startTime, setStartTime] = useState(newDate);

  //const [openStartTime, setStartTimeOpen] = useState(false);
  const [endTime, setEndTime] = useState(startTime);
  const [openEndTime, setEndTimeOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const today = newDate;
  const [buttonStatus, setButtonStatus] = useState(false);
  const [openDates, setOpenDates] = useState(false);

  const [openStartTimeHour, setOpenStartTimeHour] = useState(false);
  const [startTimeValue, setStartTimeValue] = useState<any>(null);
  const [startTimeData, setStartTimeData] = useState<any>(dataStartTime);
  const {user} = useSelector((state: any) => state.user);
  const parentId: any = user.userDetails.personDetails.person.id;
  const [openDatesData, setOpenDatesData] = useState<any>([]);

  const handleTeacherSelectChange = (item: any, index: number) => {
    setTeacherDest(item);
    setErrorMsgTeacher('');
  };

  const handleOpenDatesData = async () => {
    setOpenDates(true);
  }

  useEffect(() => {
    const loadDates = async () => {
      const openDatesDataList =  await AppointmentService.getAppointmentByDate(selectedChild);
      setOpenDatesData(openDatesDataList);
    }

    loadDates().catch(error => {
      console.log(error);
    });
  }, [selectedChild]);

  return (
      <>
        <Modal visible={addModal} animationType="slide" style={{marginTop: 100}}>
          <SafeAreaProvider>
            <SafeAreaView style={{flex: 1, backgroundColor: 'transparent'}}>
            <DatesReservedModal
                visibility={openDates}
                setOpenDates={setOpenDates}
                openDatesData={openDatesData}
            />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitle}>
                    <Text style={styles.modalTitleText}>
                      {t('allAppointment.new_appointment')}
                    </Text>
                  </View>
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <MaterialIcons
                        name="close"
                        size={22}
                        color={COLORS.gray}
                        onPress={() => {
                          setAddModal(false);
                        }}
                    />
                  </TouchableWithoutFeedback>
                </View>

                <ScrollView style={styles.modalContent}>
                  <Formik
                      initialValues={{
                        appointmentTitle: '',
                        appointmentDescription: '',
                        appointmentTeacher: '',
                      }}
                      validationSchema={newAppointmentFormSchema}
                      onSubmit={(data: any, actions: any) => {
                        setButtonStatus(true);
                        //teacherDest !== null &&
                        if (startTimeValue !== null && selectedChild !== null) {
                          setErrorMsgTeacher('');
                          setErrorMsgStartTime('');
                          setErrorMsgToday('');

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

                          const dataToSend = {
                            //id: 0,
                            meetingType: 'NORMAL',
                            dateDebut: getTime(dateDebut),
                            dateFin: getTime(dateFin),
                            objet: data.appointmentTitle,
                            details: data.appointmentDescription,
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

                          const theDay = format(date, 'EEEE', {locale: enUS});
                          if (!dayListOff.includes(theDay.toLowerCase())) {
                            //const todayTime = newDate; //toZonedTime(new Date(), TIME_ZONE_ABIDJAN);
                            let today = getTime(newDate);

                            if(today <= getTime(dateDebut)) {
                              setErrorMsgDuty('');
                              setErrorMsgToday('');

                              request(
                                  'POST',
                                  '',
                                  `/extra/rdv/mobile/normal/${selectedChild?.person.id}/${parentId}/${
                                      selectedChild?.eleves.length> 0 ? selectedChild?.eleves[0]?.classe?.id : null
                                  }`,
                                  dataToSend
                              )
                                  .then(response => {
                                    dispatch(addNewAppointment(response.data));
                                    actions.resetForm({
                                      values: {
                                        appointmentTitle: '',
                                        appointmentDescription: '',
                                        appointmentTeacher: '',
                                      },
                                    });

                                    setDate(new Date());
                                    setStartTime(new Date());
                                    setEndTime(new Date());
                                    setAddModal(false);
                                    setStartTimeValue(1);
                                    setButtonStatus(false);
                                  })
                                  .catch(error => {
                                    setButtonStatus(false);
                                    if (error.response) {
                                      const msgToDisplay = error.response.data;
                                      if(msgToDisplay?.codeMessage === 'RDV_DATE_NOT_FREE') {
                                        setErrorMsgToday(t('allAppointment.rdv_date_not_free'));
                                      }
                                      console.log(msgToDisplay);
                                    }
                                    else {
                                      console.log(error.config);
                                    }
                                  });
                            }
                            else {
                              setButtonStatus(false);
                              setErrorMsgToday(t('allAppointment.no_right_date'));
                            }
                          }
                          else {
                            setButtonStatus(false);
                            setErrorMsgDuty(t('allAppointment.no_duty'));
                          }
                        }
                        else {
                          setButtonStatus(false);
                          setErrorMsgTeacher(t('login.required_field'));
                          if (teacherDest !== null) {
                            setErrorMsgTeacher('');
                          }

                          setErrorMsgStartTime(t('login.required_field'));
                          if (startTimeValue !== null) {
                            setErrorMsgStartTime('');
                          }
                        }
                      }}>
                    {formikProps => (
                        <>
                          {errorMsgToday && (
                              <Text style={{color: COLORS.redIms, textAlign: 'center', marginBottom:10} as StyleSheet}>{errorMsgToday}</Text>
                          )}

                          <View style={styles.inputField}>
                            <Text style={styles.modalInputLabel}>
                              {t('allAppointment.child_field_label')}
                            </Text>
                            <TextInput
                                style={{...styles.inputModal, color: COLORS.grayDarkLess}}
                                editable={false}
                                value={
                                  selectedChild !== null
                                      ? `${selectedChild.person.prenom} ${selectedChild.person.nom}`
                                      : ''
                                }
                            />
                          </View>

                          <View style={styles.inputField}>
                            <Text style={styles.modalInputLabel}>
                              {t('allAppointment.title_field_label')}
                            </Text>
                            <TextInput
                                style={styles.inputModal}
                                placeholder={t('allAppointment.title_placeholder')}
                                placeholderTextColor={COLORS.grayDarkLess}
                                onChangeText={formikProps.handleChange(
                                    'appointmentTitle',
                                )}
                                value={formikProps.values.appointmentTitle}
                                onBlur={formikProps.handleBlur('appointmentTitle')}
                            />
                            <Text style={{...globalStyles.errorText}}>
                              {formikProps.touched.appointmentTitle &&
                                  formikProps.errors.appointmentTitle && (
                                      <Text>{t('login.required_field')}</Text>
                                  )}
                            </Text>
                          </View>

                          <View style={styles.inputField}>
                            <Text style={styles.modalInputLabel}>
                              {t('allAppointment.description_field_label')}
                            </Text>
                            <TextInput
                                multiline
                                style={styles.inputModal}
                                placeholder={t(
                                    'allAppointment.description_placeholder',
                                )}
                                placeholderTextColor={COLORS.grayDarkLess}
                                onChangeText={formikProps.handleChange(
                                    'appointmentDescription',
                                )}
                                value={formikProps.values.appointmentDescription}
                                onBlur={formikProps.handleBlur(
                                    'appointmentDescription',
                                )}
                            />
                            <Text style={{...globalStyles.errorText}}>
                              {formikProps.touched.appointmentDescription &&
                                  formikProps.errors.appointmentDescription && (
                                      <Text>{t('login.required_field')}</Text>
                                  )}
                            </Text>
                          </View>

                          <View style={styles.inputField}>
                            <View style={{flexDirection: "row"} as StyleSheet}>
                              <View style={{flex: 2}}>
                                <Text style={styles.modalInputLabel}>
                                  {t('allAppointment.date_field_label')}
                                </Text>
                              </View>
                              <View>
                                <TouchableOpacity onPress={() => handleOpenDatesData()} style={styles.boxTimeNotAvailable}>
                                  <MaterialIcons name="info-outline" color={COLORS.primary} size={15} style={{marginRight: 3}} />
                                  <Text style={styles.textTimeNotAvailable}>{t('allAppointment.time_not_available')}</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                            <Pressable onPress={() => setOpen(true)}>
                              <Text style={styles.inputModal}>
                                {format(date, 'P', {locale: i18n.language === 'en' ? enUS : fr,})}
                              </Text>
                            </Pressable>
                          </View>
                          <DatePicker
                              modal
                              open={open}
                              date={date}
                              mode="date"
                              minimumDate={today}
                              locale={i18n.language}
                              onConfirm={date => {
                                setOpen(false);
                                setDate(date);
                                setErrorMsgDuty('');
                              }}
                              onCancel={() => {
                                setOpen(false);
                              }}
                          />
                          {errorMsgDuty !== '' && (
                              <View style={{...styles.inputField, zIndex: 0}}>
                                <Text
                                    style={{
                                      ...globalStyles.errorText,
                                      marginTop: -8,
                                      paddingTop: 0,
                                      zIndex: 0,
                                    }}>
                                  {errorMsgDuty}
                                </Text>
                              </View>
                          )}

                          <View style={{...styles.inputField, zIndex: 2}}>
                            <Text style={styles.modalInputLabel}>
                              {t('allAppointment.startime_field_label')}
                            </Text>
                            <DropDownPicker
                                open={openStartTimeHour}
                                value={startTimeValue}
                                items={startTimeData}
                                setOpen={setOpenStartTimeHour}
                                setValue={setStartTimeValue}
                                setItems={setStartTimeData}
                                listMode="SCROLLVIEW"
                                onChangeValue={startTimeValue => {
                                  const startHourFind: any = dataStartTime.find(
                                      (hour: any) => hour.value == startTimeValue,
                                  );
                                  const startHourTab = startHourFind.label.split(':');

                                  const timeStart = set(date, {
                                    hours: parseInt(startHourTab[0]),
                                    minutes: parseInt(startHourTab[1]),
                                    seconds: 0,
                                  });
                                  setStartTime(timeStart);

                                  const timeEnd = set(date, {
                                    hours: parseInt(startHourTab[0]),
                                    minutes: parseInt(startHourTab[1]) + 20,
                                    seconds: 0,
                                  });
                                  setEndTime(timeEnd);
                                  setErrorMsgStartTime('');
                                }}
                                //disabled={true}
                                placeholder={t('allAppointment.startime_field_label')}
                                style={{
                                  borderRadius: 4,
                                  borderColor: COLORS.grayMedium,
                                  padding: 0,
                                }}
                                dropDownContainerStyle={{
                                  borderColor: COLORS.grayMedium,
                                  borderRadius: 4,
                                }}
                                labelStyle={{
                                  color: COLORS.gray,
                                  fontSize: 16,
                                  padding: 0,
                                }}
                                containerStyle={{
                                  borderColor: COLORS.grayLight,
                                  padding: 0,
                                }}
                                placeholderStyle={{
                                  color: COLORS.gray,
                                  fontSize: 16,
                                }}
                                listItemLabelStyle={{
                                  fontSize: 16,
                                  color: COLORS.gray,
                                }}
                                // @ts-ignore
                                language={i18n.language.toUpperCase()}
                            />
                          </View>
                          {errorMsgStartTime !== '' && (
                              <View style={{...styles.inputField, zIndex: 0}}>
                                <Text
                                    style={{
                                      ...globalStyles.errorText,
                                      marginTop: -8,
                                      paddingTop: 0,
                                      zIndex: 0,
                                    }}>
                                  {errorMsgStartTime}
                                </Text>
                              </View>
                          )}

                          <View
                              style={{
                                ...styles.inputField,
                                marginBottom: 40,
                                zIndex: 1,
                              }}>
                            <Text style={styles.modalInputLabel}>
                              {t('allAppointment.endtime_field_label')}
                            </Text>
                            <Pressable onPress={() => setEndTimeOpen(false)}>
                              <Text style={styles.inputModal}>
                                {format(endTime, 'p', {locale: i18n.language === 'en' ? enUS : fr,})}
                              </Text>
                            </Pressable>
                          </View>
                          <DatePicker
                              modal
                              open={openEndTime}
                              date={endTime}
                              minimumDate={startTime}
                              mode="time"
                              locale={i18n.language}
                              onConfirm={endTime => {
                                setEndTimeOpen(false);
                                setEndTime(endTime);
                              }}
                              onCancel={() => {
                                setEndTimeOpen(false);
                              }}
                              style={{zIndex: 1}}
                          />

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

                  <View style={{marginTop: 20}} />
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </SafeAreaView>
          </SafeAreaProvider>
        </Modal>
      </>
  );
}

export default AppointmentForm;
//export default withSnackbar(AppointmentForm);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    backgroundColor: COLORS.white,
  },
  backgroundImage: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 10,
  },
  floatinBtn: {
    width: 50,
    height: 50,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    bottom: 5,
    right: 1,
    elevation: 2,
    backgroundColor: COLORS.secondary,
  },
  searchContainer: {
    padding: 10,
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
  listContainer: {
    flex: 1,
    padding: 10,
    paddingTop: 15,
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
  inputModal: {
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
    padding: 10,
    fontSize: 16,
    borderRadius: 4,
    zIndex: 0,
    color: COLORS.gray,
  },
  textGray: {
    color: COLORS.gray,
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
  boxTimeNotAvailable: {
    flexDirection: "row"
  },
  textTimeNotAvailable: {
    color: COLORS.primary,
    fontSize: 12,
    fontStyle: "italic"
  }
});
