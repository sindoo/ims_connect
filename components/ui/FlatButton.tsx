import React from 'react';
import {StyleSheet, TouchableOpacity, View, Text, ActivityIndicator} from 'react-native';
import {COLORS} from '../../constants';

export default function FlatButton({
  title,
  onPress,
  fontWeight,
  fontSize,
  backgroundColor,
  paddingVertical,
  borderRadius,
  disabled = false,
}: {
  title: any;
  onPress: any;
  fontWeight: any;
  fontSize: any;
  backgroundColor: any;
  paddingVertical: any;
  borderRadius: any;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <View
        style={{
            ...styles.buttom,
            backgroundColor: backgroundColor,
            paddingVertical: paddingVertical,
            borderRadius: borderRadius,
        }}>
          {disabled && (
              <ActivityIndicator size={"small"} color={COLORS.white}/>
          )}

          {!disabled && (
              // @ts-ignore
              <Text style={{...styles.buttomText}}>
                  {title}
              </Text>
          )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttom: {
    borderRadius: 30,
    paddingHorizontal: 10,
  },
  buttomText: {
    color: COLORS.white,
    textTransform: 'none',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
