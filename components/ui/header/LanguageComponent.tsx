import {
  ActivityIndicator,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import LanguageItem from './LanguageItem';
import React, {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {MaterialIcons} from "@expo/vector-icons";
import {COLORS, LANGUAGE_EN, LANGUAGE_FR} from "../../../constants";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";

function LanguageComponent({
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
  const [isChanging, setIsChanging] = useState(false);

  // Reinitialise l'indicateur a chaque fermeture de la modale, pour ne pas
  // rester bloque en "loading" si elle est rouverte plus tard.
  useEffect(() => {
    if (!modal) {
      setIsChanging(false);
    }
  }, [modal]);

  const handleSelect = useCallback(async (value: any) => {
    setIsChanging(true);
    await handleLanguageChange(value);
    // Pas de setIsChanging(false) ici : handleLanguageChange ferme la
    // modale (setModal(false)) apres son propre delai, et c'est cette
    // fermeture qui reinitialise l'indicateur via l'effet ci-dessus.
  }, [handleLanguageChange]);

  return (
      <Modal visible={modal} animationType="slide" style={styles.modalRoot}>
        <SafeAreaProvider>
          <SafeAreaView style={styles.safeArea}>
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
                {isChanging ? (
                    <View style={styles.loadingWrapper}>
                      <ActivityIndicator size="large" color={COLORS.secondary} />
                    </View>
                ) : (
                    <LanguageItem
                        data={i18n.language === 'en' ? LANGUAGE_EN : LANGUAGE_FR}
                        onSelect={handleSelect}
                        defaultValue={languageValue}
                    />
                )}
              </View>
            </View>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
  );
}

// Rendu a l'interieur du CustomHeader (qui est lui-meme memoise) : on
// memoise aussi ce composant pour eviter un re-rendu du Modal + de
// SafeAreaProvider/SafeAreaView quand le header se re-rend pour une raison
// qui ne concerne pas la langue (ex: changement d'enfant selectionne).
export default React.memo(LanguageComponent);

const styles = StyleSheet.create({
  // ✅ Ces deux objets ({marginTop:100} et {flex:1, backgroundColor:
  // 'transparent'}) etaient recrees a chaque rendu du parent (CustomHeader)
  // puisque ce composant est toujours monte, meme quand la modale est
  // fermee (visible={modal}). Hoistes ici, ce sont desormais des reference
  // stables.
  modalRoot: {
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
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
