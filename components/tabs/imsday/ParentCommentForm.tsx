import React, {useEffect} from 'react';
import {
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {COLORS} from '../../../constants';
import {useTranslation} from 'react-i18next';
import * as yup from 'yup';
import {Formik} from 'formik';
import FlatButton from "../../ui/FlatButton";
import {MaterialIcons} from "@expo/vector-icons";
import {globalStyles} from "../../../style/Global";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";

const imsDayCommentFormSchema = yup.object({
  commentParentImsDay: yup.string().required(),
});

function ParentCommentForm({
  imsDayInfo,
  imsDayParentModalStatus,
  setImsDayParentModalStatus,
  setCommentParent,
  commentParent,
  handleTextChange,
  saveParentObservation,
  index,
}: any) {
  const {t} = useTranslation();

  useEffect(() => {}, []);

  return (
    <Modal
      visible={imsDayParentModalStatus}
      animationType="slide"
      style={{marginTop: 100}}
      //transparent={true}
    >
      <SafeAreaProvider>
        <SafeAreaView style={{flex: 1, backgroundColor: 'transparent'}}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitle} />
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <MaterialIcons
                    name="close"
                    size={28}
                    color={COLORS.gray}
                    onPress={() => {
                      setImsDayParentModalStatus(false);
                    }}
                  />
                </TouchableWithoutFeedback>
              </View>
              <View style={styles.modalContent}>
                <View style={styles.commentContainer}>
                  <Formik
                    initialValues={{
                      commentParentImsDay: commentParent,
                    }}
                    validationSchema={imsDayCommentFormSchema}
                    onSubmit={(commentData: any, actions: any) => {
                      saveParentObservation(
                        index,
                        commentData.commentParentImsDay,
                      );
                      setImsDayParentModalStatus(false);
                    }}>
                    {formikProps => (
                      <>
                        <Text style={globalStyles.titleH2}>
                          {t('myDayAtIms.parent_comment')}
                        </Text>
                        <View style={{flexDirection: 'row'} as StyleSheet}>
                          <TextInput
                            multiline
                            placeholderTextColor={COLORS.grayLight}
                            style={{...styles.inputModal, flex: 1}}
                            placeholder={t('myDayAtIms.description_placeholder')}
                            onChangeText={formikProps.handleChange(
                              'commentParentImsDay',
                            )}
                            value={formikProps.values.commentParentImsDay}
                            onBlur={formikProps.handleBlur('commentParentImsDay')}
                            editable={true}
                          />
                        </View>
                        <Text style={{...globalStyles.errorText}}>
                          {formikProps.touched.commentParentImsDay &&
                            formikProps.errors.commentParentImsDay && (
                              <Text style={{color: COLORS.red}}>
                                {t('login.required_field')}
                              </Text>
                            )}
                        </Text>
                        <View style={{marginBottom: 30}} />
                        <FlatButton
                          title={t('allAppointment.save_form')}
                          fontWeight="500"
                          fontSize={16}
                          backgroundColor={COLORS.secondary}
                          paddingVertical={12}
                          borderRadius={20}
                          onPress={formikProps.handleSubmit}
                          disabled={false}
                        />
                      </>
                    )}
                  </Formik>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

export default ParentCommentForm;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    paddingTop: 5,
    paddingBottom: 5,
    paddingRight: 10,
  },
  modalTitle: {
    flex: 1,
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  commentContainer: {
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
