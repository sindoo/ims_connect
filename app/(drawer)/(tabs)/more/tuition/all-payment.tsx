import React, {useEffect, useRef, useState} from 'react';
import {
    Keyboard,
    ScrollView,
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

    const handleTuitionFeesAmountPaymentList = async (tuitionYearId: number, tuitionFeesTypeId: number) => {
        try {
            const groupIdReq = await PaymentService.getTuitionDataGroupYear(selectedChild.person.id, tuitionYearId);
            if(groupIdReq !== undefined) {
                // GET CHILD TUITION FEES AMOUNT
                const groupId = groupIdReq.groupesectionId;
                let childTuitionInfo = await PaymentService.getTuitionFeesAmountByTuitionTypeId(
                    selectedChild.person.id,
                    groupId,
                    paymentTypeValue,
                    tuitionYearValue
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
                    (payment: any) => payment.scolariteTypeId === paymentTypeValue,
                );
                setSchoolingPaymentList(filterPaymentList);
            }
        } catch (error) {
            console.log(error);
            setTuitionFeesAmount({ montantFacture: '0', montantPayer: '0', montantSolde: '0' });
            setSchoolingPaymentList([]);
        }
    }
    const onTuitionYearValueChange = async (tuitionYearId: number) => {
        setLoading(true);
        await handleTuitionFeesAmountPaymentList(tuitionYearId, paymentTypeValue);
        setLoading(false);
    }
    const onChangePaymentTypeValue = async (tuitionFeesTypeId: any) => {
        setLoading(true);
        await handleTuitionFeesAmountPaymentList(tuitionYearValue, paymentTypeValue);
        setLoading(false);
    };

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

                       //GET TUITION FEES TYPE
                       const tuitionFeesTypeData = await PaymentService.getTuitionFeesType();
                       const groupIdReq = await PaymentService.getTuitionDataGroupYear(selectedChild.person.id, currentYear.id);
                       if(groupIdReq !== undefined) {
                           const groupId = groupIdReq.groupesectionId;
                           const childTuitionFeesData = await PaymentService.getChildTuitionFees(selectedChild.person.id, groupId, currentYear.id);
                           const tuitionFeesDataList: any = PaymentService.reformatTuitionFees(tuitionFeesTypeData, childTuitionFeesData);
                           setPaymentTypeData(tuitionFeesDataList);

                           //GET ALL PAYMENT LIST
                           const today = getTime(new Date());
                           const paymentListList = await PaymentService.getAllChildPayment(selectedChild.person.id, groupId, currentYear.id, today);
                           const paymentListFormatted = await PaymentService.reformatChildPaymentList(
                               paymentListList,
                               tuitionFeesDataList,
                           );
                           setSchoolingPaymentList(paymentListFormatted);
                           setPaymentOriginalList(paymentListFormatted);

                           // GET CHILD TUITION FEES AMOUNT
                           const childTuitionInfo = await PaymentService.getChildTuitionFees(selectedChild.person.id, groupId, currentYear.id);
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
                       }
                       setLoading(false);
                   }
               }
               setLoading(false);

               checkTokenExpired(userToken, dispatch);
           }
           catch (error) {
               //console.log(JSON.stringify(error))
               console.log(error);
               setLoading(false);
               checkTokenExpired(userToken, dispatch);
           }
        };
        fetchData().catch(error => {
            console.log(error);
        });
    }, [selectedChild]);

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
                    <View style={{backgroundColor: COLORS.yellowIms, padding: 10}}>
                        <View style={{flexDirection: 'row'} as StyleSheet}>
                            <Text
                                style={{
                                    flex: 1,
                                    color: COLORS.black,
                                    fontWeight: '600',
                                    fontSize: 15,
                                } as StyleSheet}>
                                {t('more.fees_amount')} :
                            </Text>
                            <Text
                                style={{
                                    flex: 1,
                                    color: COLORS.black,
                                    fontWeight: '600',
                                    fontSize: 15,
                                } as StyleSheet}>
                                {tuitionFeesAmount?.montantFacture} {t('more.payment_devise')}
                            </Text>
                        </View>

                        <View style={{flexDirection: 'row'} as StyleSheet}>
                            <Text
                                style={{
                                    flex: 1,
                                    color: COLORS.black,
                                    fontWeight: '600',
                                    fontSize: 15,
                                } as StyleSheet}>
                                {t('more.schooling_total_payment')} :
                            </Text>
                            <Text
                                style={{
                                    flex: 1,
                                    color: COLORS.black,
                                    fontWeight: '600',
                                    fontSize: 15,
                                } as StyleSheet}>
                                {tuitionFeesAmount?.montantPayer} {t('more.payment_devise')}
                            </Text>
                        </View>

                        <View style={{flexDirection: 'row'} as StyleSheet}>
                            <Text
                                style={{
                                    flex: 1,
                                    color: COLORS.black,
                                    fontWeight: '600',
                                    fontSize: 15,
                                } as StyleSheet}>
                                {t('more.schooling_payment_balance')} :
                            </Text>
                            <Text
                                style={{
                                    flex: 1,
                                    color: COLORS.black,
                                    fontWeight: '600',
                                    fontSize: 15,
                                } as StyleSheet}>
                                {tuitionFeesAmount?.montantSolde} {t('more.payment_devise')}
                            </Text>
                        </View>
                    </View>
                </View>
                <ScrollView style={styles.listContainer}>
                    {(schoolingPaymentList.length === 0 || false) && (
                        <View>
                            <Text style={{flex: 1, textAlign: 'center'} as StyleSheet}>
                                {t('more.empty_payment_list')}
                            </Text>
                        </View>
                    )}
                    {schoolingPaymentList.length > 0 &&
                        schoolingPaymentList.map((payment: any) => (
                            <PaymentItem
                                key={payment.id}
                                data={payment}
                            />
                        ))}
                </ScrollView>
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
});
