import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {TPaymentItemProps} from "../../../../../lib/type/TPaymentProps";
import {JSX, useEffect, useState} from "react";
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

    const onTuitionYearValueChange = async (tuitionYearId: number) => {
        try {
            setLoading(true);
            console.log(tuitionYearId)
            if(selectedChild !== null) {
                const groupIdReq = await PaymentService.getTuitionDataGroupYear(selectedChild.person.id, tuitionYearId);
                if(groupIdReq !== undefined) {
                    const groupId = groupIdReq.groupesectionId;
                    const proformaData = await PaymentService.getAllChildProforma(selectedChild.person.id, groupId, tuitionYearId);
                    setProformaList(proformaData);
                }
            }
            setLoading(false);
        } catch (error) {
            setProformaList([]);
            setLoading(false);
            console.log(error);
        }
    };

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

                        const groupIdReq = await PaymentService.getTuitionDataGroupYear(selectedChild.person.id, currentYear.id);
                        if(groupIdReq !== undefined) {
                            const groupId = groupIdReq.groupesectionId;
                            const proformaData = await PaymentService.getAllChildProforma(selectedChild.person.id, groupId, currentYear.id);
                            setProformaList(proformaData);
                        }
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

            <ScrollView style={styles.listContainer}>
                {(proformaList.length === 0 || false) && (
                    <View>
                        <Text style={{flex: 1, textAlign: 'center'} as StyleSheet}>
                            {t('more.empty_proforma_list')}
                        </Text>
                    </View>
                ) as JSX.Element}

                {proformaList.length > 0 &&
                    proformaList.map((proforma: any) => (
                        <ProformaItem
                            key={proforma.id}
                            data={proforma}
                        />
                    ))}
            </ScrollView>
        </View>
    );
}

export default Proforma;

const styles = StyleSheet.create({
    listContainer: {
        flex: 1,
        paddingTop: 20,
    },
});
