import React from 'react';
import {StyleSheet, Text, Pressable, View} from 'react-native';
import {useTranslation} from "react-i18next";
import {useNavigation} from "expo-router/react-navigation";
import {COLORS, ROUTES} from "../../../constants";
import {globalStyles} from "../../../style/Global";
import {format} from "date-fns";
import {enUS, fr} from "date-fns/locale";
import Card from "../../ui/Card";
import {useRouter} from "expo-router";
import {setAppointmentDetailsInRedux} from "../../../redux/features/appointment/appointmentSlice";
import {useDispatch} from "react-redux";


export default function AppointmentItemPreset({data}: any) {
  const {t, i18n} = useTranslation();
  const navigation: any = useNavigation();
  const language = i18n.language;
  const router = useRouter();
  const dispatch = useDispatch();

  return (
    <Card borderRaduis={8} marginBottom={20}>
      <Pressable
        onPress={() => {
          dispatch(setAppointmentDetailsInRedux(data));
          router.push({
            pathname: '/pages/appointment/preset-appointment-details',
            params: {
              data:  JSON.stringify(data?.id),
              location: ''
            }
          })
        }}>
        <View style={{...styles.appointmentItem, marginRight: 10}}>
          <View style={styles.appointmentDetails}>
            <View style={{flexDirection: 'row', marginBottom: 10} as StyleSheet}>
              <View
                style={{
                  ...((data.meetingStatus === 'CONFIRM' &&
                    styles.validateStatus) ||
                    (data.meetingStatus === 'WAIT' && styles.pendingStatus) ||
                    (data.meetingStatus === 'PARTIAL_CONFIRM' &&
                      styles.pendingStatus) ||
                    (data.meetingStatus === 'CANCEL' && styles.cancelStatus)),
                  marginRight: 10,
                }}
              />
              <Text style={styles.titleDetail}>{data.objet}</Text>
            </View>

            <Text style={globalStyles.paragraph}>
              {t('presetAppointment.date_start')} :{' '}
              {format(data.dateDebut, 'dd MMMM yyyy', {locale: language === 'en' ? enUS : fr,})}
            </Text>
            <Text style={globalStyles.paragraph}>
              {t('presetAppointment.date_end')} :{' '}
              {format(data.dateFin, 'dd MMMM yyyy', {locale: language === 'en' ? enUS : fr,})}
            </Text>
          </View>
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  appointmentItem: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
    paddingLeft: 10,
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
