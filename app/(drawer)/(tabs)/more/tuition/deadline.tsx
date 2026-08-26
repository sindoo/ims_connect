import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {JSX, useEffect, useState} from "react";
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

    const getDeadlineList = async (tuitionYearId: number) => {
        setLoading(true);
        try {
            const groupIdReq = await PaymentService.getTuitionDataGroupYear(selectedChild.person.id, tuitionYearId);
            if(groupIdReq !== undefined) {
                const groupId = groupIdReq.groupesectionId;

                //GET TUITION FEES TYPE
                const tuitionFeesTypeData = await PaymentService.getTuitionFeesType();
                if(tuitionFeesTypeData.length > 0) {
                    const tuitionFeesType = PaymentService.getTuitionFeesTypeIdByTag(tuitionFeesTypeData);
                    if(tuitionFeesType !== undefined) {
                        const deadlineListReq = await PaymentService.getDeadlineByChild(selectedChild.person.id, groupId, tuitionYearId, tuitionFeesType.id);
                        setEcheancierList(deadlineListReq);

                        const amountDeadline = PaymentService.getSumOfAllDeadlineByChild(deadlineListReq);
                        setSchoolingAmount(amountDeadline);
                    }
                }
            }
            setLoading(false);
        } catch (error) {
            setEcheancierList([]);
            setSchoolingAmount(0);
            console.log(error);
            setLoading(false);
        }
    }
    const onTuitionYearValueChange = async (tuitionYearId: number) => {
        await getDeadlineList(tuitionYearId);
    }

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
                <View
                    style={{
                        backgroundColor: COLORS.yellowIms,
                        padding: 10,
                        marginTop: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                    } as StyleSheet}>
                    <Text
                        style={{
                            marginRight: 30,
                            color: COLORS.black,
                            fontWeight: '600',
                            fontSize: 15,
                        } as StyleSheet}>
                        {t('more.schooling_amount')}
                    </Text>
                    <Text style={{color: COLORS.black, fontWeight: '600', fontSize: 15} as StyleSheet}>
                        {new Intl.NumberFormat('fr-FR').format(schoolingAmount)} {t('more.payment_devise')}
                    </Text>
                </View>
            </View>
            <ScrollView style={styles.listContainer}>
                {(echeancierList.length === 0 || false) && (
                    <View>
                        <Text style={{flex: 1, textAlign: 'center'} as StyleSheet}>
                            {t('more.empty_deadline_payment')}
                        </Text>
                    </View>
                ) as JSX.Element}
                {echeancierList.length > 0 &&
                    echeancierList.map((echeancier: any) => {
                        return <EcheancierItem key={echeancier.id} data={echeancier} />;
                    })}
            </ScrollView>
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
        //paddingTop: 20,
        paddingLeft: 15,
        paddingRight: 15,
    },
});
