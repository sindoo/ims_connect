import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {MaterialIcons} from "@expo/vector-icons";
import {COLORS} from "../../../constants";

export default function LanguageItem({
  data,
  onSelect,
  defaultValue,
}: {
  data: any;
  onSelect: any;
  defaultValue: any;
}) {
  const [userOption, setUserOption] = useState(defaultValue);
  const selectHandler = (value: any) => {
    onSelect(value);
    setUserOption(value);
  };

  return (
    <View>
      {data.map((item: any, index: number) => {
        return (
          <TouchableOpacity
            onPress={() => selectHandler(item.value)}
            style={styles.languageItem}
            key={index}>
            <View style={styles.textLangContainer}>
              <Text style={styles.langText}>{item.label}</Text>
            </View>
            <View style={styles.selectLangContainer}>
              {item.value === userOption && (
                <MaterialIcons
                  name="check"
                  color={COLORS.secondary}
                  size={24}
                />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
  },
  option: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonStatus: {
    flex: 1,
    marginRight: 10,
  },
  unselected: {
    backgroundColor: COLORS.grayVeryLight,
    margin: 2,
    padding: 7,
    borderRadius: 6,
  },
  selected: {
    backgroundColor: COLORS.primary,
    margin: 2,
    padding: 7,
    borderRadius: 6,
  },
  languageItem: {
    flexDirection: 'row',
    height: 35,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayVeryLight,
    marginBottom: 10,
    //backgroundColor: 'red'
  },
  textLangContainer: {
    flex: 2,
    justifyContent: 'center',
    paddingLeft: 5,
  },
  selectLangContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 5,
    alignContent: 'flex-end',
    alignItems: 'flex-end',
    right: 5,
  },
  langText: {
    color: COLORS.gray,
    fontWeight: '600',
  },
});
