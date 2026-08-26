import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {BASEURL_IMG} from "../../../../api/appUrl";
import {COLORS, IMAGES} from "../../../../constants";

export default function RegisteredChildrenItem({data}: any) {
  return (
    <View style={styles.itemRegisteredContainer}>
      <Image
        source={
          data.person.photo !== null && data.person.photo !== ''
            ? {uri: `${BASEURL_IMG}/${data.person.photo}`}
            : IMAGES.avatar
        }
        resizeMode="cover"
        style={styles.avatarImage}
      />
      <View style={styles.textContainer}>
        <Text style={{color: COLORS.gray, fontWeight: '600'} as StyleSheet}>
          {data?.person.nom} {data?.person.prenom}
        </Text>
        <Text style={{color: COLORS.gray}}>{data?.eleves[0].classe.nom}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  itemRegisteredContainer: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: 10,
  },
  avatarImage: {
    width: 40,
    height: 40,
    overflow: 'hidden',
    borderRadius: 50,
    borderWidth: 1,
    marginRight: 15,
    borderColor: COLORS.grayLight,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
