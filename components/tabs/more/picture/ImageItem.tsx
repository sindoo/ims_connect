import React, {useEffect, useState} from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {File, Paths} from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import {BASEURL_IMG} from "../../../../api/appUrl";
import {COLORS, IMAGES} from "../../../../constants";
import {Image} from "expo-image";
import {MaterialIcons} from "@expo/vector-icons";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import Loading from "../../../ui/Loading";
import {t} from "i18next";

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
  // Empêche un double-tap pendant le téléchargement (voir
  // handleDownloadImage) et permet d'afficher un loader à la place de
  // l'icône pendant l'opération.
  const [downloading, setDownloading] = useState(false);

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

  // Télécharge la photo affichée dans la modale et l'enregistre dans la
  // galerie/pellicule du téléphone (remplace l'ancien Linking.openURL, qui
  // se contentait d'ouvrir l'URL dans le navigateur sans rien sauvegarder).
  //
  // 1. Demande la permission d'écrire dans la médiathèque (expo-media-library) ;
  //    si elle est refusée, on prévient l'utilisateur et on s'arrête là.
  // 2. Télécharge l'image distante vers un fichier temporaire local
  //    (expo-file-system) : MediaLibrary ne peut pas enregistrer une image
  //    directement depuis une URL réseau, il lui faut un fichier local.
  // 3. Ajoute ce fichier local à la galerie du téléphone.
  const handleDownloadImage = async () => {
    if (!pictureData?.uri || downloading) return;

    setDownloading(true);
    try {
      const {status} = await MediaLibrary.requestPermissionsAsync(true); // écriture seule : pas d'accès en lecture aux photos
      if (status !== 'granted') {
        Alert.alert(
            t('imageChild.access_authorisation_title'),
            t('imageChild.access_authorisation_message')
        );
        return;
      }

      const remoteUrl = `${BASEURL_IMG}/${pictureData.uri}`;
      // Reprend l'extension du fichier distant (jpg, png...) ; à défaut,
      // "jpg" par sécurité pour que le fichier reste ouvrable.
      const extension = pictureData.uri.split('.').pop() || 'jpg';
      // Destination précise (un File, pas juste un Directory) pour choisir
      // nous-mêmes le nom du fichier local plutôt que de laisser
      // downloadFileAsync le déduire des en-têtes de la réponse.
      // "idempotent: true" évite une erreur si un fichier du même nom existe
      // déjà dans le cache (ex : deuxième téléchargement de la même photo).
      const destinationFile = new File(Paths.cache, `ims_photo_${pictureData.id}.${extension}`);
      const downloadedFile = await File.downloadFileAsync(remoteUrl, destinationFile, {idempotent: true});
      await MediaLibrary.saveToLibraryAsync(downloadedFile.uri);

      Alert.alert(
          //'Photo enregistrée',
          t('imageChild.save_picture_title'),
          t('imageChild.save_picture_message')
      );
    } catch (error) {
      console.log(error);
      Alert.alert(
          t('imageChild.download_msg_error_title'),
          t('imageChild.download_error_message')
      );
    } finally {
      setDownloading(false);
    }
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
                    {loading && <Loading />}
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
                            {downloading ? (
                                <Loading size="small" />
                            ) : (
                                <Pressable onPress={handleDownloadImage}>
                                  <MaterialIcons
                                      name="download"
                                      size={32}
                                      color={COLORS.gray}
                                  />
                                </Pressable>
                            )}
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
