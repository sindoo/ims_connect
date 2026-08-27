import React, {useEffect} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {TMarketingItemProps} from "../../../../lib/type/TMarketingProps";
import {COLORS, IMAGES} from "../../../../constants";
import {BASEURL_IMG} from "../../../../api/appUrl";
import {Image} from "expo-image";
import {globalStyles} from "../../../../style/Global";

export default function UserProductItem({data}: TMarketingItemProps) {
  const amount = new Intl.NumberFormat('fr-FR').format(data?.prix);

  useEffect(() => {}, []);
  return (
    <View
      style={{
        marginBottom: 20,
        borderBottomWidth: 1,
        borderColor: COLORS.grayMedium,
      }}>
      <Pressable onPress={() => {}}>
        <View style={styles.productItem}>
          <Image
            source={
              data?.photo !== '' && data?.photo !== null
                ? {uri: `${BASEURL_IMG}/${data?.photo}`}
                : IMAGES.noBookImage
            }
            contentFit="cover"
            style={styles.productImageCover}
          />
          <View style={styles.productDetails}>
            <View style={{flexDirection: 'row'} as StyleSheet}>
              <Text style={styles.titleDetail}>{data?.nom}</Text>
              <Text style={{textAlign: 'right', color: COLORS.black} as StyleSheet}>
                {amount} CFA
              </Text>
            </View>
            <Text
              style={{
                ...globalStyles.paragraph,
                paddingTop: 5,
                textAlign: 'justify',
              } as StyleSheet}>
              {data?.description}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  productItem: {
    flexDirection: 'row',
    padding: 10,
    paddingLeft: 0,
    paddingBottom: 15,
  },
  productImage: {
    alignItems: 'flex-start',
  },
  productImageCover: {
    width: 65,
    height: 65,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.grayVeryLight,
  },
  productDetails: {
    flex: 1,
    marginLeft: 10,
  },
  titleDetail: {
    flex: 2,
    fontWeight: '500',
    fontSize: 14,
    color: COLORS.black,
  },
  toolsActivity: {
    flexDirection: 'row',
    marginTop: 7,
    //backgroundColor: 'red'
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
