import React, {useEffect, useState} from 'react';
import {
  Button, Modal,
  ScrollView,
  StyleSheet, Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {useTranslation} from "react-i18next";
import {COLORS} from "../../../constants";
import {MaterialIcons} from "@expo/vector-icons";
import Loading from "../../ui/Loading";
import {format, toDate} from "date-fns";
import {enUS, fr} from "date-fns/locale";
import FlatButton from "../../ui/FlatButton";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";

function DatesReservedModal({visibility, setOpenDates, openDatesData}: any) {
  const {t, i18n} = useTranslation();
  const [loading, setLoading] = useState(true);

  const handleCloseAlertModal = () => {
    setOpenDates(false);
    setLoading(false);
  };

  useEffect(() => {
    //console.log(JSON.stringify(openDatesData));
    setLoading(false);
  }, []);

  return (
      <Modal isVisible={visibility} backdropOpacity={0.3}>
        <SafeAreaProvider>
          <SafeAreaView style={{flex: 1, backgroundColor: 'transparent'}}>
          <View style={styles.modalContainer}>
            <View style={styles.contentContainer}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitle}>
                  <Text style={styles.modalTitleText}>
                    {t('allAppointment.information_dates_not_available')}
                  </Text>
                </View>
                <TouchableWithoutFeedback onPress={() => handleCloseAlertModal()}>
                  <MaterialIcons name="close" size={22} color={COLORS.gray} style={{paddingHorizontal: 5}} />
                </TouchableWithoutFeedback>
              </View>
              {loading ? (
                  <View style={{flex: 1}}>
                    <Loading size="small" />
                  </View>
              ) : (
                  <>
                    <ScrollView style={styles.modalContent}>
                      <Text style={styles.titleDetail}>{t('allAppointment.information_text_dates_not_available')}</Text>
                      {(openDatesData?.length === 0 || false) && (
                          <View style={{marginTop: 20}}>
                            <Text style={{textAlign: 'center'} as StyleSheet}>
                              {t('allAppointment.empty_open_date')}
                            </Text>
                          </View>
                      )}
                      <View style={{flexDirection: "row", flexWrap: "wrap", paddingTop: 20} as StyleSheet}>
                        {openDatesData?.length > 0 && openDatesData.map((dates: any) => {
                          let dayDate: any = toDate(dates?.dateDebut);
                          return (
                              <View style={{backgroundColor: COLORS.secondaryLight, paddingHorizontal: 10, paddingVertical:5, marginRight: 10, marginBottom: 13, borderRadius: 10}} key={dates.id}>
                                <Text style={{color: COLORS.gray, textTransform: "capitalize"} as StyleSheet}>
                                  {format(
                                      dayDate,
                                      i18n.language === 'en'
                                          ? 'MM/dd/yyyy - H:mm'
                                          : 'dd/MM/yyyy - H:mm',
                                      {locale: i18n.language === 'en' ? enUS : fr},
                                  )}
                                </Text>
                              </View>
                          )
                        })}
                      </View>
                    </ScrollView>

                    <View style={{marginTop: 20, marginBottom: 10}}>
                      <FlatButton
                          title={t('home.alert_notification_close')}
                          fontWeight="400"
                          fontSize={16}
                          backgroundColor={COLORS.redIms}
                          paddingVertical={12}
                          borderRadius={20}
                          onPress={() => handleCloseAlertModal()}
                          disabled={false}
                      />
                    </View>
                  </>
              )
              }
            </View>
          </View>
        </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
  );
}

export default DatesReservedModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    paddingTop: 15,
    minHeight: 400,
    width: '100%',
    padding: 15,
    backgroundColor: COLORS.grayExtraLight,
  },
  modalHeader: {
    flexDirection: 'row',
    paddingTop: 5,
    paddingBottom: 5,
    padding: 15,
  },
  modalTitle: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitleText: {
    fontSize: 17,
    letterSpacing: 1,
    color: COLORS.gray,
  },
  modalContent: {
    flex: 1,
    paddingTop: 15,
  },
  titleDetail: {
    fontWeight: '400',
    fontSize: 13,
    textAlign: 'center',
    color: COLORS.gray,
    marginBottom: 5,
  },
});
