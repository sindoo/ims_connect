import React, {useEffect} from 'react';
import {StyleSheet, Text, Pressable, View, Image} from 'react-native';
import {useTranslation} from "react-i18next";
import {useNavigation} from "expo-router/react-navigation";
import {useDispatch, useSelector} from "react-redux";
import {format, getHours, getMinutes, toDate} from "date-fns";
import {toZonedTime} from "date-fns-tz";
import {COLORS, IMAGES, TIME_ZONE_ABIDJAN} from "../../../constants";
import {BASEURL_IMG} from "../../../api/appUrl";
import {globalStyles} from "../../../style/Global";
import {enUS, fr} from "date-fns/locale";
import {MaterialIcons} from "@expo/vector-icons";
import Card from "../../ui/Card";
import {useRouter} from "expo-router";
import {changeAppLanguage} from "../../../redux/features/language/languageSlice";
import {
  setAppointmentDetailsInRedux
} from "../../../redux/features/appointment/appointmentSlice";

function AppointmentItem(props: any) {
  const {data} = props;
  const {t, i18n} = useTranslation();
  //const navigation: any = useNavigation();
  const {teacherList, employeesClassList} = useSelector((state: any) => state.employee);
  const {selectedChild} = useSelector((state: any) => state.child);
  const selectedChildClass = selectedChild?.eleves.length >0 ? selectedChild?.eleves[0]?.classe : null;
  let indexCrenauChoice = -1;
  const router = useRouter();
  const dispatch = useDispatch();

  let dayDate: any = toDate(data?.dateDebut);
  let datefin: any = toDate(data?.dateFin);
  dayDate = toZonedTime(dayDate, TIME_ZONE_ABIDJAN);
  datefin = toZonedTime(datefin, TIME_ZONE_ABIDJAN);
  let startTime = `${String(getHours(dayDate)).padStart(2, '0')}:${String(getMinutes(dayDate)).padStart(2, '0')}`;
  let endTime = `${String(getHours(datefin)).padStart(2, '0')}:${String(getMinutes(datefin)).padStart(2, '0')}`;

  let employeesFind: any = employeesClassList.find((employee: any) => employee.id === data.creneauRdvs[0]?.creneauRdvEmployees[0]?.employeeId);
  if (data.meetingType === 'PRESET') {
    for (let i = 0; i < data?.creneauRdvs.length; i++) {
      if (data?.creneauRdvs[i]?.creneauRdvEnfantParents?.length > 0) {
        if (data.creneauRdvs[i]?.creneauRdvEnfantParents[0]?.enfantId === selectedChild?.person?.id) {
          dayDate = toDate(data?.creneauRdvs[i]?.creneauRdvEnfantParents[0]?.dateDebut);
          datefin = toDate(data?.creneauRdvs[i]?.creneauRdvEnfantParents[0]?.dateFin);
          dayDate = toZonedTime(dayDate, TIME_ZONE_ABIDJAN);
          datefin = toZonedTime(datefin, TIME_ZONE_ABIDJAN);

          startTime = `${String(getHours(dayDate)).padStart(2, '0')}:${String(getMinutes(dayDate)).padStart(2, '0')}`;
          endTime = `${String(getHours(datefin)).padStart(2, '0')}:${String(getMinutes(datefin)).padStart(2, '0')}`;
          indexCrenauChoice = i;
        }
      }
    }
    //employeesFind = teacherList[0];
  }

  useEffect(() => {
    //console.log(JSON.stringify(data));
  }, [data]);

  return (
    <Card borderRaduis={8} marginBottom={20}>
      <Pressable
        onPress={() => {
            //router.push('/pages/appointment');
            dispatch(setAppointmentDetailsInRedux(data));
            router.push({
              pathname: '/pages/appointment',
              params: {
                data: JSON.stringify(data?.id),
              }
            });
        }}
      >
        <View style={styles.appointmentItem}>
          <View style={styles.appointmentImage}>
            <Image
              source={
                employeesFind !== undefined &&
                employeesFind?.person?.photo !== '' &&
                employeesFind?.person?.photo !== null
                  ? {uri: `${BASEURL_IMG}/${employeesFind?.person?.photo}`}
                  : IMAGES.avatar
              }
              resizeMode="cover"
              style={styles.appointImageCover}
            />
            <View
              style={
                (data.meetingType === 'NORMAL' &&
                  data.meetingStatus === 'CONFIRM' &&
                  styles.validateStatus) ||
                (indexCrenauChoice !== -1 &&
                  data.meetingType === 'PRESET' &&
                  data?.creneauRdvs[indexCrenauChoice]
                    ?.creneauRdvEnfantParents[0]?.meetingStatus === 'CONFIRM' &&
                  styles.validateStatus) ||
                (data.meetingStatus === 'NOT_RESPECTED' &&
                  styles.validateStatus) ||
                (data.meetingStatus === 'WAIT' && styles.pendingStatus) ||
                (data.meetingStatus === 'REPORT' && styles.pendingStatus) ||
                (data.meetingStatus === 'NOT_HELD' && styles.pendingStatus) ||
                (data.meetingStatus === 'PARTIAL_CONFIRM' &&
                  styles.pendingStatus) ||
                (data.meetingStatus === 'CANCEL' && styles.cancelStatus)
              }
            />
          </View>
          <View style={styles.appointmentDetails}>
            <Text style={styles.titleDetail}>{data.objet}</Text>
            {employeesFind !== undefined ? (
                <Text style={globalStyles.paragraph}>
                  {employeesFind.person.prenom} {employeesFind.person.nom}
                </Text>
            ) : (
                <Text style={globalStyles.paragraph}>
                  {t('appointment.no_teacher_selected')} {selectedChildClass?.nom}
                </Text>
            )}
            <Text style={globalStyles.paragraph}>
              {t('appointment.time_slot')} : {startTime} - {endTime}
            </Text>
            {/*<ButtonActionStatus data={data} snackbarShowMessage={snackbarShowMessage} />*/}
          </View>

          <View style={styles.dateContainer}>
            {data.meetingStatus !== 3 && (
              <View style={styles.appointmentDate}>
                <Text
                  style={{
                    ...styles.appointmentDateText,
                    textTransform: 'capitalize',
                  } as StyleSheet}>
                  {format(dayDate, 'EEE', { locale: i18n.language == 'en' ? enUS : fr,})}
                </Text>
                <Text
                  style={{
                    ...styles.appointmentDateText,
                    fontWeight: '700',
                  } as StyleSheet}>
                  {String(dayDate.getDate()).padStart(2, '0')}
                </Text>
              </View>
            )}
            {data.status === 3 && (
              <Pressable>
                <MaterialIcons
                  name="close"
                  size={18}
                  color={COLORS.gray}
                  style={{textAlign: 'right'} as StyleSheet}
                />
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    </Card>
  );
}

export default AppointmentItem;

const styles = StyleSheet.create({
  appointmentItem: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
    paddingLeft: 0,
  },
  appointmentImage: {
    flex: 2,
    alignItems: 'center',
  },
  appointImageCover: {
    width: 65,
    height: 65,
    overflow: 'hidden',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  appointmentDetails: {
    flex: 5,
  },
  dateContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  validateStatus: {
    width: 13,
    height: 13,
    borderRadius: 10,
    marginTop: 5,
    backgroundColor: COLORS.greenLight,
  },
  pendingStatus: {
    width: 13,
    height: 13,
    borderRadius: 10,
    marginTop: 5,
    backgroundColor: COLORS.orange,
  },
  cancelStatus: {
    width: 13,
    height: 13,
    borderRadius: 10,
    marginTop: 5,
    backgroundColor: COLORS.red,
  },
  titleDetail: {
    fontWeight: '700',
    fontSize: 14,
    color: COLORS.gray,
  },
  buttomContainer: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 5,
    alignItems: 'center',
  },
  buttom: {
    minWidth: 90,
    borderRadius: 5,
    padding: 6,
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttomTextLeft: {
    color: COLORS.gray,
    fontWeight: '400',
  },
  buttomTextRight: {
    color: COLORS.white,
    fontWeight: '400',
  },
  appointmentDate: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    height: 75,
    width: 40,
    backgroundColor: COLORS.blueLight,
  },
  appointmentDateText: {
    color: COLORS.gray,
    fontSize: 16,
  },
  normalLeftButtom: {
    backgroundColor: COLORS.grayVeryLight,
    borderColor: COLORS.grayLight,
    borderWidth: 1,
  },
  cancelButtom: {
    backgroundColor: COLORS.grayVeryLight,
  },
  normalRightButtom: {
    backgroundColor: COLORS.primary,
  },
  buttomCancelText: {
    color: COLORS.grayLight,
    fontWeight: '400',
  },
});
