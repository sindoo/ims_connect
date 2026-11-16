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
  loading,
}: {
  title: any;
  onPress: any;
  fontWeight: any;
  fontSize: any;
  backgroundColor: any;
  paddingVertical: any;
  borderRadius: any;
  disabled?: boolean;
  // Affiche l'indicateur de chargement. Par défaut (non précisé), il suit
  // "disabled", comme avant. Passer loading={false} permet un bouton
  // simplement inactif (grisé, libellé visible) sans indicateur.
  loading?: boolean;
}) {
  const showSpinner = loading ?? disabled;
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <View
        style={{
            ...styles.buttom,
            backgroundColor: backgroundColor,
            paddingVertical: paddingVertical,
            borderRadius: borderRadius,
            opacity: disabled && !showSpinner ? 0.5 : 1,
        }}>
          {showSpinner && (
              <ActivityIndicator size={"small"} color={COLORS.white}/>
          )}

          {!showSpinner && (
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
