import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {TMarketingItemProps} from "../../../../lib/type/TMarketingProps";
import {COLORS, IMAGES} from "../../../../constants";
import {BASEURL_IMG} from "../../../../api/appUrl";
import {Image} from "expo-image";
import {globalStyles} from "../../../../style/Global";

const NOOP = () => {};

function UserProductItem({data}: TMarketingItemProps) {
  // ✅ Memoise le formatage du prix au lieu de recreer un
  // Intl.NumberFormat a chaque rendu de la ligne dans la liste.
  const amount = useMemo(() => new Intl.NumberFormat('fr-FR').format(data?.prix), [data?.prix]);

  return (
      <View style={styles.itemWrapper}>
        <Pressable onPress={NOOP}>
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
              <View style={styles.rowWrap}>
                <Text style={styles.titleDetail}>{data?.nom}</Text>
                <Text style={styles.amountText}>
                  {amount} CFA
                </Text>
              </View>
              <Text style={styles.description}>
                {data?.description}
              </Text>
            </View>
          </View>
        </Pressable>
      </View>
  );
}

// Memoïse le composant : rendu dans une FlatList (liste des commandes), il
// ne doit se re-rendre que si son propre "data" change.
export default React.memo(UserProductItem);

const styles = StyleSheet.create({
  itemWrapper: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: COLORS.grayMedium,
  },
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
  rowWrap: {
    flexDirection: 'row',
  },
  amountText: {
    textAlign: 'right',
    color: COLORS.black,
  },
  description: {
    ...globalStyles.paragraph,
    paddingTop: 5,
    textAlign: 'justify',
  },
  toolsActivity: {
    flexDirection: 'row',
    marginTop: 7,
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
