import {StyleSheet, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import DropDownPicker from "react-native-dropdown-picker";
import {COLORS} from "../../../../constants";

function TuitionYearForm({ open, value, items, setOpen, setValue, setItems, onChangeValue }: any) {
    const {t, i18n} = useTranslation();
    const language = i18n.language.toUpperCase();

    return (
        <View style={styles.container} key={2}>
            <Text style={styles.inputLabel}>{t('more.tuition_year')}</Text>
            <DropDownPicker
                open={open}
                value={value}
                items={items}
                setOpen={setOpen}
                setValue={setValue}
                setItems={setItems}
                listMode="SCROLLVIEW"
                //disabled={false}
                placeholder={t('more.tuition_year')}
                onChangeValue={() => onChangeValue(value)}
                style={{
                    borderRadius: 4,
                    borderColor: COLORS.grayMedium,
                    padding: 0,
                }}
                dropDownContainerStyle={{
                    borderColor: COLORS.grayMedium,
                    borderRadius: 4,
                }}
                labelStyle={{
                    color: COLORS.gray,
                    fontSize: 16,
                    padding: 0,
                }}
                containerStyle={{
                    borderColor: COLORS.grayLight,
                    padding: 0,
                }}
                placeholderStyle={{
                    color: COLORS.gray,
                    fontSize: 16,
                }}
                listItemLabelStyle={{
                    fontSize: 16,
                    color: COLORS.gray,
                }}
                // @ts-ignore
                language={language}
            />
        </View>
    )
}

export default TuitionYearForm;

const styles = StyleSheet.create({
    container: {
        //flex: 1,
        padding: 15,
        paddingTop: 30,
        zIndex: 10,
    },
    inputLabel: {
        color: COLORS.gray,
        marginBottom: 5,
        fontWeight: 'normal',
        fontSize: 15,
    },
})
