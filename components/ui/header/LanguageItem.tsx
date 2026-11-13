import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {MaterialIcons} from "@expo/vector-icons";
import {COLORS} from "../../../constants";

function LanguageItem({
                        data,
                        onSelect,
                        defaultValue,
                      }: {
  data: any;
  onSelect: any;
  defaultValue: any;
}) {
  const [userOption, setUserOption] = useState(defaultValue);

  // ✅ "userOption" n'etait initialise qu'une fois, via useState(defaultValue),
  // au premier rendu. Si "defaultValue" (languageValue dans CustomHeader,
  // initialise avec i18n.language) change plus tard sans que ce composant
  // ne soit demonte/remonte, la coche pouvait rester sur l'ancienne langue.
  // On resynchronise explicitement l'etat local sur la prop.
  useEffect(() => {
    setUserOption(defaultValue);
  }, [defaultValue]);

  const selectHandler = useCallback((value: any) => {
    onSelect(value);
    setUserOption(value);
  }, [onSelect]);

  return (
      <View>
        {data.map((item: any) => {
          return (
              <TouchableOpacity
                  onPress={() => selectHandler(item.value)}
                  style={styles.languageItem}
                  key={item.value}>
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

// Memoise : ce composant ne depend que de "data" (statique par langue),
// "onSelect" (stable grace au useCallback dans CustomHeader) et
// "defaultValue" - inutile de le re-rendre pour d'autres raisons.
export default React.memo(LanguageItem);

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
