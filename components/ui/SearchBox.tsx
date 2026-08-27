import React from 'react';
import {StyleSheet, TextInput, TouchableOpacity, View} from 'react-native';
import {useTranslation} from "react-i18next";
import {COLORS} from "../../constants";
import {MaterialIcons} from "@expo/vector-icons";


type TSearchBoxProps = {
  searchValue: string;
  setSearchValue: React.Dispatch<React.SetStateAction<string>>;
  paddingHorizontal?: number;
  handleClearSearch(): void;
  handleSubmitSearch(): void;
};
export default function SearchBox({
  searchValue,
  setSearchValue,
  //handleTextChange,
  paddingHorizontal,
  handleClearSearch,
  handleSubmitSearch
}: TSearchBoxProps) {
  const inputProps = {enterKeyHint: 'search'};
  const {t} = useTranslation();

  return (
    <View
      style={{...styles.searchContainer, paddingHorizontal: paddingHorizontal}}>
      <View style={styles.searchBar}>
        {/* @ts-ignore*/}
        <TextInput
          style={styles.input}
          placeholder={t('allAppointment.search')}
          placeholderTextColor={COLORS.gray}
          {...inputProps}
          value={searchValue}
          onChangeText={setSearchValue}
          //onChangeText={(text: string) => handleTextChange(text)}
          onSubmitEditing={() => handleSubmitSearch()}
          inputMode={'search'}
        />
        <TouchableOpacity onPress={() => handleClearSearch()}>
          <MaterialIcons name="close" size={18} color={COLORS.gray} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    padding: 10,
  },
  searchBar: {
    flexDirection: 'row',
    marginTop: 10,
    padding: 6,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: COLORS.grayVeryLight,
    borderRadius: 6,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 3,
    fontSize: 16,
    borderRadius: 0,
    color: COLORS.gray,
    marginLeft: 4,
  },
});
