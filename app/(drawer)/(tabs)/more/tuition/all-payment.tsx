import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    FlatList,
    Keyboard,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import {TPaymentAmountProps} from "../../../../../lib/type/TPaymentProps";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import PaymentService from "../../../../../services/PaymentService";
import {getTime} from "date-fns";
import {checkTokenExpired} from "../../../../../services/GeneralService";
import Loading from "../../../../../components/ui/Loading";
import {COLORS} from "../../../../../constants";
import {globalStyles} from "../../../../../style/Global";
import TuitionYearForm from "../../../../../components/tabs/more/tuition/TuitionYearForm";
import PaymentTypeForm from "../../../../../components/tabs/more/tuition/PaymentTypeForm";
import PaymentItem from "../../../../../components/tabs/more/tuition/PaymentItem";

// La reponse groupsenfants est un tableau (un enfant peut avoir plusieurs groupes
// sur une annee). On accepte aussi l'ancien format (objet seul) par securite.
const toGroupList = (groupReq: any): any[] => {
    if (Array.isArray(groupReq)) {
        return groupReq.filter((group: any) => group?.groupesectionId !== undefined && group?.groupesectionId !== null);
    }
    if (groupReq?.groupesectionId !== undefined && groupReq?.groupesectionId !== null) {
        return [groupReq];
    }
    return [];
};

const sumAmounts = (list: any[]) => {
    const total = {montantFacture: 0, montantPayer: 0, montantSolde: 0};
    list.forEach((item: any) => {
        total.montantFacture += Number(item?.montantFacture) || 0;
        total.montantPayer += Number(item?.montantPayer) || 0;
        total.montantSolde += Number(item?.montantSolde) || 0;
    });
    return {
        montantFacture: new Intl.NumberFormat('fr-FR').format(total.montantFacture),
        montantPayer: new Intl.NumberFormat('fr-FR').format(total.montantPayer),
        montantSolde: new Intl.NumberFormat('fr-FR').format(total.montantSolde),
    };
};

function PaymentList(props) {
    const [openTypeForm, setOpenTypeForm] = useState(false);
    const [paymentTypeValue, setPaymentTypeValue] = useState<any>(null);
    const [paymentTypeData, setPaymentTypeData] = useState<any>([]);
    const [openTuitionYearForm, setOpenTuitionYearForm] = useState(false);
    const [tuitionYearValue, setTuitionYearValue] = useState<any>(null);
    const [tuitionYearData, setTuitionYearData] = useState<any>([]);
    const [schoolingPaymentList, setSchoolingPaymentList] = useState<any>([]);
    const [paymentOriginalList, setPaymentOriginalList] = useState<any>([]);
    const [loading, setLoading] = useState(true);
    const [tuitionCurrentYear, setTuitionCurrentYear] = useState<any>(null);
    // groupId -> ids des types de frais proposes dans ce groupe (annee courante)
    const groupFeesTypeIdsRef = useRef<Map<number, number[]>>(new Map());
    const [tuitionFeesAmount, setTuitionFeesAmount] =
        useState<TPaymentAmountProps | null>({
            montantFacture: '0',
            montantPayer: '0',
            montantSolde: '0',
        });
    const {t} = useTranslation();
    const {selectedChild} = useSelector((state: any) => state.child);
    const {userToken} = useSelector((state:any) => state.user);
    const dispatch = useDispatch();

    // NOTE IMPORTANT : cette fonction recevait deja tuitionYearId et
    // tuitionFeesTypeId en parametres mais utilisait par erreur les valeurs
    // de state (tuitionYearValue / paymentTypeValue) a la place. Comme les
    // setState (setTuitionYearValue/setPaymentTypeValue) sont asynchrones,
    // l'appel utilisait la VALEUR PRECEDENTE au lieu de la nouvelle valeur
    // choisie par l'utilisateur : changer d'annee ou de type de frais
    // pouvait donc afficher les montants/paiements de l'ancienne selection.
    // Corrige pour utiliser les parametres recus.
    const handleTuitionFeesAmountPaymentList = useCallback(async (tuitionYearId: number, tuitionFeesTypeId: number) => {
        try {
            const groupIdReq = await PaymentService.getTuitionDataGroupYear(selectedChild.person.id, tuitionYearId);
            const groupList = toGroupList(groupIdReq);
            if(groupList.length > 0) {
                // GET CHILD TUITION FEES AMOUNT : somme sur les groupes qui
                // proposent ce type de frais (si la liste des types d'un groupe
                // n'est pas connue, on l'interroge quand meme).
                const concernedGroups = groupList.filter((group: any) => {
                    const typeIds = groupFeesTypeIdsRef.current.get(group.groupesectionId);
                    return typeIds === undefined || typeIds.includes(tuitionFeesTypeId);
                });
                const amountsList = await Promise.all(
                    concernedGroups.map((group: any) =>
                        PaymentService.getTuitionFeesAmountByTuitionTypeId(
                            selectedChild.person.id,
                            group.groupesectionId,
                            tuitionFeesTypeId,
                            tuitionYearId
                        )
                    )
                );
                setTuitionFeesAmount(sumAmounts(amountsList));

                // GET CHILD PAYMENT LIST BY TUITION TYPE SELECTED
                const filterPaymentList = paymentOriginalList.filter(
                    (payment: any) => payment.scolariteTypeId === tuitionFeesTypeId,
                );
                setSchoolingPaymentList(filterPaymentList);
            }
        } catch (error) {
            console.log(error);
            setTuitionFeesAmount({ montantFacture: '0', montantPayer: '0', montantSolde: '0' });
            setSchoolingPaymentList([]);
        }
    }, [selectedChild, paymentOriginalList]);

    const onTuitionYearValueChange = useCallback(async (tuitionYearId: number) => {
        setLoading(true);
        await handleTuitionFeesAmountPaymentList(tuitionYearId, paymentTypeValue);
        setLoading(false);
    }, [handleTuitionFeesAmountPaymentList, paymentTypeValue]);

    const onChangePaymentTypeValue = useCallback(async (tuitionFeesTypeId: any) => {
        setLoading(true);
        await handleTuitionFeesAmountPaymentList(tuitionYearValue, tuitionFeesTypeId);
        setLoading(false);
    }, [handleTuitionFeesAmountPaymentList, tuitionYearValue]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if(selectedChild !== null) {
                    // GET ALL TUITION YEARS
                    const tuitionYears = await PaymentService.getTuitionYears();
                    const currentYear = await PaymentService.getCurrentTuitionYear(tuitionYears);
                    if(currentYear !== null) {
                        setTuitionCurrentYear(currentYear);
                        setTuitionYearData(tuitionYears);
                        setTuitionYearValue(currentYear.id);

                        // GET TUITION FEES TYPE + GROUP ID : ces deux appels
                        // sont independants l'un de l'autre, on les lance
                        // en parallele au lieu de les attendre l'un apres l'autre.
                        const [tuitionFeesTypeData, groupIdReq] = await Promise.all([
                            PaymentService.getTuitionFeesType(),
                            PaymentService.getTuitionDataGroupYear(selectedChild.person.id, currentYear.id),
                        ]);
                        const groupList = toGroupList(groupIdReq);
                        if(groupList.length > 0) {
                            const today = getTime(new Date());

                            // GET CHILD TUITION FEES + PAYMENT LIST pour chaque groupe
                            // (appels independants, tous lances en parallele).
                            const groupResults = await Promise.all(
                                groupList.map(async (group: any) => {
                                    const groupId = group.groupesectionId;
                                    const [childTuitionFeesData, paymentListList] = await Promise.all([
                                        PaymentService.getChildTuitionFees(selectedChild.person.id, groupId, currentYear.id),
                                        PaymentService.getAllChildPayment(selectedChild.person.id, groupId, currentYear.id, today),
                                    ]);
                                    return {groupId, childTuitionFeesData, paymentListList};
                                }),
                            );

                            // Types de frais : union de ceux de tous les groupes (sans doublon)
                            groupFeesTypeIdsRef.current = new Map();
                            const tuitionFeesDataList: any = [];
                            const allPayments: any = [];
                            groupResults.forEach(({groupId, childTuitionFeesData, paymentListList}) => {
                                groupFeesTypeIdsRef.current.set(
                                    groupId,
                                    Array.isArray(childTuitionFeesData?.scolariteTypeIds) ? childTuitionFeesData.scolariteTypeIds : [],
                                );
                                const groupFees: any = PaymentService.reformatTuitionFees(
                                    tuitionFeesTypeData,
                                    childTuitionFeesData ?? {scolariteTypeIds: []},
                                );
                                groupFees.forEach((fees: any) => {
                                    if (!tuitionFeesDataList.some((existing: any) => existing.id === fees.id)) {
                                        tuitionFeesDataList.push(fees);
                                    }
                                });
                                if (Array.isArray(paymentListList)) {
                                    allPayments.push(...paymentListList);
                                }
                            });
                            setPaymentTypeData(tuitionFeesDataList);

                            const paymentListFormatted = await PaymentService.reformatChildPaymentList(
                                allPayments,
                                tuitionFeesDataList,
                            );
                            setSchoolingPaymentList(paymentListFormatted);
                            setPaymentOriginalList(paymentListFormatted);

                            // GET CHILD TUITION FEES AMOUNT : somme des montants de tous les groupes
                            setTuitionFeesAmount(sumAmounts(groupResults.map(({childTuitionFeesData}) => childTuitionFeesData)));
                        }
                    }
                }
                setLoading(false);
                checkTokenExpired(userToken, dispatch);
            }
            catch (error) {
                console.log(error);
                setLoading(false);
                checkTokenExpired(userToken, dispatch);
            }
        };
        fetchData().catch(error => {
            console.log(error);
        });
    }, [selectedChild]);

    const renderPaymentItem = useCallback(({item}: {item: any}) => (
        <PaymentItem data={item} />
    ), []);
    const keyExtractorPayment = useCallback((item: any) => String(item.id), []);
    const ListEmptyComponent = useCallback(() => (
        <View>
            <Text style={styles.emptyText}>
                {t('more.empty_payment_list')}
            </Text>
        </View>
    ), [t]);

    if (loading) {
        return <Loading />;
    }
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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

                <PaymentTypeForm
                    open={openTypeForm}
                    value={paymentTypeValue}
                    items={paymentTypeData}
                    setOpen={setOpenTypeForm}
                    setValue={setPaymentTypeValue}
                    setItems={setPaymentTypeData}
                    onChangeValue={onChangePaymentTypeValue}
                />
                <View style={styles.paymentStatus}>
                    <View style={styles.feeBox}>
                        <View style={styles.feeRow}>
                            <Text style={styles.feeLabel}>
                                {t('more.fees_amount')} :
                            </Text>
                            <Text style={styles.feeLabel}>
                                {tuitionFeesAmount?.montantFacture} {t('more.payment_devise')}
                            </Text>
                        </View>

                        <View style={styles.feeRow}>
                            <Text style={styles.feeLabel}>
                                {t('more.schooling_total_payment')} :
                            </Text>
                            <Text style={styles.feeLabel}>
                                {tuitionFeesAmount?.montantPayer} {t('more.payment_devise')}
                            </Text>
                        </View>

                        <View style={styles.feeRow}>
                            <Text style={styles.feeLabel}>
                                {t('more.schooling_payment_balance')} :
                            </Text>
                            <Text style={styles.feeLabel}>
                                {tuitionFeesAmount?.montantSolde} {t('more.payment_devise')}
                            </Text>
                        </View>
                    </View>
                </View>
                <FlatList
                    style={styles.listContainer}
                    data={schoolingPaymentList}
                    renderItem={renderPaymentItem}
                    keyExtractor={keyExtractorPayment}
                    ListEmptyComponent={ListEmptyComponent}
                />
            </View>
        </TouchableWithoutFeedback>
    );
}

export default PaymentList;

const styles = StyleSheet.create({
    listContainer: {
        flex: 1,
        paddingTop: 15,
        paddingLeft: 15,
        paddingRight: 15,
    },
    paymentStatus: {
        padding: 15,
        paddingBottom: 10,
    },
    feeBox: {
        backgroundColor: COLORS.yellowIms,
        padding: 10,
    },
    feeRow: {
        flexDirection: 'row',
    },
    feeLabel: {
        flex: 1,
        color: COLORS.black,
        fontWeight: '600',
        fontSize: 15,
    },
    emptyText: {
        flex: 1,
        textAlign: 'center',
    },
});
