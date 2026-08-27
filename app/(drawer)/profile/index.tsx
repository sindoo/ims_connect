import React, {useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import {Image, ImageBackground} from "expo-image";
import {Formik} from 'formik';
import * as yup from 'yup';
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import {request, uploadFileRequest} from "../../../api/ApiManager";
import {changeChild} from "../../../redux/features/child/childSlice";
import UtilitiesService from "../../../services/UtilitiesService";
import {COLORS, CONSTANT, GENDER_EN, GENDER_FR, IMAGE_RIGHTS_EN, IMAGE_RIGHTS_FR, IMAGES} from "../../../constants";
import Loading from "../../../components/ui/Loading";
import {withSnackbar} from "../../../components/ui/SnackbarHOC";
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import dataPays from '../../../data/pays';
import { pick, types } from '@react-native-documents/picker';
import {BASEURL_IMG} from "../../../api/appUrl";
import {globalStyles} from "../../../style/Global";
import {format, toDate} from "date-fns";
import {enUS, fr} from "date-fns/locale";
import DatePicker from 'react-native-date-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import FlatButton from "../../../components/ui/FlatButton";

const editProfileFormSchema = yup.object({
    prenom: yup.string().required().min(3),
    nom: yup.string().required().min(3),
    adresse: yup.string(),
    motherPrenom: yup.string().required().min(3),
    motherNom: yup.string().required().min(3),
    motherPhone1: yup.string().required(),
    motherEmail: yup.string().email().required(),
    fatherPrenom: yup.string().required().min(3),
    fatherNom: yup.string().required().min(3),
    fatherPhone1: yup.string().required(),
    fatherEmail: yup.string().email().required(),
    allergy: yup.string(),
    foodRestriction: yup.string(),
    healthDetail: yup.string(),
    emergencyNom1: yup.string(),
    emergencyPhone1: yup.string(),
    emergencyNom2: yup.string(),
    emergencyPhone2: yup.string(),
});

const nationalityData = [
    {label: 'Ivoirienne', value: '1'},
    {label: 'Francaise', value: '2'},
];

function Profile(props: any) {
    const {snackbarShowMessage} = props;
    const {t, i18n} = useTranslation();
    const [dayOfBirth, setDayOfBirth] = useState(new Date());
    const [openDayOfBirth, setOpenDayOfBirth] = useState(false);
    const language = i18n.language.toUpperCase();
    const {selectedChild} = useSelector((state: any) => state.child);

    const [openClassroom, setOpenClassroom] = useState(false);
    const [classValue, setClassValue] = useState<any>(null);
    const [classroomData, setClassroomData] = useState<any>([]);

    const [openGender, setOpenGender] = useState(false);
    const [genderValue, setGenderValue] = useState<any>(null);
    const [genderData, setGenderData] = useState([]);

    const [openNationality, setOpenNationality] = useState(false);
    const [nationalityValue, setNationalityValue] = useState<any>([]);
    const [nationalityName, setNationalityName] = useState<any>([]);
    const [nationalitiesData, setNationalitiesData] =
        useState<any>(nationalityData);

    const [openImageRight, setOpenImageRight] = useState(false);
    const [imageRightValue, setImageRightValue] = useState<any>([]);
    const [imageRightName, setImageRightName] = useState<any>([]);
    const [imageRightData, setImageRightData] = useState<any>([]);
    const [loading, setLoading] = useState(false);
    const [sendingPictureStatus, setSendingPictureStatus] = useState(false);
    const [editable, setEditable] = useState(true);
    const [buttonStatus, setButtonStatus] = useState(false);
    const [motherInformation, setMotherInformation] = useState<any>(null);
    const [fatherInformation, setFatherInformation] = useState<any>(null);
    const dispatch = useDispatch();

    const uploadChildPicture = (name: any, uri: any, type: any) => {
        let formData: any = new FormData();
        formData.append('photo', {
            uri: uri,
            type: type,
            name: name,
        });
        const dataForm = Object.fromEntries(formData);
        //console.log(JSON.stringify(dataForm))
        uploadFileRequest('POST', '', '/corebase/enfants/photo/enfant', dataForm)
            .then(response => {
                setSendingPictureStatus(true);
                const selectedChildUpdate = {
                    ...selectedChild,
                    person: {
                        ...selectedChild.person,
                        photo: response.data,
                    },
                };
                request('POST', '', '/corebase/enfants/mobile', selectedChildUpdate)
                    .then(responseData => {
                        dispatch(changeChild(responseData.data));
                        //setLoading(false);
                        setSendingPictureStatus(false);
                    })
                    .catch((error: any) => {
                        // Error message
                        console.log(error);
                        setSendingPictureStatus(false);
                    });
            })
            .catch((error: any) => {
                // Error message
                console.log(error);
                setSendingPictureStatus(false);
            });
    };
    const handleChangeChildPicture = async () => {
        try {

            if (Platform.OS === 'android') {
                /*const doc = await DocumentPicker.pick({
                    type: [DocumentPicker.types.images],
                });*/
                const [doc] = await pick({
                    type: [types.images],
                });
                uploadChildPicture(doc.name, doc.uri, doc.type);
            }
            else if(Platform.OS === 'ios') {
                const options: any = {
                    mediaType: 'photo',
                    includeBase64: false,
                    maxHeight: 1000,
                    maxWidth: 1000,
                };

                const doc = await launchImageLibrary(options);
                if(Array.isArray(doc?.assets)) {
                    if(doc?.assets.length > 0) {
                        const docInfo = doc?.assets[0];
                        uploadChildPicture(docInfo?.fileName, docInfo?.uri, docInfo?.type);
                        //console.log(JSON.stringify(doc?.assets[0]));
                    }
                }
            }

        } catch (error) {
            // Error message
            console.log(error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if(selectedChild !== null) {
                setLoading(true);
                let dateNaissance = selectedChild?.person?.dateNaissance;
                dateNaissance = toDate(dateNaissance);
                setDayOfBirth(dateNaissance);

                //GET CLASSROOM LIST
                const classroomList = await UtilitiesService.getAllClassrooms();
                setLoading(false);
                let classroomDataList = [];
                if(classroomList.length > 0) {
                    classroomDataList = classroomList.sort(function (a: any, b: any) {
                        if (a.nom < b.nom) {
                            return -1;
                        }
                        if (a.nom > b.nom) {
                            return 1;
                        }
                        return 0;
                    });

                    classroomDataList = classroomList.map((classroom: any) => {
                        return {
                            value: classroom?.id,
                            label: classroom?.nom,
                            ...classroom,
                        };
                    });
                    setClassroomData(classroomDataList);
                }

                //CHILD CLASSROOM
                const childClassroom = selectedChild?.eleves?.length > 0
                    ? selectedChild?.eleves[0]?.classe?.id
                    : 0;
                setClassValue(childClassroom);

                // GENDER CHILD
                const genderListReq = language === 'EN' ? GENDER_EN : GENDER_FR;
                const genderList = genderListReq.map((gender: any) => {
                    return {
                        value: gender?.key,
                        label: gender?.name,
                        ...gender,
                    };
                });
                setGenderData(genderList);
                setGenderValue(selectedChild?.person?.sexe);

                // NATIONALITIES LIST
                let nationalityList = dataPays.sort(function (a: any, b: any) {
                    if (language === 'EN') {
                        if (a.nom_en_gb < b.nom_en_gb) {
                            return -1;
                        }
                        if (a.nom_en_gb > b.nom_en_gb) {
                            return 1;
                        }
                        return 0;
                    } else {
                        if (a.nom_fr_fr < b.nom_fr_fr) {
                            return -1;
                        }
                        if (a.nom_fr_fr > b.nom_fr_fr) {
                            return 1;
                        }
                        return 0;
                    }
                });

                nationalityList = nationalityList.map((country: any) => {
                    return {
                        value: country?.id,
                        label: language === 'EN' ? country?.nom_en_gb : country?.nom_fr_fr,
                        ...country,
                    };
                });
                setNationalitiesData(nationalityList);
                const childNationality =
                    selectedChild?.person?.paysPersons.length > 0
                        ? selectedChild?.person?.paysPersons
                        : [];
                let childNationalitiesList = [];
                let childNationalitiesNameList = [];
                if (childNationality.length > 0) {
                    for (let i = 0; i < childNationality.length; i++) {
                        childNationalitiesList.push(childNationality[i]?.paysId);
                        const paysFind: any = nationalityList.find(
                            (pays: any) => pays.id === childNationality[i]?.paysId,
                        );
                        childNationalitiesNameList.push(paysFind);
                    }
                }
                setNationalityName(childNationalitiesNameList);
                setNationalityValue(childNationalitiesList);

                //IMAGE RIGHTS
                const imageRightListReq = await UtilitiesService.getChildImageRights();
                let imageRightList: any = imageRightListReq.sort(function (a: any, b: any) {
                    if (a.nom < b.nom) {
                        return -1;
                    }
                    if (a.nom > b.nom) {
                        return 1;
                    }
                    return 0;
                });

                let IMAGE_RRIGHTS_LANG = i18n.language === 'en' ? IMAGE_RIGHTS_EN : IMAGE_RIGHTS_FR;
                IMAGE_RRIGHTS_LANG = IMAGE_RRIGHTS_LANG.sort(function (a: any, b: any) {
                    if (a.label < b.label) {
                        return -1;
                    }
                    if (a.label > b.label) {
                        return 1;
                    }
                    return 0;
                });

                imageRightList = imageRightList.map((imageRight: any) => {
                    const findImage = IMAGE_RRIGHTS_LANG.find((image: any) => imageRight?.id === image.id);
                    return {
                        ...imageRight,
                        value: findImage.id,
                        label: findImage.label,
                        //value: imageRight?.id,
                        //label: imageRight?.nom,
                    };
                });
                setImageRightData(imageRightList);

                const childImageRight: any = selectedChild?.droitImages.length > 0
                    ? selectedChild?.droitImages
                    : [];

                let childImageRightList = [];
                let childImageRightNameList = [];
                if (childImageRight.length > 0) {
                    for (let i = 0; i < childImageRight.length; i++) {
                        childImageRightList.push(childImageRight[i]?.droitImageId);
                        const imageRightFind: any = imageRightList.find(
                            (image: any) => image.id === childImageRight[i]?.droitImageId,
                        );
                        childImageRightNameList.push(imageRightFind);
                    }
                }

                setImageRightName(childImageRightNameList);
                setImageRightValue(childImageRightList);

                // PARENTS INFORMATION'S
                let mothersData = {
                    motherPrenom: '',
                    motherNom: '',
                    motherPhone1: '',
                    motherEmail: ''
                }

                let fathersData = {
                    fatherPrenom: '',
                    fatherNom: '',
                    fatherPhone1: '',
                    fatherEmail: ''
                }

                if(selectedChild?.enfantParents.length > 0){
                    for(let i= 0; i<selectedChild?.enfantParents.length; i++){
                        if(selectedChild?.enfantParents[i]?.parent?.person?.sexe === 'FEMME') {
                            mothersData.motherPrenom = selectedChild?.enfantParents[i]?.parent?.person?.prenom;
                            mothersData.motherNom = selectedChild?.enfantParents[i]?.parent?.person?.nom;
                            mothersData.motherPhone1 = selectedChild?.enfantParents[i]?.parent?.person?.phone1;
                            mothersData.motherEmail = selectedChild?.enfantParents[i]?.parent?.person?.email;
                        }
                        else if(selectedChild?.enfantParents[i]?.parent?.person?.sexe === 'HOMME'){
                            fathersData.fatherPrenom = selectedChild?.enfantParents[i]?.parent?.person?.prenom;
                            fathersData.fatherNom = selectedChild?.enfantParents[i]?.parent?.person?.nom;
                            fathersData.fatherPhone1 = selectedChild?.enfantParents[i]?.parent?.person?.phone1;
                            fathersData.fatherEmail = selectedChild?.enfantParents[i]?.parent?.person?.email;
                        }
                    }

                    setMotherInformation(mothersData);
                    setFatherInformation(fathersData);
                }

                //setLoading(false);
            }
        };
        fetchData().catch(error => {
            console.log(error);
            setLoading(false);
        });
    }, [selectedChild]);

    if (loading) {
        return <Loading />;
    }

    // @ts-ignore
    return (
        <ScrollView style={styles.container}>
            <ImageBackground
                source={IMAGES.backgroundImageApp}
                contentFit="cover"
                style={styles.backgroundImage}>
                <View style={styles.profileContainer}>
                    <Formik
                        enableReinitialize
                        initialValues={{
                            prenom: selectedChild?.person?.prenom,
                            nom: selectedChild?.person?.nom,
                            adresse: selectedChild?.person?.adresse,
                            motherPrenom:
                                selectedChild?.enfantParents?.length > 0 && motherInformation !== null
                                    ? motherInformation?.motherPrenom
                                    : '',
                            motherNom:
                                selectedChild?.enfantParents?.length > 0 && motherInformation !== null
                                    ? motherInformation?.motherNom
                                    : '',
                            motherPhone1:
                                selectedChild?.enfantParents?.length > 0 && motherInformation !== null
                                    ? motherInformation?.motherPhone1
                                    : '',
                            motherEmail:
                                selectedChild?.enfantParents?.length > 0 && motherInformation !== null
                                    ? motherInformation?.motherEmail
                                    : '',
                            fatherPrenom:
                                selectedChild?.enfantParents?.length > 0 && fatherInformation !== null
                                    ? fatherInformation?.fatherPrenom
                                    : '',
                            fatherNom:
                                selectedChild?.enfantParents?.length > 0 && fatherInformation !== null
                                    ? fatherInformation?.fatherNom
                                    : '',
                            fatherPhone1:
                                selectedChild?.enfantParents?.length > 0 && fatherInformation !== null
                                    ? fatherInformation?.fatherPhone1
                                    : '',
                            fatherEmail:
                                selectedChild?.enfantParents?.length > 0 && fatherInformation !== null
                                    ? fatherInformation?.fatherEmail
                                    : '',
                            allergy: selectedChild?.allergy,
                            foodRestriction: selectedChild?.foodRestriction,
                            healthDetail: selectedChild?.healthDetail,
                            emergencyNom1: selectedChild?.emergencyNom1,
                            emergencyPhone1: selectedChild?.emergencyPhone1,
                            emergencyNom2: selectedChild?.emergencyNom2,
                            emergencyPhone2: selectedChild?.emergencyPhone2,
                        }}
                        validationSchema={editProfileFormSchema}
                        onSubmit={(data: any, actions: any) => {
                            if (selectedChild !== null) {
                                setButtonStatus(true);
                                let selectedChildMod: any;

                                selectedChildMod = {
                                    ...selectedChild,
                                    person: {
                                        ...selectedChild.person,
                                        nom: data.nom.trim(),
                                        prenom: data.prenom.trim(),
                                        dateNaissance: dayOfBirth.getTime(),
                                        sexe: genderValue,
                                        adresse: data?.adresse?.trim(),
                                    },
                                    allergy: data?.allergy?.trim(),
                                    foodRestriction: data?.foodRestriction?.trim(),
                                    healthDetail: data?.healthDetail?.trim(),
                                    emergencyNom1: data?.emergencyNom1?.trim(),
                                    emergencyPhone1: data?.emergencyPhone1?.trim(),
                                    emergencyNom2: data?.emergencyNom2?.trim(),
                                    emergencyPhone2: data?.emergencyPhone2?.trim(),
                                };

                                //CLASSROOM
                                if (selectedChild.eleves.length > 0) {
                                    selectedChildMod = {
                                        ...selectedChildMod,
                                        eleves: [
                                            {
                                                ...selectedChildMod.eleves[0],
                                                classe: {
                                                    ...selectedChildMod.eleves[0]?.classe,
                                                    id: classValue,
                                                },
                                            },
                                        ],
                                    };
                                }

                                // NATIONALITY
                                let paysPersonEnfant: any = selectedChild?.person?.paysPersons;
                                let nationalityEnfant: any = [];
                                if (nationalityValue.length > 0) {
                                    nationalityEnfant = nationalityValue.map(
                                        (nationalityId: any) => {
                                            let id = null;
                                            let common = CONSTANT.common;
                                            if (paysPersonEnfant.length > 0) {
                                                for (let i = 0; i < paysPersonEnfant.length; i++) {
                                                    if (paysPersonEnfant[i].paysId === nationalityId) {
                                                        id = paysPersonEnfant[i].id;
                                                        common = paysPersonEnfant[i].common;
                                                    }
                                                }
                                            }

                                            return {
                                                id: id,
                                                personId: selectedChild?.person?.id,
                                                paysId: nationalityId,
                                                common: common,
                                            };
                                        },
                                    );
                                }

                                selectedChildMod = {
                                    ...selectedChildMod,
                                    person: {
                                        ...selectedChildMod.person,
                                        paysPersons: nationalityEnfant,
                                    },
                                };
                                let enfantParents = selectedChildMod?.enfantParents;
                                if(selectedChildMod?.enfantParents.length > 0) {
                                    let enfantParentsMother = null;
                                    let enfantParentsFather = null;

                                    for(let i= 0; i<selectedChildMod?.enfantParents.length; i++){
                                        if(selectedChildMod?.enfantParents[i]?.parent?.person?.sexe === 'FEMME') {
                                            enfantParentsMother = {
                                                ...selectedChildMod.enfantParents[i],
                                                parent: {
                                                    ...selectedChildMod.enfantParents[i].parent,
                                                    person: {
                                                        ...selectedChildMod.enfantParents[i].parent.person,
                                                        nom: data?.motherNom?.trim(),
                                                        prenom: data?.motherPrenom?.trim(),
                                                        email: data?.motherEmail?.trim(),
                                                        phone1: data?.motherPhone1?.trim(),
                                                    },
                                                },
                                            }
                                        }
                                        else if(selectedChildMod?.enfantParents[i]?.parent?.person?.sexe === 'HOMME'){
                                            enfantParentsFather = {
                                                ...selectedChildMod.enfantParents[i],
                                                parent: {
                                                    ...selectedChildMod.enfantParents[i].parent,
                                                    person: {
                                                        ...selectedChildMod.enfantParents[i].parent.person,
                                                        nom: data?.fatherNom?.trim(),
                                                        prenom: data?.fatherPrenom?.trim(),
                                                        email: data?.fatherEmail?.trim(),
                                                        phone1: data?.fatherPhone1?.trim(),
                                                    },
                                                },
                                            }
                                        }
                                    }
                                    enfantParents = [
                                        enfantParentsMother,
                                        enfantParentsFather
                                    ];
                                }
                                //INFORMATIONS PARENT
                                if (selectedChild?.enfantParents.length > 0) {
                                    selectedChildMod = {
                                        ...selectedChildMod,
                                        enfantParents: enfantParents,
                                    };
                                }

                                //IMAGE RIGHTS
                                let oldImageRight: any = selectedChild.droitImages;
                                let imageRights: any = [];
                                if (imageRightValue.length > 0) {
                                    imageRights = imageRightValue.map((imageId: any) => {
                                        let id = null;
                                        let common = CONSTANT.common;
                                        if (oldImageRight.length > 0) {
                                            for (let i = 0; i < oldImageRight.length; i++) {
                                                if (oldImageRight[i].droitImageId === imageId) {
                                                    id = oldImageRight[i].id;
                                                    common = oldImageRight[i].common;
                                                }
                                            }
                                        }

                                        return {
                                            id: id,
                                            enfantId: selectedChild?.person?.id,
                                            droitImageId: imageId,
                                            common: common,
                                        };
                                    });
                                }

                                selectedChildMod = {
                                    ...selectedChildMod,
                                    droitImages: imageRights,
                                };

                                request(
                                    'POST',
                                    '',
                                    '/corebase/enfants/mobile',
                                    selectedChildMod,
                                )
                                    .then(response => {
                                        dispatch(changeChild(response.data));
                                        setButtonStatus(false);
                                        snackbarShowMessage(t('snackBar.sb_succes_save'));
                                    })
                                    .catch((error: any) => {
                                        // Error message
                                        console.log(JSON.stringify(error));
                                        setButtonStatus(false);
                                        snackbarShowMessage(t('snackBar.sb_error'));
                                    });
                            }
                        }}>
                        {formikProps => (
                            <>
                                <View  style={styles.avatarContainer}>
                                    <View style={styles.containerAvatar}>
                                        <Pressable onPress={() => handleChangeChildPicture()}>
                                            {sendingPictureStatus ? (
                                                <ActivityIndicator size={"small"} color={COLORS.gray}/>
                                            ) : (
                                                <Image
                                                    source={
                                                        selectedChild !== null &&
                                                        selectedChild?.person?.photo !== '' &&
                                                        selectedChild?.person?.photo !== null
                                                            ? {
                                                                uri: `${BASEURL_IMG}/${selectedChild?.person?.photo}`,
                                                            }
                                                            : IMAGES.avatar
                                                    }
                                                    style={styles.avatar}
                                                />
                                            )}
                                        </Pressable>
                                    </View>
                                </View>

                                <View style={styles.childIdentity}>
                                    <Text style={{...globalStyles.titleH2, paddingLeft: 10}}>
                                        {t('child_profile.identity')}
                                    </Text>
                                    <View style={styles.inputLabelContainer}>
                                        <View style={styles.leftInputLabelContainer}>
                                            <Text style={styles.inputlabel}>
                                                {t('child_profile.first_name')}
                                            </Text>
                                            <TextInput
                                                style={styles.inputText}
                                                placeholder={t('child_profile.first_name')}
                                                onChangeText={formikProps.handleChange('prenom')}
                                                value={formikProps.values.prenom}
                                                onBlur={formikProps.handleBlur('prenom')}
                                                editable={editable}
                                            />
                                        </View>
                                        <View style={styles.rightInputLabelContainer}>
                                            <Text style={styles.inputlabel}>
                                                {t('child_profile.last_name')}
                                            </Text>
                                            <TextInput
                                                style={styles.inputText}
                                                placeholder={t('child_profile.last_name')}
                                                onChangeText={formikProps.handleChange('nom')}
                                                value={formikProps.values.nom}
                                                onBlur={formikProps.handleBlur('nom')}
                                                editable={editable}
                                            />
                                        </View>
                                    </View>

                                    <View style={{...styles.inputLabelContainer, zIndex: 3}}>
                                        <View style={styles.leftInputLabelContainer}>
                                            <Text style={styles.inputlabel}>
                                                {t('child_profile.birth_day')}
                                            </Text>
                                            <Pressable onPress={() => setOpenDayOfBirth(true)}>
                                                <Text
                                                    style={{
                                                        ...styles.inputText,
                                                        paddingTop: 13,
                                                        paddingBottom: 13,
                                                    }}>
                                                    {format(dayOfBirth, 'P', {
                                                        locale: i18n.language === 'en' ? enUS : fr,
                                                    })}
                                                </Text>
                                            </Pressable>
                                            <DatePicker
                                                modal
                                                open={openDayOfBirth}
                                                date={dayOfBirth}
                                                mode="date"
                                                locale={i18n.language}
                                                onConfirm={date => {
                                                    setDayOfBirth(date);
                                                    setOpenDayOfBirth(false);
                                                }}
                                                onCancel={() => {
                                                    setOpenDayOfBirth(false);
                                                }}
                                            />
                                        </View>
                                        <View style={styles.rightInputLabelContainer}>
                                            <Text style={styles.inputlabel}>
                                                {t('child_profile.classroom')}
                                            </Text>
                                            <DropDownPicker
                                                open={openClassroom}
                                                value={classValue}
                                                items={classroomData}
                                                setOpen={setOpenClassroom}
                                                setValue={setClassValue}
                                                setItems={setClassroomData}
                                                listMode="MODAL"
                                                disabled={true}
                                                placeholder={t('child_profile.classroom')}
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
                                    </View>
                                    <View style={{...styles.inputLabelContainer, zIndex: 2}}>
                                        <View style={styles.leftInputLabelContainer}>
                                            <Text style={styles.inputlabel}>
                                                {t('child_profile.address')}
                                            </Text>
                                            <TextInput
                                                style={styles.inputText}
                                                placeholder={t('child_profile.address')}
                                                onChangeText={formikProps.handleChange('adresse')}
                                                value={formikProps.values.adresse}
                                                onBlur={formikProps.handleBlur('adresse')}
                                                editable={editable}
                                            />
                                        </View>
                                    </View>

                                    <View style={{...styles.inputLabelContainer, zIndex: 2}}>
                                        <View style={styles.rightInputLabelContainer}>
                                            <Text style={styles.inputlabel}>
                                                {t('child_profile.gender')}
                                            </Text>
                                            <DropDownPicker
                                                open={openGender}
                                                value={genderValue}
                                                items={genderData}
                                                setOpen={setOpenGender}
                                                setValue={setGenderValue}
                                                // @ts-ignore
                                                setItems={setGenderData}
                                                listMode="SCROLLVIEW"
                                                placeholder={t('child_profile.gender')}
                                                //disabled={true}
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
                                    </View>

                                    {/* NATIONALITY */}
                                    <View
                                        style={{
                                            ...styles.inputLabelContainer,
                                            flexDirection: 'column',
                                            zIndex: 1,
                                        }}>
                                        <Text style={styles.inputlabel}>
                                            {t('child_profile.nationality')}
                                        </Text>
                                        <DropDownPicker
                                            open={openNationality}
                                            value={nationalityValue}
                                            items={nationalitiesData}
                                            setOpen={setOpenNationality}
                                            setValue={setNationalityValue}
                                            setItems={setNationalitiesData}
                                            listMode="MODAL"
                                            placeholder={t('child_profile.nationality')}
                                            modalTitle={t('child_profile.nationality')}
                                            multiple={true}
                                            //disabled={true}
                                            modalTitleStyle={{
                                                fontWeight: 'normal',
                                                color: COLORS.secondary, ...styles.osType
                                            }}
                                            closeIconStyle={{
                                                width: 24,
                                                height: 24,
                                            }}
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
                                        <View style={{marginTop: 5, marginHorizontal: 5}}>
                                            <Text>
                                                {nationalityName.length > 0 &&
                                                    nationalityName.map((pays: any, index: number) => {
                                                        let country =
                                                            language === 'EN'
                                                                ? pays.nom_en_gb
                                                                : pays.nom_fr_fr;
                                                        if (index + 1 === nationalityName.length) {
                                                            return `${country}`;
                                                        } else {
                                                            return `${country}, `;
                                                        }
                                                    })}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* MOTHER'S INFORMATION */}
                                <View style={styles.motherInformation}>
                                    <Text style={{...globalStyles.titleH2, paddingLeft: 10}}>
                                        {t('child_profile.mother_information')}
                                    </Text>
                                    <View style={styles.inputLabelContainer}>
                                        <View style={styles.leftInputLabelContainer}>
                                            <Text style={styles.inputlabel}>
                                                {t('child_profile.first_name')}
                                            </Text>
                                            <TextInput
                                                style={styles.inputText}
                                                placeholder={t('child_profile.first_name')}
                                                onChangeText={formikProps.handleChange('motherPrenom')}
                                                value={formikProps.values.motherPrenom}
                                                onBlur={formikProps.handleBlur('motherPrenom')}
                                                editable={editable}
                                            />
                                        </View>
                                        <View style={styles.rightInputLabelContainer}>
                                            <Text style={styles.inputlabel}>
                                                {t('child_profile.last_name')}
                                            </Text>
                                            <TextInput
                                                style={styles.inputText}
                                                placeholder={t('child_profile.last_name')}
                                                onChangeText={formikProps.handleChange('motherNom')}
                                                value={formikProps.values.motherNom}
                                                onBlur={formikProps.handleBlur('motherNom')}
                                                editable={editable}
                                            />
                                        </View>
                                    </View>

                                    <View
                                        style={{
                                            ...styles.inputLabelContainer,
                                            flexDirection: 'column',
                                        }}>
                                        <Text style={styles.inputlabel}>
                                            {t('child_profile.phone_number')}
                                        </Text>
                                        <TextInput
                                            style={styles.inputText}
                                            placeholder={t('child_profile.phone_number')}
                                            onChangeText={formikProps.handleChange('motherPhone1')}
                                            value={formikProps.values.motherPhone1}
                                            onBlur={formikProps.handleBlur('motherPhone1')}
                                            editable={editable}
                                        />
                                    </View>

                                    <View
                                        style={{
                                            ...styles.inputLabelContainer,
                                            flexDirection: 'column',
                                        }}>
                                        <Text style={styles.inputlabel}>
                                            {t('child_profile.email')}
                                        </Text>
                                        <TextInput
                                            style={styles.inputText}
                                            placeholder={t('child_profile.email')}
                                            onChangeText={formikProps.handleChange('motherEmail')}
                                            value={formikProps.values.motherEmail}
                                            onBlur={formikProps.handleBlur('motherEmail')}
                                            editable={editable}
                                        />
                                    </View>
                                </View>

                                {/* FATHER'S INFORMATION */}
                                <View style={styles.motherInformation}>
                                    <Text style={{...globalStyles.titleH2, paddingLeft: 10}}>
                                        {t('child_profile.father_information')}
                                    </Text>
                                    <View style={styles.inputLabelContainer}>
                                        <View style={styles.leftInputLabelContainer}>
                                            <Text style={styles.inputlabel}>
                                                {t('child_profile.first_name')}
                                            </Text>
                                            <TextInput
                                                style={styles.inputText}
                                                placeholder={t('child_profile.first_name')}
                                                onChangeText={formikProps.handleChange('fatherPrenom')}
                                                value={formikProps.values.fatherPrenom}
                                                onBlur={formikProps.handleBlur('fatherPrenom')}
                                                editable={editable}
                                            />
                                        </View>
                                        <View style={styles.rightInputLabelContainer}>
                                            <Text style={styles.inputlabel}>
                                                {t('child_profile.last_name')}
                                            </Text>
                                            <TextInput
                                                style={styles.inputText}
                                                placeholder={t('child_profile.last_name')}
                                                onChangeText={formikProps.handleChange('fatherNom')}
                                                value={formikProps.values.fatherNom}
                                                onBlur={formikProps.handleBlur('fatherNom')}
                                                editable={editable}
                                            />
                                        </View>
                                    </View>

                                    <View
                                        style={{
                                            ...styles.inputLabelContainer,
                                            flexDirection: 'column',
                                        }}>
                                        <Text style={styles.inputlabel}>
                                            {t('child_profile.phone_number')}
                                        </Text>
                                        <TextInput
                                            style={styles.inputText}
                                            placeholder={t('child_profile.phone_number')}
                                            onChangeText={formikProps.handleChange('fatherPhone1')}
                                            value={formikProps.values.fatherPhone1}
                                            onBlur={formikProps.handleBlur('fatherPhone1')}
                                            editable={editable}
                                        />
                                    </View>

                                    <View
                                        style={{
                                            ...styles.inputLabelContainer,
                                            flexDirection: 'column',
                                        }}>
                                        <Text style={styles.inputlabel}>
                                            {t('child_profile.email')}
                                        </Text>
                                        <TextInput
                                            style={styles.inputText}
                                            placeholder={t('child_profile.email')}
                                            onChangeText={formikProps.handleChange('fatherEmail')}
                                            value={formikProps.values.fatherEmail}
                                            onBlur={formikProps.handleBlur('fatherEmail')}
                                            editable={editable}
                                        />
                                    </View>
                                </View>

                                {/* CHILD'S HEALTH DETAILS */}
                                <View style={styles.motherInformation}>
                                    <Text style={{...globalStyles.titleH2, paddingLeft: 10}}>
                                        {t('child_profile.health_details')}
                                    </Text>
                                    <View
                                        style={{
                                            ...styles.inputLabelContainer,
                                            flexDirection: 'column',
                                        }}>
                                        <Text style={styles.inputlabel}>
                                            {t('child_profile.allergies')}
                                        </Text>
                                        <TextInput
                                            style={styles.inputText}
                                            placeholder={t('child_profile.allergies')}
                                            onChangeText={formikProps.handleChange('allergy')}
                                            value={formikProps.values.allergy}
                                            onBlur={formikProps.handleBlur('allergy')}
                                            editable={editable}
                                        />
                                    </View>

                                    <View
                                        style={{
                                            ...styles.inputLabelContainer,
                                            flexDirection: 'column',
                                        }}>
                                        <Text style={styles.inputlabel}>
                                            {t('child_profile.food_restriction')}
                                        </Text>
                                        <TextInput
                                            style={styles.inputText}
                                            placeholder={t('child_profile.food_restriction')}
                                            onChangeText={formikProps.handleChange('foodRestriction')}
                                            value={formikProps.values.foodRestriction}
                                            onBlur={formikProps.handleBlur('foodRestriction')}
                                            editable={editable}
                                        />
                                    </View>

                                    <View
                                        style={{
                                            ...styles.inputLabelContainer,
                                            flexDirection: 'column',
                                        }}>
                                        <Text style={styles.inputlabel}>
                                            {t('child_profile.health_issues')}
                                        </Text>
                                        <TextInput
                                            style={styles.inputText}
                                            placeholder={t('child_profile.health_issues')}
                                            onChangeText={formikProps.handleChange('healthDetail')}
                                            value={formikProps.values.healthDetail}
                                            onBlur={formikProps.handleBlur('healthDetail')}
                                            editable={editable}
                                        />
                                    </View>
                                </View>

                                {/* EMERGENCY CONTACT */}
                                <View style={styles.motherInformation}>
                                    <Text style={{...globalStyles.titleH2, paddingLeft: 10}}>
                                        {t('child_profile.emergency_contact')}
                                    </Text>
                                    <View style={styles.inputLabelContainer}>
                                        <View style={styles.leftInputLabelContainer}>
                                            <Text style={styles.inputlabel}>
                                                {t('child_profile.first_last_name')}
                                            </Text>
                                            <TextInput
                                                style={styles.inputText}
                                                placeholder={t('child_profile.first_last_name')}
                                                onChangeText={formikProps.handleChange('emergencyNom1')}
                                                value={formikProps.values.emergencyNom1}
                                                onBlur={formikProps.handleBlur('emergencyNom1')}
                                                editable={editable}
                                            />
                                        </View>
                                        <View style={styles.rightInputLabelContainer}>
                                            <Text style={styles.inputlabel}>
                                                {t('child_profile.phone_number')}
                                            </Text>
                                            <TextInput
                                                style={styles.inputText}
                                                placeholder={t('child_profile.phone_number')}
                                                onChangeText={formikProps.handleChange(
                                                    'emergencyPhone1',
                                                )}
                                                value={formikProps.values.emergencyPhone1}
                                                onBlur={formikProps.handleBlur('emergencyPhone1')}
                                                editable={editable}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputLabelContainer}>
                                        <View style={styles.leftInputLabelContainer}>
                                            <Text style={styles.inputlabel}>
                                                {t('child_profile.first_last_name')}
                                            </Text>
                                            <TextInput
                                                style={styles.inputText}
                                                placeholder={t('child_profile.first_last_name')}
                                                onChangeText={formikProps.handleChange('emergencyNom2')}
                                                value={formikProps.values.emergencyNom2}
                                                onBlur={formikProps.handleBlur('emergencyNom2')}
                                                editable={editable}
                                            />
                                        </View>
                                        <View style={styles.rightInputLabelContainer}>
                                            <Text style={styles.inputlabel}>
                                                {t('child_profile.phone_number')}
                                            </Text>
                                            <TextInput
                                                style={styles.inputText}
                                                placeholder={t('child_profile.phone_number')}
                                                onChangeText={formikProps.handleChange(
                                                    'emergencyPhone2',
                                                )}
                                                value={formikProps.values.emergencyPhone2}
                                                onBlur={formikProps.handleBlur('emergencyPhone2')}
                                                editable={editable}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* IMAGE RIGHTS */}
                                <View style={{...styles.motherInformation}}>
                                    <Text style={{...globalStyles.titleH2, paddingLeft: 10}}>
                                        {t('child_profile.image_right')}
                                    </Text>
                                    <View
                                        style={{
                                            ...styles.inputLabelContainer,
                                            flexDirection: 'column',
                                        }}>
                                        <DropDownPicker
                                            open={openImageRight}
                                            value={imageRightValue}
                                            items={imageRightData}
                                            setOpen={setOpenImageRight}
                                            setValue={setImageRightValue}
                                            setItems={setImageRightData}
                                            listMode="MODAL"
                                            placeholder={t('child_profile.image_right')}
                                            modalTitle={t('child_profile.image_right')}
                                            multiple={true}
                                            //disabled={true}
                                            modalTitleStyle={{
                                                fontWeight: 'normal',
                                                color: COLORS.secondary, ...styles.osType
                                            }}
                                            closeIconStyle={{
                                                width: 24,
                                                height: 24,
                                            }}
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
                                        <View style={{marginTop: 5, marginHorizontal: 5}}>
                                            <Text>
                                                {imageRightName.length > 0 &&
                                                    imageRightName.map(
                                                        (imageRight: any, index: number) => {
                                                            let country = imageRight.nom;
                                                            if (index + 1 === imageRightName.length) {
                                                                return `${country}`;
                                                            } else {
                                                                return `${country}, `;
                                                            }
                                                        },
                                                    )}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {editable && (
                                    <View style={styles.validateBtnContainer}>
                                        <FlatButton
                                            title={t('allAppointment.save_form')}
                                            fontWeight="500"
                                            fontSize={16}
                                            backgroundColor={COLORS.secondary}
                                            paddingVertical={12}
                                            borderRadius={20}
                                            onPress={formikProps.handleSubmit}
                                            disabled={buttonStatus}
                                        />
                                    </View>
                                )}
                            </>
                        )}
                    </Formik>
                </View>
            </ImageBackground>
        </ScrollView>
    );
}

export default withSnackbar(Profile);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingBottom: 20,
    },
    backgroundImage: {
        flex: 1,
    },
    profileContainer: {
        flex: 1,
        paddingTop: 30,
        paddingBottom: 40,
    },
    avatarContainer: {
        flex: 1,
        alignContent: 'center',
        alignItems: 'center',
        paddingTop: 0,
    },
    containerAvatar: {
        width: 92,
        height: 92,
        alignItems: 'center',
        alignContent: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.grayLight,
        backgroundColor: COLORS.grayVeryLight,
        borderRadius: 50,
    },
    avatar: {
        width: 90,
        height: 90,
        overflow: 'hidden',
        borderRadius: 90,
        borderWidth: 1,
        borderColor: COLORS.grayLight,
    },
    childIdentity: {
        marginTop: 15,
        //paddingLeft: 10,
        //paddingRight: 10,
    },
    inputLabelContainer: {
        flex: 1,
        flexDirection: 'row',
        padding: 10,
        backgroundColor: COLORS.grayExtraLight,
    },
    leftInputLabelContainer: {
        flex: 1,
        paddingRight: 5,
    },
    rightInputLabelContainer: {
        flex: 1,
        paddingLeft: 5,
    },
    inputlabel: {
        color: COLORS.black,
        marginBottom: 5,
        fontWeight: '600',
    },
    inputText: {
        borderWidth: 1,
        borderColor: COLORS.grayMedium,
        padding: 9,
        paddingLeft: 10,
        paddingRight: 10,
        fontSize: 16,
        borderRadius: 4,
        zIndex: 0,
        color: COLORS.gray,
        backgroundColor: COLORS.white,
    },
    selectInput: {
        zIndex: 0,
        backgroundColor: COLORS.white,
    },

    dropdown: {
        //height: 45,
        borderColor: COLORS.grayMedium,
        borderWidth: 0.5,
        borderRadius: 4,
        padding: 4,
        paddingHorizontal: 8,
        backgroundColor: COLORS.white,
    },
    motherInformation: {
        marginTop: 40,
    },
    validateBtnContainer: {
        marginTop: 40,
        paddingLeft: 10,
        paddingRight: 10,
    },
    osType: {
        marginTop: Platform.OS === "ios" ? 70 : 70
    }
});
