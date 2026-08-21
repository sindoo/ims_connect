import {
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import LanguageItem from './LanguageItem';
import React from 'react';
import {useTranslation} from 'react-i18next';
import {MaterialIcons} from "@expo/vector-icons";
import {COLORS, LANGUAGE_EN, LANGUAGE_FR} from "../../../constants";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";

export default function LanguageComponent({
  modal,
  languageValue,
  setModal,
  handleLanguageChange,
}: {
  modal: any;
  languageValue: any;
  setModal: any;
  handleLanguageChange: any;
}) {
  const {t, i18n} = useTranslation();

  return (
    <Modal visible={modal} animationType="slide" style={{marginTop: 100}}>
      <SafeAreaProvider>
        <SafeAreaView style={{flex: 1, backgroundColor: 'transparent'}}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitle}>
                <Text style={styles.modalTitleText}>
                  {t('settings.language_choice')}
                </Text>
              </View>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <MaterialIcons
                    name="close"
                    size={22}
                    color={COLORS.gray}
                    onPress={() => {
                      setModal(false);
                    }}
                />
              </TouchableWithoutFeedback>
            </View>

            <View style={styles.modalContent}>
              <LanguageItem
                  data={i18n.language === 'en' ? LANGUAGE_EN : LANGUAGE_FR}
                  onSelect={(value: any) => handleLanguageChange(value)}
                  defaultValue={languageValue}
              />
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  languageItem: {
    flexDirection: 'row',
    height: 35,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayVeryLight,
    marginBottom: 10,
  },
  textLangContainer: {
    flex: 2,
    justifyContent: 'center',
    paddingLeft: 5,
  },
  selectLangContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 5,
    alignContent: 'flex-end',
    alignItems: 'flex-end',
    right: 5,
  },
});
