import React, {useEffect, useState} from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {Formik} from 'formik';
import * as yup from 'yup';
import {useTranslation} from "react-i18next";
import {useSelector} from "react-redux";
import {MaterialIcons} from "@expo/vector-icons";
import {COLORS} from "../../../../constants";
import {format} from "date-fns";
import {enUS, fr} from "date-fns/locale";
import {globalStyles} from "../../../../style/Global";
import SurveyService from "../../../../services/SurveyService";
import FlatButton from "../../../ui/FlatButton";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";


const surveyFormSchema = yup.object({
  opinionSurvey: yup.string().required(),
});

function SurveyForm({
  data,
  surveyStatus,
  setSurveyStatus,
  snackbarShowMessage,
  setSurveyList,
  setSurveyListOrig,
}: any) {
  const {t, i18n} = useTranslation();
  const [buttonStatus, setButtonStatus] = useState(false);
  const [statusEdit, setStatusEdit] = useState(false);
  const [buttonEdit, setButtonEdit] = useState(false);
  const [inputStatus, setInputStatus] = useState(false);
  const {selectedChild} = useSelector((state: any) => state.child);
  const {user, userFCMToken} = useSelector((state: any) => state.user);

  const handleEditButton = () => {
    setButtonEdit(false);
    setInputStatus(true);
  };

  useEffect(() => {
    const fetchData = () => {
      if(data !== undefined){
        const valueStatus = data?.sondageReponseDTOModel?.reponse === '';
        setStatusEdit(valueStatus);
        setButtonEdit(!valueStatus);
        //setButtonEdit(valueStatus);
        let statusInput = valueStatus;
        if(data?.terminer === true) {
          statusInput = false;
        }
        setInputStatus(statusInput);
      }
    };
    fetchData();
  }, [data]);

  return (
    <Modal
      visible={surveyStatus}
      animationType="slide"
      style={{marginTop: 100}}
    >
      <SafeAreaProvider>
        <SafeAreaView style={{flex: 1, backgroundColor: 'transparent'}}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitle} />
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <MaterialIcons
                    name="close"
                    size={28}
                    color={COLORS.gray}
                    onPress={() => {
                      setSurveyStatus(false);
                    }}
                  />
                </TouchableWithoutFeedback>
              </View>
              <View style={styles.modalContent}>
                <View style={styles.surveyContainer}>
                  <Text style={styles.titleDetail}>{data?.nom} </Text>
                  <Text
                    style={{
                      textAlign: 'center',
                      fontSize: 13,
                      color: COLORS.gray,
                      marginBottom: 20,
                    }as StyleSheet}>
                    {`${t('more.post_survey')} `}
                    {format(
                      data?.ladate,
                      i18n.language === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy',
                      {locale: i18n.language === 'en' ? enUS : fr,},
                    )}
                  </Text>
                  <Text style={{...globalStyles.paragraph, textAlign: 'left'} as StyleSheet}>
                    Question :{' '}
                  </Text>
                  <Text
                    style={{
                      ...globalStyles.paragraph,
                      fontWeight: '700',
                      marginBottom: 10,
                    } as StyleSheet}>{`${data.question}`}</Text>

                  <Formik
                    initialValues={{
                      opinionSurvey:
                        data?.sondageReponseDTOModel?.reponse !== ''
                          ? data?.sondageReponseDTOModel?.reponse
                          : '',
                    }}
                    validationSchema={surveyFormSchema}
                    onSubmit={async (surveyResponse: any, actions: any) => {
                      setButtonStatus(true);
                      try {
                        if(selectedChild !== null && user !== null && userFCMToken !== null) {
                          await SurveyService.updateSurvey(selectedChild, user, userFCMToken, surveyResponse, data);
                          setButtonStatus(false);
                          setSurveyStatus(false);

                          const classId = selectedChild.eleves[0]?.classe?.id;
                          const userId = user.id;
                          if(classId !== undefined) {
                            const surveyListReq = await SurveyService.getAllSurvey(classId, userId);
                            setSurveyList(surveyListReq);
                            setSurveyListOrig(surveyListReq);
                          }
                          snackbarShowMessage(t('snackBar.sb_succes_save'));
                        }
                      } catch (error) {
                        console.log(error);
                        setButtonStatus(false);
                        setSurveyStatus(false);
                        snackbarShowMessage(t('snackBar.sb_error'));
                      }
                    }}>
                    {formikProps => (
                      <>
                        <Text
                          style={{
                            ...globalStyles.paragraph,
                            textAlign: 'left',
                            marginBottom: 5,
                          } as StyleSheet}>
                          {t('survey.answer')} :
                        </Text>
                        <View style={{flexDirection: 'row'} as StyleSheet}>
                          <TextInput
                            multiline
                            style={{...styles.inputModal, flex: 1}}
                            placeholder={t('survey.description_placeholder')}
                            placeholderTextColor={COLORS.grayLight}
                            onChangeText={formikProps.handleChange(
                              'opinionSurvey',
                            )}
                            value={formikProps.values.opinionSurvey}
                            onBlur={formikProps.handleBlur('opinionSurvey')}
                            editable={inputStatus}
                          />
                          {buttonEdit && data?.terminer === false && (
                            <>
                              <Pressable onPress={() => handleEditButton()}>
                                <MaterialIcons
                                  name="edit"
                                  color={COLORS.secondary}
                                  size={27}
                                  style={{marginTop: 5, marginLeft: 10}}
                                />
                              </Pressable>
                            </>
                          )}
                        </View>

                        <Text style={{...globalStyles.errorText}}>
                          {formikProps.touched.opinionSurvey &&
                            formikProps.errors.opinionSurvey && (
                              <Text style={{color: COLORS.red}}>
                                {t('login.required_field')}
                              </Text>
                            )}

                          {data?.terminer === true && (
                            <Text style={{color: COLORS.red}}>
                              {t('more.survey_done')}
                            </Text>
                          )}
                        </Text>

                        <View style={{marginBottom: 35}} />

                        {statusEdit ? (
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
                        ) : (
                          <FlatButton
                            title={'Modifier'}
                            fontWeight="500"
                            fontSize={16}
                            backgroundColor={COLORS.secondary}
                            paddingVertical={12}
                            borderRadius={20}
                            onPress={formikProps.handleSubmit}
                            //disabled={buttonEdit}
                            disabled={buttonStatus}
                          />
                        )}
                      </>
                    )}
                  </Formik>
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

export default SurveyForm;
//export default withSnackbar(SurveyForm);

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    padding: 0,
  },
  modalTitle: {
    flex: 1,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    paddingBottom: 5,
    paddingTop: 5,
    paddingRight: 10,
  },
  modalContent: {
    flex: 1,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  surveyContainer: {
    flex: 1,
    //flexDirection: 'row',
    padding: 15,
    paddingTop: 0,
  },
  surveyDetails: {
    flex: 1,
  },
  titleDetail: {
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.secondary,
    marginBottom: 5,
  },
  inputModal: {
    borderWidth: 1,
    borderColor: COLORS.grayMedium,
    padding: 10,
    marginBottom: 5,
    fontSize: 16,
    borderRadius: 4,
    zIndex: 0,
    color: COLORS.gray,
  },
});
