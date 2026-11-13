import React, {useMemo} from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {TMarketingItemProps} from "../../../../lib/type/TMarketingProps";
import {useTranslation} from "react-i18next";
import {COLORS, IMAGES} from "../../../../constants";
import {BASEURL_IMG} from "../../../../api/appUrl";
import {globalStyles} from "../../../../style/Global";
import {useRouter} from "expo-router";

const NOOP = () => {};

function ProductItem({data}: TMarketingItemProps) {
  const {t} = useTranslation();
  // ✅ Memoise le formatage du prix (recalcule uniquement si data?.prix
  // change) au lieu de recreer un Intl.NumberFormat a chaque rendu de la
  // ligne dans la liste.
  const amount = useMemo(() => new Intl.NumberFormat('fr-FR').format(data?.prix), [data?.prix]);
  const router = useRouter();

  // ✅ BUG CORRIGE : "data?.quantite <= 0 || (data?.available === false && <Text/>)"
  // - quand quantite <= 0, le "||" court-circuite sur le booleen "true" et
  // React n'affiche rien du tout (React ignore un booleen "true"/"false"
  // rendu tel quel) : le message "produit indisponible" ne s'affichait donc
  // JAMAIS pour un produit en rupture de stock, seulement pour un produit
  // explicitement marque available:false alors qu'il reste du stock. Le
  // bouton de commande juste en dessous verifie deja correctement
  // "quantite > 0 && available" - le message d'indisponibilite doit donc
  // s'afficher exactement dans le cas complementaire.
  const isUnavailable = data?.quantite <= 0 || data?.available === false;
  const canOrder = data?.quantite > 0 && data?.available;

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
                resizeMode="cover"
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

              <View style={styles.toolsActivity}>
                <View>
                  {isUnavailable && (
                      <Text style={styles.unavailableText}>
                        {t('more.product_available')}
                      </Text>
                  )}
                </View>
                {canOrder && (
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                          style={styles.orderButton}
                          onPress={() => {
                            router.push({
                              pathname: 'pages/more/marketing',
                              params: {
                                productId: data?.id,
                              }
                            });
                          }}>
                        <Text style={styles.buttomTextRight}>
                          {t('more.order')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                )}
              </View>
            </View>
          </View>
        </Pressable>
      </View>
  );
}

// Memoïse le composant : rendu dans une FlatList, il ne doit se re-rendre
// que si son propre "data" change, pas a chaque re-rendu de la liste
// parente (recherche, pull-to-refresh, etc.).
export default React.memo(ProductItem);

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
    backgroundColor: COLORS.grayMedium,
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
  unavailableText: {
    ...globalStyles.paragraph,
    fontSize: 14,
    color: COLORS.red,
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
  orderButton: {
    minWidth: 90,
    borderRadius: 5,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
  },
  buttomTextRight: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
});
