import {FlatList, StyleSheet, Text, View} from 'react-native';
import {TPaymentItemProps} from "../../../../../lib/type/TPaymentProps";
import {useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {useSelector} from "react-redux";
import PaymentService from "../../../../../services/PaymentService";
import Loading from "../../../../../components/ui/Loading";
import {globalStyles} from "../../../../../style/Global";
import TuitionYearForm from "../../../../../components/tabs/more/tuition/TuitionYearForm";
import ProformaItem from "../../../../../components/tabs/more/tuition/ProformaItem";

function Proforma({navigation}: TPaymentItemProps) {
    const [proformaList, setProformaList] = useState([]);
    const [tuitionYearValue, setTuitionYearValue] = useState<any>(null);
    const [tuitionYearData, setTuitionYearData] = useState<any>([]);
    const [openTuitionYearForm, setOpenTuitionYearForm] = useState(false);
    const {t} = useTranslation();
    const [loading, setLoading] = useState(true);
    const {selectedChild} = useSelector((state: any) => state.child);

    // Logique commune (mount initial + changement d'annee) extraite dans un
    // seul helper pour eviter de dupliquer les mêmes 4 lignes deux fois.
    const fetchProformaForYear = useCallback(async (tuitionYearId: number) => {
        if(selectedChild !== null) {
            const groupIdReq = await PaymentService.getTuitionDataGroupYear(selectedChild.person.id, tuitionYearId);
            if(groupIdReq !== undefined) {
                const groupId = groupIdReq.groupesectionId;
                const proformaData = await PaymentService.getAllChildProforma(selectedChild.person.id, groupId, tuitionYearId);
                setProformaList(proformaData);
            }
        }
    }, [selectedChild]);

    const onTuitionYearValueChange = useCallback(async (tuitionYearId: number) => {
        try {
            setLoading(true);
            await fetchProformaForYear(tuitionYearId);
            setLoading(false);
        } catch (error) {
            setProformaList([]);
            setLoading(false);
            console.log(error);
        }
    }, [fetchProformaForYear]);

    // NOTE : meme remarque que dans deadline.tsx - le tableau de dependances
    // [] est conserve tel quel (comportement d'origine inchange). A verifier
    // avec all-payment.tsx qui, lui, refait l'appel via [selectedChild].
    useEffect(() => {
        const fetchData = async () => {
            try {
                if(selectedChild !== null) {
                    // GET ALL TUITION YEARS
                    const tuitionYears = await PaymentService.getTuitionYears();
                    const currentYear = await PaymentService.getCurrentTuitionYear(tuitionYears);
                    if(currentYear !== null) {
                        setTuitionYearData(tuitionYears);
                        setTuitionYearValue(currentYear.id);
                        await fetchProformaForYear(currentYear.id);
                    }
                }
                setLoading(false);
            }
            catch (error) {
                console.log(JSON.stringify(error));
                setLoading(false);
            }
        }
        fetchData().catch(error => {
            console.log(error);
        })
    }, []);

    const renderProformaItem = useCallback(({item}: {item: any}) => (
        <ProformaItem data={item} />
    ), []);
    const keyExtractorProforma = useCallback((item: any) => String(item.id), []);
    const ListEmptyComponent = useCallback(() => (
        <View>
            <Text style={styles.emptyText}>
                {t('more.empty_proforma_list')}
            </Text>
        </View>
    ), [t]);

    if(loading){
        return <Loading />;
    }
    return (
        <View style={globalStyles.container}>
            <TuitionYearForm
                open={openTuitionYearForm}
                value={tuitionYearValue}
                items={tuitionYearData}
                setOpen={setOpenTuitionYearForm}
                setValue={setTuitionYearValue}
                setItems={setTuitionYearData}
                onChangeValue={onTuitionYearValueChange}
            />

            <FlatList
                style={styles.listContainer}
                data={proformaList}
                renderItem={renderProformaItem}
                keyExtractor={keyExtractorProforma}
                ListEmptyComponent={ListEmptyComponent}
            />
        </View>
    );
}

export default Proforma;

const styles = StyleSheet.create({
    listContainer: {
        flex: 1,
        paddingTop: 20,
    },
    emptyText: {
        flex: 1,
        textAlign: 'center',
    },
});
