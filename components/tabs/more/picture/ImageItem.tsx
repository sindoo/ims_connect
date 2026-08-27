import React, {useEffect, useState} from 'react';
import {
  Keyboard,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {BASEURL_IMG} from "../../../../api/appUrl";
import {COLORS, IMAGES} from "../../../../constants";
import {Image} from "expo-image";
import {MaterialIcons} from "@expo/vector-icons";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";

function ImageItem(props: any) {
  const {
    pictureData,
    countImageSelected,
    numberImageChecked,
    pictureIdList,
    setPictureIdList,
  } = props;
  const [checked, setChecked] = useState(false);
  const [imageModal, setImageModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [childPicture, setChildPicture] = useState(null);

  const handleImageSelected = (pictureId: any) => {
    setChecked(!checked);
    if (!checked) {
      countImageSelected(numberImageChecked + 1);
      if (!pictureIdList.includes(pictureId)) {
        setPictureIdList([...pictureIdList, pictureId]);
      }
    } else {
      if (numberImageChecked > 0) {
        countImageSelected(numberImageChecked - 1);
        const listFiltered = pictureIdList.filter(
          (pic: any) => pic !== pictureId,
        );
        setPictureIdList(listFiltered);
      } else {
        countImageSelected(0);
        setPictureIdList([]);
      }
    }
  };

  const handleDisplayModal = () => {
    setImageModal(true);
  };

  useEffect(() => {
    setLoading(true);
    setChildPicture(pictureData?.uri);
    setLoading(false);
  }, [childPicture]);

  return (
    <>
      <Pressable
        onPress={() => handleDisplayModal()}
        onLongPress={() => handleImageSelected(pictureData.id)}>
        <View style={styles.imageContainer}>
          <Image
            source={
              pictureData.uri !== ''
                ? {uri: `${BASEURL_IMG}/${pictureData.uri}`}
                : IMAGES.avatar
            }
            style={styles.childPicture}
            contentFit="cover"
          />
          {checked ? (
            <MaterialIcons
              name="check-circle"
              color={COLORS.secondary}
              size={22}
              style={{left: 85, top: -106}}
            />
          ) : (
            ''
          )}
        </View>
      </Pressable>

      <Modal
        visible={imageModal}
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
                        setImageModal(false);
                      }}
                    />
                  </TouchableWithoutFeedback>
                </View>
                <View style={styles.modalContent}>
                  {loading && <Loding />}
                  {childPicture !== null && (
                    <>
                      <Image
                        source={
                          pictureData.uri !== ''
                            ? {uri: `${BASEURL_IMG}/${pictureData.uri}`}
                            : IMAGES.avatar
                        }
                        style={styles.childPictureZoom}
                        contentFit="cover"
                      />

                      <View
                        style={{
                          marginTop: 20,
                          padding: 10,
                          paddingRight: 30,
                          alignItems: 'flex-end',
                        } as StyleSheet}>
                        <TouchableWithoutFeedback
                          onPress={() =>
                            Linking.openURL(`${BASEURL_IMG}/${pictureData.uri}`)
                          }>
                          <MaterialIcons
                            name="download"
                            size={32}
                            color={COLORS.gray}
                          />
                        </TouchableWithoutFeedback>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </>
  );
}

export default ImageItem;

const styles = StyleSheet.create({
  imageContainer: {
    width: 108,
    height: 108,
    marginRight: 15,
    marginBottom: 20,
    backgroundColor: COLORS.grayVeryLight,
  },
  childPicture: {
    width: '100%',
    height: 108,
  },
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
  },
  childPictureZoom: {
    width: '100%',
    height: '80%',
    //height: '100%',
  },
});
