import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {TPaymentItemProps} from "../../../../lib/type/TPaymentProps";
import {useTranslation} from "react-i18next";
import {format} from "date-fns";
import Card from "../../../ui/Card";
import {COLORS} from "../../../../constants";
import {useDispatch} from "react-redux";
import {setPaymentDetailsInRedux} from "../../../../redux/features/tuition/tuitionSlice";
import {useRouter} from "expo-router";

function PaymentItem({data}: TPaymentItemProps) {
  const {t} = useTranslation();
  const amount = new Intl.NumberFormat('fr-FR').format(data?.montant);
  const datePayment = format(data.ladate, 'dd/MM/yyyy');
  const dispatch = useDispatch();
  const router = useRouter();

  return (
    <Card borderRaduis={6} marginBottom={15}>
      <Pressable
        onPress={() =>{
          dispatch(setPaymentDetailsInRedux(data));
          router.push({
            pathname: '/pages/more/tuition',
          });
          //navigation.navigate(ROUTES.PAYMENT_DETAILS, {data: data})
        }}>
        <View style={styles.itemContent}>
          <Text style={styles.paymentTitle}>{data?.nom}</Text>
          <View style={styles.leftRightContainer}>
            <View style={styles.leftContainer}>
              <View style={styles.labelDetails}>
                <Text style={styles.label}>{t('more.payment_amount')} : </Text>
                <Text style={styles.labelValue}>{amount} {t('more.payment_devise')}</Text>
              </View>
              <View style={styles.labelDetails}>
                <Text style={styles.label}>{t('more.payment_code')} : </Text>
                <Text style={styles.labelValue}>{data?.code}</Text>
              </View>
              <View style={styles.labelDetails}>
                <Text style={styles.label}>{t('more.payment_date')} : </Text>
                <Text style={styles.labelValue}>{datePayment}</Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Card>
  );
}

export default PaymentItem;

const styles = StyleSheet.create({
  itemContent: {
    flex: 1,
    padding: 10,
  },
  imageContainer: {
    flex: 1,
    marginRight: 20,
  },
  imageCover: {
    width: 60,
    aspectRatio: 90 / 76,
  },
  leftContainer: {
    flex: 4,
    justifyContent: 'center',
  },
  paymentTitle: {
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 5,
  },
  labelDetails: {
    flexDirection: 'row',
  },
  label: {
    flex: 1,
    color: COLORS.gray,
  },
  labelValue: {
    flex: 3,
    color: COLORS.gray,
    fontWeight: '500',
  },
  leftRightContainer: {
    flexDirection: 'row',
  },
});
