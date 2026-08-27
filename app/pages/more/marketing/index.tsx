import React, {useEffect, useState} from 'react';
import {
    Keyboard, ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import {Image} from "expo-image";
import {TProductDetailsProps} from "../../../../lib/type/TMarketingProps";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import MarketingService from "../../../../services/MarketingService";
import {setUserOderList} from "../../../../redux/features/marketing/marketingSlice";
import {BASEURL_IMG} from "../../../../api/appUrl";
import {COLORS, IMAGES} from "../../../../constants";
import {globalStyles} from "../../../../style/Global";
import FlatButton from "../../../../components/ui/FlatButton";
import {withSnackbar} from "../../../../components/ui/SnackbarHOC";
import {useLocalSearchParams} from "expo-router";

function ProductDetails({route, snackbarShowMessage}: TProductDetailsProps) {
    // @ts-ignore
    //const {data} = route.params;
    const [data, setData] = useState(null);
    const { productId} = useLocalSearchParams();
    const {t} = useTranslation();
    const amount = new Intl.NumberFormat('fr-FR').format(data !== null ? data.prix : 0);
    const [status, setStatus] = useState(false);
    const {selectedChild} = useSelector((state: any) => state.child);
    const {user} = useSelector((state: any) => state.user);
    const [quantity, setQuantity] = useState<string>('1');
    const dispatch = useDispatch();

    const handleQuantity = (text: string) => {
        setQuantity(text);
    };

    const handleOrder = async () => {
        try {
            if(selectedChild !== null) {
                setStatus(true);
                const parentId = user?.userDetails?.personDetails?.person?.id;
                const orderQuantity = parseInt(quantity);
                if (orderQuantity > 0 && orderQuantity <= data?.quantite) {
                    const dataOrder = {
                        product: data,
                        produitId: data.id,
                        quantite: orderQuantity,
                    };
                    await MarketingService.registerOrder(selectedChild.person.id, parentId, dataOrder);
                    const userProductList = await MarketingService.getUserProduct(selectedChild.person.id);
                    dispatch(setUserOderList(userProductList));
                    snackbarShowMessage(t('snackBar.sb_succes_save'));
                    setStatus(false);
                }
            }
        } catch (error) {
            //console.log(JSON.stringify(error));
            snackbarShowMessage(t('snackBar.sb_error'));
            setStatus(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await  MarketingService.getProductById(productId.toString());
                setData(response);
            }
            catch (error) {
                console.log(error);
            }
        }

        fetchData().catch(error => {
            console.log(error)
        });
    }, [productId]);

    return (
        <>
            {data && (
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView style={styles.container}>
                        <View style={styles.topContent}>
                            <View style={styles.imageContainer}>
                                <Image
                                    source={
                                        data?.photo !== '' && data?.photo !== null
                                            ? {uri: `${BASEURL_IMG}/${data?.photo}`}
                                            : IMAGES.noBookImage
                                    }
                                    contentFit="cover"
                                    style={styles.imageCover}
                                />
                            </View>
                            <Text style={{...globalStyles.titleH2, textAlign: 'center'} as StyleSheet}>
                                {data?.nom}
                            </Text>
                            <View style={{flexDirection: 'row', marginTop: 10} as StyleSheet}>
                                <View style={{flex: 1}}>
                                    <Text style={{color: COLORS.secondary}}>
                                        {t('more.mini_club_price')} :
                                    </Text>
                                </View>
                                <View style={{flex: 3}}>
                                    <Text>{amount} FCFA</Text>
                                </View>
                            </View>
                            {data?.description !== '' && data?.description !== null && (
                                <>
                                    <Text style={{color: COLORS.secondary, marginTop: 5}}>
                                        {t('more.mini_club_description')} :
                                    </Text>
                                    <Text style={{textAlign: 'justify'} as StyleSheet}>{data?.description}</Text>
                                </>
                            )}

                            <View style={{flexDirection: 'row', marginTop: 10} as StyleSheet}>
                                <View style={{flex: 1, justifyContent: 'center'} as StyleSheet}>
                                    <Text style={{color: COLORS.secondary}}>
                                        {t('more.product_quantity')} :
                                    </Text>
                                </View>
                                <View style={{flex: 3}}>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType={'numeric'}
                                        onChangeText={text => handleQuantity(text)}
                                        value={quantity}
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.registeredList}>
                            <View
                                style={{marginTop: 15, marginBottom: 20, paddingHorizontal: 15}}>
                                <FlatButton
                                    title={t('more.order_product')}
                                    fontWeight="400"
                                    fontSize={16}
                                    backgroundColor={COLORS.secondary}
                                    paddingVertical={12}
                                    borderRadius={20}
                                    onPress={() => handleOrder()}
                                    disabled={status}
                                />
                            </View>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            )}
        </>
    );
}

export default withSnackbar(ProductDetails);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    topContent: {
        marginTop: 15,
        paddingHorizontal: 15,
    },
    imageContainer: {
        marginBottom: 20,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        overflow: 'hidden',
    },
    imageCover: {
        width: '100%',
        height: 205,
        aspectRatio: 135 / 76,
    },
    registeredList: {
        marginTop: 15,
    },
    titleContainer: {
        borderBottomColor: COLORS.grayMedium,
        borderBottomWidth: 1,
        marginHorizontal: 15,
        paddingBottom: 10,
    },
    titleList: {
        //fontWeight: '600',
        color: COLORS.secondary,
    },
    participant: {
        flex: 1,
        //flexDirection: 'row',
        paddingTop: 10,
    },
    input: {
        borderColor: COLORS.grayMedium,
        borderWidth: 1,
        width: 50,
        height: 30,
        padding: 0,
        paddingLeft: 10,
        color: COLORS.gray,
    },
});
