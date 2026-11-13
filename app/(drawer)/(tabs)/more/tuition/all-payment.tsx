import React, {useCallback, useEffect, useState} from 'react';
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
            if(groupIdReq !== undefined) {
                // GET CHILD TUITION FEES AMOUNT
                const groupId = groupIdReq.groupesectionId;
                const childTuitionInfo = await PaymentService.getTuitionFeesAmountByTuitionTypeId(
                    selectedChild.person.id,
                    groupId,
                    tuitionFeesTypeId,
                    tuitionYearId
                );
                const feesStatus = {
                    montantFacture: new Intl.NumberFormat('fr-FR').format(
                        childTuitionInfo?.montantFacture,
                    ),
                    montantPayer: new Intl.NumberFormat('fr-FR').format(
                        childTuitionInfo?.montantPayer,
                    ),
                    montantSolde: new Intl.NumberFormat('fr-FR').format(
                        childTuitionInfo?.montantSolde,
                    ),
                };
                setTuitionFeesAmount(feesStatus);

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
                        if(groupIdReq !== undefined) {
                            const groupId = groupIdReq.groupesectionId;
                            const today = getTime(new Date());

                            // GET CHILD TUITION FEES + PAYMENT LIST : ces deux
                            // appels sont eux aussi independants (aucun ne
                            // depend du resultat de l'autre), on les parallelise.
                            const [childTuitionFeesData, paymentListList] = await Promise.all([
                                PaymentService.getChildTuitionFees(selectedChild.person.id, groupId, currentYear.id),
                                PaymentService.getAllChildPayment(selectedChild.person.id, groupId, currentYear.id, today),
                            ]);

                            const tuitionFeesDataList: any = PaymentService.reformatTuitionFees(tuitionFeesTypeData, childTuitionFeesData);
                            setPaymentTypeData(tuitionFeesDataList);

                            const paymentListFormatted = await PaymentService.reformatChildPaymentList(
                                paymentListList,
                                tuitionFeesDataList,
                            );
                            setSchoolingPaymentList(paymentListFormatted);
                            setPaymentOriginalList(paymentListFormatted);

                            // GET CHILD TUITION FEES AMOUNT : on reutilise
                            // childTuitionFeesData deja recupere ci-dessus au
                            // lieu de rappeler exactement la meme requete
                            // PaymentService.getChildTuitionFees(...) une
                            // seconde fois (appel redondant supprime).
                            const feesStatus = {
                                montantFacture: new Intl.NumberFormat('fr-FR').format(
                                    childTuitionFeesData?.montantFacture,
                                ),
                                montantPayer: new Intl.NumberFormat('fr-FR').format(
                                    childTuitionFeesData?.montantPayer,
                                ),
                                montantSolde: new Intl.NumberFormat('fr-FR').format(
                                    childTuitionFeesData?.montantSolde,
                                ),
                            };
                            setTuitionFeesAmount(feesStatus);
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
