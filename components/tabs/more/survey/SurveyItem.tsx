import React, {useEffect, useState} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTranslation} from "react-i18next";
import {format} from "date-fns";
import {enUS, fr} from "date-fns/locale";
import {COLORS} from "../../../../constants";
import SurveyForm from "./SurveyForm";

function SurveyItem(props: any) {
  const {
    survey,
    setSurveyList,
    setSurveyListOrig,
    snackbarShowMessage,
  } = props;
  const [surveyStatus, setSurveyStatus] = useState(false);
  const [surveyStatusResponse, setSurveyStatusResponse] = useState(false);
  const {t, i18n} = useTranslation();

  useEffect(() => {
    const fetchData = () => {
      if(survey?.sondageReponseDTOModel?.reponse !== '' && survey?.sondageReponseDTOModel !== null) {
        setSurveyStatusResponse(true);
      }
    };
    fetchData();
  }, [survey]);

  return (
    <>
      <View style={styles.documentItem}>
        <View style={styles.documentName}>
          <Pressable onPress={() => {}}>
            <Text style={styles.documentTitle}>{survey?.nom}</Text>
            <Text style={styles.documentDate}>
              {`${t('more.post_survey')} `}
              {format(
                survey?.ladate,
                i18n.language === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy',
                {locale: i18n.language === 'en' ? enUS : fr,},
              )}
            </Text>
          </Pressable>
        </View>
        <View style={styles.downloadButton}>
          <View style={styles.buttonContainer}>
            {surveyStatusResponse ? (
                <TouchableOpacity
                    style={{
                      ...styles.buttom,
                      backgroundColor: COLORS.gray,
                      padding: 4,
                    } as StyleSheet}
                    onPress={() => setSurveyStatus(true)}>
                  <Text style={styles.buttomTextRight}>
                    {t('more.already_participate')}
                  </Text>
                </TouchableOpacity>
            ):(
                <TouchableOpacity
                    style={{
                      ...styles.buttom,
                      backgroundColor: COLORS.secondary,
                      padding: 4,
                    }}
                    onPress={() => setSurveyStatus(true)}>
                  <Text style={styles.buttomTextRight}>
                    {t('more.participate')}
                  </Text>
                </TouchableOpacity>
            )}

          </View>
        </View>
      </View>

      <SurveyForm
        data={survey}
        surveyStatus={surveyStatus}
        setSurveyStatus={setSurveyStatus}
        setSurveyList={setSurveyList}
        setSurveyListOrig={setSurveyListOrig}
        snackbarShowMessage={snackbarShowMessage}
      />
    </>
  );
}

export default SurveyItem;

const styles = StyleSheet.create({
  documentItem: {
    flexDirection: 'row',
    paddingBottom: 10,
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayVeryLight,
  },
  newDocument: {
    flex: 1,
    justifyContent: 'center',
  },
  documentName: {
    flex: 5,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  downloadButton: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  documentTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: COLORS.gray,
  },
  documentDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
  buttonContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  buttom: {
    minWidth: 90,
    borderRadius: 5,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttomTextRight: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
});
