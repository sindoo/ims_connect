import {View, useColorScheme, StyleSheet} from "react-native";
import {COLORS} from "../../constants";
import {useSafeAreaInsets} from "react-native-safe-area-context";

const ViewThemed = ({ style, safe = false, ...props }) => {
    const colorScheme = useColorScheme();
    const theme = COLORS[colorScheme] ?? COLORS.light;

    if(!safe) {
        return (
            <View
                style={[{backgroundColor: theme.background}, style]} {...props}
            />
        )
    }

    const insets = useSafeAreaInsets();
    return (
        <View
            style={[
                {
                    backgroundColor: theme.background,
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                },
                style,
            ]} {...props}
        />
    );
};

export default ViewThemed;