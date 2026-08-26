import React from 'react';
import {StyleSheet, TouchableOpacity, View, Text} from 'react-native';
import {COLORS} from "../../constants";

export default function FlatButtonClub({
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
        disabled: boolean;
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
                <Text style={{
                        ...styles.buttomText,
                        fontWeight: fontWeight,
                        fontSize: fontSize,
                      }}>
                    {title}
                </Text>
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
        color: COLORS.grayLight,
        textTransform: 'none',
        textAlign: 'center',
        letterSpacing: 1,
    },
});
