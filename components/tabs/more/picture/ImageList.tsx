import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from "react-i18next";
import {useEffect} from "react";
import {globalStyles} from "../../../../style/Global";
import {format} from "date-fns";
import {enUS, fr} from "date-fns/locale";
import ImageItem from "./ImageItem";


function ImageList(props: any) {
  const {
    data,
    countImageSelected,
    numberImageChecked,
    pictureIdList,
    setPictureIdList,
  } = props;
  const {i18n} = useTranslation();

  useEffect(() => {}, []);
  return (
    <View style={styles.imageListContainer}>
      {data.length > 0 &&
        data.map((picture: any, index: number) => {
          return (
            <View key={index}>
              <Text
                style={{...globalStyles.titleH3, textTransform: 'capitalize'} as StyleSheet}>
                {format(
                  parseInt(picture.picDate),
                  i18n.language === 'en' ? 'MMMM yyyy' : 'MMMM yyyy',
                  {locale: i18n.language === 'en' ? enUS : fr,},
                )}
              </Text>
              <View style={styles.imageGroupContainer}>
                {picture.picList.length > 0 &&
                  picture.picList.map((pic: any) => {
                    return (
                      <ImageItem
                        key={pic.id}
                        pictureData={pic}
                        numberImageChecked={numberImageChecked}
                        countImageSelected={countImageSelected}
                        pictureIdList={pictureIdList}
                        setPictureIdList={setPictureIdList}
                      />
                    );
                  })}
              </View>
            </View>
          );
        })}
    </View>
  );
}

export default ImageList;

const styles = StyleSheet.create({
  imageListContainer: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 5,
  },
  imageGroupContainer: {
    flex: 1,
    paddingTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
