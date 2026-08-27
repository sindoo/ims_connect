import React, {memo, useState} from 'react';
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


const BookItem = memo(
    function BookItem({
        data,
        bookStatus,
        borrowChildStatus,
        handleBorrowBook,
        setBookDetail,
        setDonor,
        setDataBook
    } : TBookItemProps) {

  const {t} = useTranslation();
  const [borrowLoadingItem, setBorrowLoadingItem] = useState(false);

  const handleBookDetails = React.useCallback((data: any) => {
    setBookDetail(true);
    setDataBook(data);
    setDonor(data?.donateurs);
  }, [data]);

  const handleBorrowBookLoading = async () => {
    try {
      setBorrowLoadingItem(true);
      handleBorrowBook(data, setBorrowLoadingItem);
    } catch (error) {
      console.log(error);
      setBorrowLoadingItem(false);
    }
  }
  return (
      <>
        <Pressable onPress={() => handleBookDetails(data)}>
          <Card borderRaduis={8} marginBottom={20}>
            <View style={styles.appointmentItem}>
              <View style={styles.appointmentImage}>
                <Image
                    source={
                      data?.photo !== ''
                          ? {uri: `${BASEURL_IMG}/${data?.photo}`}
                          : IMAGES.noBookImage
                    }
                    contentFit="cover"
                    style={styles.appointImageCover}
                />
                {bookStatus && (
                    <Text
                        style={{
                          marginTop: 10,
                          fontSize: 12,
                          backgroundColor: 'orange',
                          padding: 3,
                          paddingHorizontal: 5,
                          borderRadius: 3,
                          color: COLORS.white,
                        }}>
                      {t('more.borrow_status')}
                    </Text>
                )}
              </View>
              <View style={styles.appointmentDetails}>
                <Text style={styles.titleDetail}>{data?.nom} </Text>
                <Text
                    numberOfLines={2}
                    style={{...globalStyles.paragraph, textAlign: 'justify'} as StyleSheet}>
                  {data?.description}
                </Text>

                <Text
                    style={{fontWeight: 'bold', fontSize: 12, color: COLORS.gray} as StyleSheet}>
                  {t('more.book_donated_by')} : {data?.donateurs}
                </Text>

                {!borrowChildStatus && (
                    <View style={styles.buttonContainer}>
                      <View style={{padding: 2}}>
                        <TouchableOpacity
                            style={{
                              ...styles.button,
                              backgroundColor: COLORS.grayLightMenu,
                              padding: 4,
                            }}
                            onPress={() => borrowLoadingItem ? {} : handleBorrowBookLoading()}>
                          {borrowLoadingItem ? (
                                <ActivityIndicator size='small' color={COLORS.white} />
                              ) : (
                                <Text style={styles.buttonTextRight}>
                                  {t('more.borrow')}
                                </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                )}
              </View>
            </View>
          </Card>
        </Pressable>
      </>
  );

});


export default memo(BookItem);

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
  appointImageCover: {
    width: 65,
    height: 65,
    overflow: 'hidden',
    //borderRadius: 50,
    borderWidth: 1,
    borderColor: COLORS.grayVeryLight,
    backgroundColor: COLORS.grayMedium,
  },
  appointmentDetails: {
    flex: 5,
  },
  titleDetail: {
    fontWeight: '700',
    fontSize: 14,
    color: COLORS.secondary,
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
  appointmentDate: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    height: 75,
    width: 40,
    backgroundColor: COLORS.blueLight,
  },
});
