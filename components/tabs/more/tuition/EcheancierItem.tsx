import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {format} from 'date-fns';
import {COLORS} from "../../../../constants";

function EcheancierItem(props: any) {
  const {data} = props;
  const {t} = useTranslation();
  const amount = new Intl.NumberFormat('fr-FR').format(data?.montant);
  const datePayment = format(data?.ladate, 'dd/MM/yyyy');

  return (
    <View style={styles.documentItem}>
      <View style={styles.documentName}>
        <Pressable onPress={() => {}}>
          <Text style={styles.documentTitle}>
            {data?.nom !== '' ? data?.nom : `${t('more.payment_reminder')}`}
          </Text>
          <Text style={styles.documentDate}>{datePayment}</Text>
        </Pressable>
      </View>
      <View style={styles.downloadButton}>
        <Text style={styles.amountEcheancier}>{amount} {t('more.payment_devise')}</Text>
      </View>
    </View>
  );
}

export default EcheancierItem;

const styles = StyleSheet.create({
  documentItem: {
    flexDirection: 'row',
    paddingBottom: 10,
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayVeryLight,
  },
  newDocument: {
    flex: 1,
    justifyContent: 'center',
  },
  documentName: {
    flex: 5,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  downloadButton: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    //backgroundColor: 'red'
  },
  documentTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: COLORS.gray,
  },
  documentDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
  amountEcheancier: {
    color: COLORS.gray,
  },
});
