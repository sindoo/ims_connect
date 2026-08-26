import React from 'react';
import {Linking, Pressable, StyleSheet, Text, View} from 'react-native';
import {format} from "date-fns";
import {BASEURL_IMG} from "../../../../api/appUrl";
import {COLORS} from "../../../../constants";

function ProformaItem({data}: any) {
  //const {t} = useTranslation();
  const amount = new Intl.NumberFormat('fr-FR').format(data?.montant);
  const dateProforma = format(data.ladate, 'dd/MM/yyyy');

  const seeProforma = (dataProforma: any) => {
    if (dataProforma?.fichier !== '' && dataProforma?.fichier !== null) {
      Linking.openURL(`${BASEURL_IMG}/${dataProforma?.fichier}`);
    }
  };

  return (
    <View style={styles.documentItem}>
      <Pressable onPress={() => seeProforma(data)}>
        <View style={styles.itemProforma}>
          <View style={styles.documentName}>
            <Text style={styles.documentTitle}>{data?.nom}</Text>
            <Text style={styles.documentDate}>{dateProforma}</Text>
          </View>
          <View style={styles.downloadButton}>
            <Text style={styles.amountEcheancier}>{amount} CFA</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export default ProformaItem;

const styles = StyleSheet.create({
  documentItem: {
    flex: 1,
  },
  itemProforma: {
    flexDirection: 'row',
    paddingBottom: 10,
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayVeryLight,
  },
  documentName: {
    flex: 4,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  downloadButton: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
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
