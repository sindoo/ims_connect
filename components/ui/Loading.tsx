import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import {globalStyles} from "../../style/Global";
import {COLORS} from "../../constants";

function Loading({size='large'}:any) {
  return (
    <View style={globalStyles.loading}>
      <ActivityIndicator size={size} color={COLORS.secondary} />
    </View>
  );
}

export default Loading;
