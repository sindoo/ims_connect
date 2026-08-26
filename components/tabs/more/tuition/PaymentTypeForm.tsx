import React from 'react';
import {StyleSheet, View} from 'react-native';
import {TPaymentTypeProps} from "../../../../lib/type/TPaymentProps";
import {useTranslation} from "react-i18next";
import DropDownPicker from "react-native-dropdown-picker";
import {COLORS} from "../../../../constants";


function PaymentTypeForm({
  open,
  value,
  items,
  setOpen,
  setValue,
  setItems,
  onChangeValue,
}: TPaymentTypeProps) {
  const {t, i18n} = useTranslation();
  const language = i18n.language.toUpperCase();

  return (
    <View style={styles.container} key={1}>
      {/*<Text style={styles.inputLabel}>{t('child_profile.classroom')}</Text>*/}
      <DropDownPicker
        open={open}
        value={value}
        items={items}
        setOpen={setOpen}
        setValue={setValue}
        setItems={setItems}
        listMode="SCROLLVIEW"
        //disabled={false}
        placeholder={t('more.payment_type')}
        onChangeValue={() => onChangeValue(value)}
        style={{
          borderRadius: 4,
          borderColor: COLORS.grayMedium,
          padding: 0,
        }}
        dropDownContainerStyle={{
          borderColor: COLORS.grayMedium,
          borderRadius: 4,
        }}
        labelStyle={{
          color: COLORS.gray,
          fontSize: 16,
          padding: 0,
        }}
        containerStyle={{
          borderColor: COLORS.grayLight,
          padding: 0,
        }}
        placeholderStyle={{
          color: COLORS.gray,
          fontSize: 16,
        }}
        listItemLabelStyle={{
          fontSize: 16,
          color: COLORS.gray,
        }}
        // @ts-ignore
        language={language}
      />
    </View>
  );
}

export default PaymentTypeForm;

const styles = StyleSheet.create({
  container: {
    //flex: 1,
    padding: 15,
    //paddingTop: 30,
    zIndex: 8,
  },
  inputLabel: {
    color: COLORS.grayLight,
    marginBottom: 5,
    fontWeight: '600',
  },
});
