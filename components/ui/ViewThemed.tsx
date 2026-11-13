import {View, useColorScheme, StyleSheet} from "react-native";
import {COLORS} from "../../constants";
import {useSafeAreaInsets} from "react-native-safe-area-context";

const ViewThemed = ({ style, safe = false, ...props }) => {
    const colorScheme = useColorScheme();
    const theme = COLORS[colorScheme] ?? COLORS.light;
    // ✅ Le hook doit toujours être appelé, jamais conditionnellement :
    // le lire ici (avant tout `return`) évite l'erreur React "Rendered
    // fewer hooks than expected" si jamais `safe` change de valeur d'un
    // rendu à l'autre pour une même instance de ce composant. Le lire
    // ne coûte rien même quand `safe` vaut false.
    const insets = useSafeAreaInsets();

    if(!safe) {
        return (
            <View
                style={[{backgroundColor: theme.background}, style]} {...props}
            />
        )
    }

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
