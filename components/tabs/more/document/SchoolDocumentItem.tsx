import React from 'react';
import {Linking, Pressable, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from "react-i18next";
import {format} from "date-fns";
import {enUS, fr} from "date-fns/locale";
import {BASEURL_IMG} from "../../../../api/appUrl";
import {COLORS} from "../../../../constants";
import {MaterialIcons} from "@expo/vector-icons";


function SchoolDocumentItem(props: any) {
  const {document} = props;
  const {i18n} = useTranslation();

  return (
    <View style={styles.documentItem}>
      <View style={styles.documentName}>
        <Pressable onPress={() => {}}>
          <Text style={styles.documentTitle}>
            {document.nom}.{document.filetype}
          </Text>
          <Text style={styles.documentDate}>
            {format(
              document.common.miseajour,
              i18n.language === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy',
              {locale: i18n.language === 'en' ? enUS : fr,},
            )}
          </Text>
        </Pressable>
      </View>
      <View style={styles.downloadButton}>
        <Pressable
          onPress={() => Linking.openURL(`${BASEURL_IMG}/${document.uri}`)}
          style={{right: 10}}>
          <MaterialIcons name="download" color={COLORS.secondary} size={28} />
        </Pressable>
      </View>
    </View>
  );
}

export default SchoolDocumentItem;

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
});
