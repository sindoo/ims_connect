import React from 'react';
import {Text, View} from "react-native";
import ViewThemed from "../../../../components/ui/ViewThemed";
import {globalStyles} from "../../../../style/Global";

const PresetAppointment = () => {
    return (
        <ViewThemed style={{...globalStyles.container}}>
            <View>
                <Text>Preset appointment</Text>
            </View>
        </ViewThemed>
    );
};

export default PresetAppointment;
