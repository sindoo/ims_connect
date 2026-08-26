import React from 'react';
import {TouchableOpacity} from 'react-native';
import {COLORS} from "../../constants";
import {MaterialIcons} from "@expo/vector-icons";

export default function FloatingButton(props: any) {
  const {style, onPress} = props;
  return (
    <TouchableOpacity onPress={onPress} style={style}>
      <MaterialIcons name="add" size={28} color={COLORS.white} />
    </TouchableOpacity>
  );
}
