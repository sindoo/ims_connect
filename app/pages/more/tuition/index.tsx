import React from 'react';
import {Linking, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from "react-i18next";
import {format} from "date-fns";
import {BASEURL_IMG} from "../../../../api/appUrl";
import {globalStyles} from "../../../../style/Global";
import {COLORS, PAYMENT_MODE_EN, PAYMENT_MODE_FR} from "../../../../constants";
import FlatButton from "../../../../components/ui/FlatButton";
import {useSelector} from "react-redux";


function PaymentDetails(props) {
    //const {data} = route.params;
    const {paymentDetailsInRedux} = useSelector((state: any) => state.tuition);
    const {t, i18n} = useTranslation();
    const amount = new Intl.NumberFormat('fr-FR').format(paymentDetailsInRedux?.montant);
    const datePayment = format(paymentDetailsInRedux?.ladate, 'dd/MM/yyyy');

    const seeReceipt = (data: any) => {
        Linking.openURL(`${BASEURL_IMG}/${data?.recu}`);
    };

    return (
        <View style={styles.container}>
            <>
                <View style={styles.topContent}>
                    <Text style={{...globalStyles.titleH2}}>{paymentDetailsInRedux?.nom}</Text>
                    <View style={{flexDirection: 'row', marginTop: 5} as StyleSheet}>
                        <View style={{flex: 2}}>
                            <Text style={{color: COLORS.secondary}}>
                                {t('more.payment_amount')} :
                            </Text>
                        </View>
                        <View style={{flex: 3}}>
                            <Text style={{color: COLORS.gray}}>{amount} CFA</Text>
                        </View>
                    </View>
                    <View style={{flexDirection: 'row'} as StyleSheet}>
                        <View style={{flex: 2}}>
                            <Text style={{color: COLORS.secondary}}>
                                {t('more.payment_code')} :
                            </Text>
                        </View>
                        <View style={{flex: 3}}>
                            <Text style={{color: COLORS.gray}}>{paymentDetailsInRedux?.code}</Text>
                        </View>
                    </View>
                    <View style={{flexDirection: 'row'} as StyleSheet}>
                        <View style={{flex: 2}}>
                            <Text style={{color: COLORS.secondary}}>
                                {t('more.payment_date')} :
                            </Text>
                        </View>
                        <View style={{flex: 3}}>
                            <Text style={{color: COLORS.gray}}>{datePayment}</Text>
                        </View>
                    </View>
                    <View style={{flexDirection: 'row'} as StyleSheet}>
                        <View style={{flex: 2}}>
                            <Text style={{color: COLORS.secondary}}>
                                {t('more.payment_type')} :
                            </Text>
                        </View>
                        <View style={{flex: 3}}>
                            <Text style={{color: COLORS.gray}}>{paymentDetailsInRedux?.paymentTypeNom}</Text>
                        </View>
                    </View>

                    <View style={{flexDirection: 'row'} as StyleSheet}>
                        <View style={{flex: 2}}>
                            <Text style={{color: COLORS.secondary}}>
                                {t('more.payment_by')} :{' '}
                            </Text>
                        </View>
                        <View style={{flex: 3}}>
                            <Text style={{color: COLORS.gray}}>{paymentDetailsInRedux?.payerpar}</Text>
                        </View>
                    </View>

                    <View style={{flexDirection: 'row'} as StyleSheet}>
                        <View style={{flex: 2}}>
                            <Text style={{color: COLORS.secondary}}>
                                {t('more.payment_mode')} :{' '}
                            </Text>
                        </View>
                        <View style={{flex: 3}}>
                            <Text style={{color: COLORS.gray}}>
                                {i18n.language === 'en'
                                    ? PAYMENT_MODE_EN[paymentDetailsInRedux?.modePaiementTag]
                                    : PAYMENT_MODE_FR[paymentDetailsInRedux?.modePaiementTag]}
                            </Text>
                        </View>
                    </View>
                </View>

                {paymentDetailsInRedux?.recu !== '' && paymentDetailsInRedux?.recu !== null && (
                    <View style={{marginTop: 30, marginBottom: 10, paddingHorizontal: 15}}>
                        <FlatButton
                            title={t('more.payment_receipt')}
                            fontWeight="400"
                            fontSize={16}
                            backgroundColor={COLORS.secondary}
                            paddingVertical={12}
                            borderRadius={20}
                            onPress={() => seeReceipt(paymentDetailsInRedux)}
                            disabled={false}
                        />
                    </View>
                )}
            </>

        </View>
    );
}

export default PaymentDetails;

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
    },
    imageCover: {
        width: '100%',
        height: 205,
        aspectRatio: 135 / 76,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
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
});
