import React, {useState} from 'react';
import {Alert, Pressable, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from "react-i18next";
import {format} from "date-fns";
import {enUS, fr} from "date-fns/locale";
import {BASEURL_IMG} from "../../../../api/appUrl";
import {COLORS} from "../../../../constants";
import {MaterialIcons} from "@expo/vector-icons";
import Loading from "../../../ui/Loading";
import {downloadDocumentToDevice} from "../../../../services/FileDownloadService";


function SchoolDocumentItem(props: any) {
  const {document} = props;
  const {t, i18n} = useTranslation();
  const [downloading, setDownloading] = useState(false);

  // Télécharge le document et l'enregistre sur le téléphone (loader pendant l'opération)
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const result = await downloadDocumentToDevice(
        `${BASEURL_IMG}/${document.uri}`,
        `${document.nom}.${document.filetype}`,
      );
      if (result === 'saved') {
        Alert.alert(t('schoolDocument.save_title'), t('schoolDocument.save_message'));
      }
    } catch (error) {
      console.log(error);
      Alert.alert(t('imageChild.download_msg_error_title'), t('schoolDocument.download_error_message'));
    } finally {
      setDownloading(false);
    }
  };

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
        {downloading ? (
          <View style={{right: 10}}>
            <Loading size="small" />
          </View>
        ) : (
          <Pressable onPress={handleDownload} style={{right: 10}}>
            <MaterialIcons name="download" color={COLORS.secondary} size={28} />
          </Pressable>
        )}
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
