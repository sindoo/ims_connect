import React from 'react';
import {View, Text} from "react-native";
import ViewThemed from "../../../../components/ui/ViewThemed";
import {globalStyles} from "../../../../style/Global";

const AppointmentHome = () => {
    return (
        <ViewThemed style={{...globalStyles.container}}>
            <View>
                <Text>appointment all</Text>
            </View>
        </ViewThemed>
    );
};

export default AppointmentHome;
