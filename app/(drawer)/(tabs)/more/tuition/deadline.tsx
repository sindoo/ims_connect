import {FlatList, StyleSheet, Text, View} from 'react-native';
import {useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {useSelector} from "react-redux";
import PaymentService from "../../../../../services/PaymentService";
import {globalStyles} from "../../../../../style/Global";
import Loading from "../../../../../components/ui/Loading";
import TuitionYearForm from "../../../../../components/tabs/more/tuition/TuitionYearForm";
import {COLORS} from "../../../../../constants";
import EcheancierItem from "../../../../../components/tabs/more/tuition/EcheancierItem";

function Deadline() {
    const [echeancierList, setEcheancierList] = useState([]);
    const [schoolingAmount, setSchoolingAmount] = useState(0);
    const {t} = useTranslation();
    const {selectedChild} = useSelector((state: any) => state.child);
    const [openTuitionYearForm, setOpenTuitionYearForm] = useState(false);
    const [tuitionYearValue, setTuitionYearValue] = useState<any>(null);
    const [tuitionYearData, setTuitionYearData] = useState<any>([]);
    const [loading, setLoading] = useState(true);

    const getDeadlineList = useCallback(async (tuitionYearId: number) => {
        setLoading(true);
        try {
            // GET GROUP ID + TUITION FEES TYPE : les deux appels sont
            // independants (aucun n'a besoin du resultat de l'autre), on
            // les lance en parallele au lieu de les enchainer.
            const [groupIdReq, tuitionFeesTypeData] = await Promise.all([
                PaymentService.getTuitionDataGroupYear(selectedChild.person.id, tuitionYearId),
                PaymentService.getTuitionFeesType(),
            ]);
            const groupList = PaymentService.getGroupList(groupIdReq);
            if(groupList.length > 0 && tuitionFeesTypeData.length > 0) {
                const tuitionFeesType = PaymentService.getTuitionFeesTypeIdByTag(tuitionFeesTypeData);
                if(tuitionFeesType !== undefined) {
                    // Un echeancier par groupe, regroupes dans une seule liste
                    const deadlineListByGroup = await Promise.all(
                        groupList.map((group: any) =>
                            PaymentService.getDeadlineByChild(selectedChild.person.id, group.groupesectionId, tuitionYearId, tuitionFeesType.id)
                        )
                    );
                    const deadlineListReq: any = deadlineListByGroup.flatMap((list: any) => Array.isArray(list) ? list : []);
                    setEcheancierList(deadlineListReq);

                    const amountDeadline = PaymentService.getSumOfAllDeadlineByChild(deadlineListReq);
                    setSchoolingAmount(amountDeadline);
                }
            }
            setLoading(false);
        } catch (error) {
            setEcheancierList([]);
            setSchoolingAmount(0);
            console.log(error);
            setLoading(false);
        }
    }, [selectedChild]);

    const onTuitionYearValueChange = useCallback(async (tuitionYearId: number) => {
        await getDeadlineList(tuitionYearId);
    }, [getDeadlineList]);

    // NOTE : ce useEffect garde volontairement le tableau de dependances []
    // du fichier d'origine (il ne se relance donc pas si `selectedChild`
    // change apres le montage), pour ne pas modifier le comportement actuel
    // sans confirmation. A verifier : all-payment.tsx utilise [selectedChild]
    // pour un effet equivalent - si cet ecran doit aussi se remettre a jour
    // quand on change d'enfant sans demonter le composant, il faudra ajouter
    // selectedChild ici (et dans proforma.tsx, meme cas).
    useEffect(() => {
        const fetchData = async () => {
            if(selectedChild !== null) {
                // GET ALL TUITION YEARS
                const tuitionYears = await PaymentService.getTuitionYears();
                const currentYear = await PaymentService.getCurrentTuitionYear(tuitionYears);
                if(currentYear !== null) {
                    setTuitionYearData(tuitionYears);
                    setTuitionYearValue(currentYear.id)
                    await getDeadlineList(currentYear.id);
                }
            }
            setLoading(false);
        }
        fetchData().catch(error => {
            console.log(error);
            setLoading(false);
        });
    }, []);

    const renderEcheancierItem = useCallback(({item}: {item: any}) => (
        <EcheancierItem data={item} />
    ), []);
    const keyExtractorEcheancier = useCallback((item: any) => String(item.id), []);
    const ListEmptyComponent = useCallback(() => (
        <View>
            <Text style={styles.emptyText}>
                {t('more.empty_deadline_payment')}
            </Text>
        </View>
    ), [t]);

    if(loading) {
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

            <View style={styles.montantEcheancier}>
                <View style={styles.amountBox}>
                    <Text style={styles.amountLabel}>
                        {t('more.schooling_amount')}
                    </Text>
                    <Text style={styles.amountValue}>
                        {new Intl.NumberFormat('fr-FR').format(schoolingAmount)} {t('more.payment_devise')}
                    </Text>
                </View>
            </View>
            <FlatList
                style={styles.listContainer}
                data={echeancierList}
                renderItem={renderEcheancierItem}
                keyExtractor={keyExtractorEcheancier}
                ListEmptyComponent={ListEmptyComponent}
            />
        </View>
    );
}

export default Deadline;

const styles = StyleSheet.create({
    listContainer: {
        flex: 1,
        paddingTop: 30,
    },
    montantEcheancier: {
        paddingLeft: 15,
        paddingRight: 15,
    },
    amountBox: {
        backgroundColor: COLORS.yellowIms,
        padding: 10,
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    amountLabel: {
        marginRight: 30,
        color: COLORS.black,
        fontWeight: '600',
        fontSize: 15,
    },
    amountValue: {
        color: COLORS.black,
        fontWeight: '600',
        fontSize: 15,
    },
    emptyText: {
        flex: 1,
        textAlign: 'center',
    },
});
