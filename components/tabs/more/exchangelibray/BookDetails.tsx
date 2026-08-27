import React from 'react';
import {
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {useTranslation} from "react-i18next";
import {MaterialIcons} from "@expo/vector-icons";
import {COLORS, IMAGES} from "../../../../constants";
import {BASEURL_IMG} from "../../../../api/appUrl";
import {globalStyles} from "../../../../style/Global";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {Image} from "expo-image";


function BookDetails({data, bookDetail, setBookDetail, donor}: any) {
  const {t} = useTranslation();

  return (
    <Modal
      visible={bookDetail}
      animationType="slide"
      style={{marginTop: 100}}
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
                      setBookDetail(false);
                    }}
                  />
                </TouchableWithoutFeedback>
              </View>
              <ScrollView style={styles.modalContent}>
                <View style={styles.bookDetailContainer}>
                  <View style={styles.bookImage}>
                    <Image
                      source={
                        data?.photo !== ''
                          ? {uri: `${BASEURL_IMG}/${data?.photo}`}
                          : IMAGES.noBookImage
                      }
                      contentFit="cover"
                      style={styles.bookImageCover}
                    />
                  </View>

                  <View style={styles.bookInfoDetails}>
                    <Text style={styles.titleDetail}>{data?.nom} </Text>
                    <Text
                      style={{...globalStyles.paragraph, textAlign: 'justify'} as StyleSheet}>
                      {data?.description}
                    </Text>
                    <View style={{marginBottom: 15}} />
                    <Text
                      style={{
                        fontWeight: 'bold',
                        fontSize: 12,
                        color: COLORS.gray,
                      } as StyleSheet}>
                      {t('more.book_author')} : {data?.auteur}
                    </Text>
                    <Text
                      style={{
                        fontWeight: 'bold',
                        fontSize: 12,
                        color: COLORS.gray,
                      } as StyleSheet}>
                      {t('more.book_language')} : {data?.langue}
                    </Text>
                    <Text
                      style={{
                        fontWeight: 'bold',
                        fontSize: 12,
                        color: COLORS.gray,
                      } as StyleSheet}>
                      {t('more.book_donated_by')} : {donor}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

export default BookDetails;

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
    padding: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  bookDetailContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
    paddingLeft: 0,
  },
  bookImage: {
    flex: 2,
    alignItems: 'center',
  },
  bookImageCover: {
    width: 75,
    height: 75,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.grayVeryLight,
    backgroundColor: COLORS.grayVeryLight,
  },
  bookInfoDetails: {
    flex: 6,
  },
  titleDetail: {
    fontWeight: '700',
    fontSize: 14,
    color: COLORS.secondary,
  },
});
