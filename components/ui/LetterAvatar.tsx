import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const LetterAvatar = ({ name, size = 60, backgroundColor = '#CFCFCF', textColor = 'white' }: {name: string, size: number, backgroundColor?: string, textColor?: string}) => {
    const initials = name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase();

    const avatarSize = size;
    const fontSize = avatarSize * 0.4; // Adjust font size relative to avatar size

    return (
        <View style={[
            styles.avatarContainer,
            { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor }
        ]}>
            <Text style={[styles.avatarText, { fontSize, color: textColor }]}>
                {initials}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    avatarContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontWeight: 'bold',
    },
});

export default LetterAvatar;
