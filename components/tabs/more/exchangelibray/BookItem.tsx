import React, {memo, useEffect, useState, useCallback} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {TBookItemProps} from "../../../../lib/type/TExchangeLibraryProps";
import {useTranslation} from "react-i18next";
import {BASEURL_IMG} from "../../../../api/appUrl";
import {COLORS, IMAGES} from "../../../../constants";
import {globalStyles} from "../../../../style/Global";
import Card from "../../../ui/Card";
import {Image} from "expo-image";
import ExchangeLibraryService from "../../../../services/ExchangeLibraryService";
import ZoomImageBox from "../../../ui/ZoomImage";
import {MaterialIcons} from "@expo/vector-icons";
import {format} from "date-fns";

const BookItem = memo(
    function BookItem({
                        data,
                        bookStatus,
                        borrowChildStatus,
                        comeBackDate,
                        handleBorrowBook,
                        setBookDetail,
                        setDonor,
                        setDataBook,
                          setBookCategory,
                          borrowStatusType
                      }: TBookItemProps) {

      const {t} = useTranslation();
      const [borrowLoadingItem, setBorrowLoadingItem] = useState(false);
      const [dataSelected, setDataSelected] = useState<any>(null);
      const [imageModal, setImageModal] = useState(false);

      // Gestion des détails du livre - Memoized
      const handleBookDetails = useCallback((bookData: any) => {
        setBookDetail(true);
        setDataBook(bookData);
        setDonor(bookData?.donateurs);
      }, [setBookDetail, setDataBook, setDonor]);

      // Gestion de l'emprunt - Memoized
      const handleBorrowBookLoading = useCallback(async () => {
        try {
          setBorrowLoadingItem(true);
          await handleBorrowBook(data, setBorrowLoadingItem);
        } catch (error) {
          console.log('Borrow error:', error);
          setBorrowLoadingItem(false);
        }
      }, [data, handleBorrowBook]);

      // Récupération de la catégorie du livre
      useEffect(() => {
        let isMounted = true;

        const fetchCategory = async () => {
          try {
            const bookCategoryId = data?.livreCategorieId;
            if (bookCategoryId) {
              const response = await ExchangeLibraryService.getCategoryBookById(bookCategoryId);

              if (isMounted) {
                const newData = {
                  ...data,
                  bookCategoryName: response?.nom || ''
                };
                setDataSelected(newData);
                if (setBookCategory) {
                  setBookCategory(response?.nom || '');
                }
              }
            } else {
              if (isMounted) {
                setDataSelected(data);
              }
            }
          } catch (error) {
            console.log('Fetch category error:', error);
            if (isMounted) {
              setDataSelected(data);
            }
          }
        };

        fetchCategory();

        return () => {
          isMounted = false;
        };
      }, [data, setBookCategory]);

      // Formatage de la date de retour
      const formatReturnDate = useCallback((date: string) => {
        if (!date) return '';
        try {
          const returnDate = new Date(date);
          return returnDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        } catch {
          return '';
        }
      }, []);

      // Rendu du statut d'emprunt
      const renderBorrowStatus = useCallback(() => {
        if (bookStatus && borrowChildStatus) {
          return (
              <Text style={styles.borrowStatusText}>
                {t('more.borrow_status')}
              </Text>
          );
        }
        return null;
      }, [bookStatus, borrowChildStatus, t]);

      // Rendu de la date de retour
      const renderReturnDate = useCallback(() => {
        if (comeBackDate && data?.dateRetour !== null) {
          return (
              <Text style={styles.returnDateText}>
                {t('more.return_date')} : {formatReturnDate(data.dateRetour)}
              </Text>
          );
        }
        return null;
      }, [comeBackDate, data?.dateRetour, formatReturnDate, t]);

      const renderBorrowStatusType = useCallback( () => {
          if (comeBackDate && data?.dateEmprunt === null) {
              return (
                  <View style={{flexDirection: 'row'} as StyleSheet}>
                      <Text style={styles.pendingStatus}>
                          En attente de confirmation
                      </Text>
                  </View>
              );
          }
          return null;
      }, [borrowStatusType, data?.dateEmprunt])

      // Rendu du bouton d'emprunt
      const renderBorrowButton = useCallback(() => {
        if (!borrowChildStatus) {
          return (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: COLORS.grayLightMenu }]}
                    onPress={borrowLoadingItem ? undefined : handleBorrowBookLoading}
                    disabled={borrowLoadingItem}
                    activeOpacity={0.7}
                >
                  {borrowLoadingItem ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                      <Text style={styles.buttonTextRight}>
                        {t('more.borrow')}
                      </Text>
                  )}
                </TouchableOpacity>
              </View>
          );
        }
        return null;
      }, [borrowChildStatus, borrowLoadingItem, handleBorrowBookLoading, t]);

      // Construction de l'URI de l'image
      const imageUri = useCallback(() => {
        if (dataSelected?.photo && dataSelected.photo !== '') {
          return { uri: `${BASEURL_IMG}/${dataSelected.photo}` };
        }
        return IMAGES.noBookImage;
      }, [dataSelected?.photo]);

      if (!dataSelected) {
        return null;
      }

      return (
          <>
            <Card borderRaduis={8} marginBottom={20}>
              <View style={styles.appointmentItem}>
                {/* Section Image */}
                <View style={styles.appointmentImage}>
                  <TouchableOpacity
                      onPress={() => setImageModal(true)}
                      activeOpacity={0.7}
                      style={styles.imageContainer}
                  >

                      <View style={{flexDirection: 'row'}}>
                          <MaterialIcons name="zoom-in" size={18} color={COLORS.grayLight} />
                          <Text style={styles.zoomText}>{t('more.zoom_here')}</Text>
                      </View>
                    <Image
                        source={imageUri()}
                        contentFit="cover"
                        style={styles.appointImageCover}
                        transition={200}
                    />
                    <ZoomImageBox
                        imageModal={imageModal}
                        setImageModal={setImageModal}
                        pictureUri={`${BASEURL_IMG}/${dataSelected?.photo}`}
                    />
                  </TouchableOpacity>
                  {renderBorrowStatus()}
                </View>

                {/* Section Détails */}
                <View style={styles.appointmentDetails}>
                  <Pressable
                      onPress={() => handleBookDetails(dataSelected)}
                      style={styles.detailsContainer}
                  >
                    <Text style={styles.titleDetail} numberOfLines={2}>
                      {dataSelected?.nom}
                    </Text>
                    <Text
                        numberOfLines={2}
                        style={[globalStyles.paragraph, styles.descriptionText]}
                    >
                      {dataSelected?.description || t('more.no_description')}
                    </Text>

                    <Text style={styles.categoryText}>
                      {t('more.category_name')} : {dataSelected?.bookCategoryName || t('more.unknown')}
                    </Text>

                    {renderBorrowStatusType()}
                    {renderReturnDate()}
                    {renderBorrowButton()}
                  </Pressable>
                </View>
              </View>
            </Card>
          </>
      );
    },
    // Comparaison personnalisée pour éviter les re-rendus inutiles
    (prevProps, nextProps) => {
      // Ne re-rendre que si les props importantes changent
      return (
          prevProps.data?.id === nextProps.data?.id &&
          prevProps.data?.available === nextProps.data?.available &&
          prevProps.data?.nom === nextProps.data?.nom &&
          prevProps.data?.photo === nextProps.data?.photo &&
          prevProps.bookStatus === nextProps.bookStatus &&
          prevProps.borrowChildStatus === nextProps.borrowChildStatus &&
          prevProps.comeBackDate === nextProps.comeBackDate
      );
    }
);

export default BookItem;

const styles = StyleSheet.create({
  appointmentItem: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
    paddingLeft: 0,
  },
  appointmentImage: {
    flex: 2,
    alignItems: 'center',
  },
  imageContainer: {
    alignItems: 'center',
  },
  zoomText: {
    fontSize: 11,
    color: COLORS.grayLight,
    textAlign: 'center',
    marginBottom: 2,
      fontWeight: 500
  },
  appointImageCover: {
    width: 65,
    height: 65,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.grayVeryLight,
    backgroundColor: COLORS.grayMedium,
    borderRadius: 4,
  },
  appointmentDetails: {
    flex: 5,
    paddingLeft: 10,
  },
  detailsContainer: {
    flex: 1,
  },
  titleDetail: {
    fontWeight: '700',
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  descriptionText: {
    textAlign: 'justify',
    marginBottom: 4,
  },
  categoryText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  returnDateText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 4,
  },
  borrowStatusText: {
    marginTop: 10,
    fontSize: 12,
    backgroundColor: 'orange',
    padding: 3,
    paddingHorizontal: 5,
    borderRadius: 3,
    color: COLORS.white,
    textAlign: 'center',
  },
  buttonContainer: {
    flex: 1,
    marginTop: 5,
    alignItems: 'flex-end',
  },
  button: {
    minWidth: 90,
    borderRadius: 5,
    padding: 6,
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTextRight: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
    pendingStatus: {
        color: COLORS.orangeTextSuccess,
        backgroundColor: COLORS.orangeExtraLight,
        marginVertical: 5,
        padding:3,
        paddingHorizontal:7,
        fontSize: 11,
        fontWeight: 400,
        borderRadius: 5,

    },

});
