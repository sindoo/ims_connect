import React, {memo, useState, useCallback, useMemo} from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {useTranslation} from "react-i18next";
import {BASEURL_IMG} from "../../../../api/appUrl";
import {COLORS, IMAGES} from "../../../../constants";
import {globalStyles} from "../../../../style/Global";
import Card from "../../../ui/Card";
import {Image} from "expo-image";
import ZoomImageBox from "../../../ui/ZoomImage";
import {MaterialIcons} from "@expo/vector-icons";

interface BookItemProps {
    data: any;
    bookStatus: boolean;
    borrowChildStatus: boolean;
    comeBackDate: boolean;
    borrowStatusType: boolean;
    handleBorrowBook: (data: any, setLoading: any) => () => void;
    donor: any;
    setDonor: (donor: any) => void;
    bookDetail: boolean;
    setBookDetail: (value: boolean) => void;
    setDataBook: (data: any) => void;
    setBookCategory: (category: string) => void;
    bookCategoryName?: string;
    showDeadline?: boolean;
}

const BookItem = memo(function BookItem({
                                            data,
                                            bookStatus,
                                            borrowChildStatus,
                                            comeBackDate,
                                            borrowStatusType,
                                            handleBorrowBook,
                                            setBookDetail,
                                            setDataBook,
                                            setBookCategory,
                                            bookCategoryName = '',
                                            showDeadline = false,
                                        }: BookItemProps) {
    const {t} = useTranslation();
    const [borrowLoadingItem, setBorrowLoadingItem] = useState(false);
    const [imageModal, setImageModal] = useState(false);

    const handleBookDetails = useCallback(() => {
        setBookDetail(true);
        setDataBook(data);
        if (setBookCategory && bookCategoryName) {
            setBookCategory(bookCategoryName);
        }
    }, [data, setBookDetail, setDataBook, setBookCategory, bookCategoryName]);

    const handleBorrow = useCallback(async () => {
        try {
            setBorrowLoadingItem(true);
            await handleBorrowBook(data, setBorrowLoadingItem);
        } catch (error) {
            console.log('Borrow error:', error);
            setBorrowLoadingItem(false);
        }
    }, [data, handleBorrowBook]);

    const imageUri = useMemo(() => {
        if (data?.photo && data.photo !== '') {
            return { uri: `${BASEURL_IMG}/${data.photo}` };
        }
        return IMAGES.noBookImage;
    }, [data?.photo]);

    const zoomImageUri = useMemo(() => `${BASEURL_IMG}/${data?.photo}`, [data?.photo]);

    const formattedReturnDate = useMemo(() => {
        if (comeBackDate && data?.dateRetour) {
            try {
                const returnDate = new Date(data.dateRetour);
                return returnDate.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            } catch {
                return '';
            }
        }
        return '';
    }, [comeBackDate, data?.dateRetour]);

    // Date limite de retour (uniquement onglet « Emprunté(s) »)
    const deadlineValue = data?.deadlineRetour ?? data?.deadline_retour;
    const formattedDeadline = useMemo(() => {
        if (!showDeadline || !deadlineValue) return '';
        const date = new Date(deadlineValue);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }, [showDeadline, deadlineValue]);

    const showBorrowStatus = useMemo(() =>
            bookStatus && borrowChildStatus,
        [bookStatus, borrowChildStatus]
    );

    const showBorrowButton = useMemo(() =>
            !borrowChildStatus,
        [borrowChildStatus]
    );

    const showPendingStatus = useMemo(() =>
            comeBackDate && data?.dateEmprunt === null,
        [comeBackDate, data?.dateEmprunt]
    );

    const renderBorrowStatus = useMemo(() => {
        if (!showBorrowStatus) return null;
        return (
            <Text style={styles.borrowStatusText}>
                {t('more.borrow_status')}
            </Text>
        );
    }, [showBorrowStatus, t]);

    const renderReturnDate = useMemo(() => {
        if (!formattedReturnDate) return null;
        return (
            <Text style={styles.returnDateText}>
                {t('more.return_date')} : {formattedReturnDate}
            </Text>
        );
    }, [formattedReturnDate, t]);

    const renderPendingStatus = useMemo(() => {
        if (!showPendingStatus) return null;
        return (
            <View style={styles.rowWrap}>
                <Text style={styles.pendingStatus}>
                    En attente de confirmation
                </Text>
            </View>
        );
    }, [showPendingStatus]);

    const renderBorrowButton = useMemo(() => {
        if (!showBorrowButton) return null;
        return (
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: COLORS.grayLightMenu }]}
                    onPress={borrowLoadingItem ? undefined : handleBorrow}
                    disabled={borrowLoadingItem}
                    activeOpacity={0.7}
                >
                    {borrowLoadingItem ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                        <Text style={styles.buttonTextRight}>
                            {t('more.borrow')}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        );
    }, [showBorrowButton, borrowLoadingItem, handleBorrow, t]);

    return (
        <Card borderRaduis={8} marginBottom={20}>
            <View style={styles.appointmentItem}>
                <View style={styles.appointmentImage}>
                    <TouchableOpacity
                        onPress={() => setImageModal(true)}
                        activeOpacity={0.7}
                        style={styles.imageContainer}
                    >
                        <View style={styles.rowWrap}>
                            <MaterialIcons name="zoom-in" size={18} color={COLORS.grayLight} />
                            <Text style={styles.zoomText}>{t('more.zoom_here')}</Text>
                        </View>
                        <Image
                            source={imageUri}
                            contentFit="cover"
                            style={styles.appointImageCover}
                            transition={200}
                        />
                        <ZoomImageBox
                            imageModal={imageModal}
                            setImageModal={setImageModal}
                            pictureUri={zoomImageUri}
                        />
                    </TouchableOpacity>
                    {renderBorrowStatus}
                </View>

                <View style={styles.appointmentDetails}>
                    <Pressable onPress={handleBookDetails} style={styles.detailsContainer}>
                        <Text style={styles.titleDetail} numberOfLines={2}>
                            {data?.nom}
                        </Text>
                        <Text
                            numberOfLines={2}
                            style={[globalStyles.paragraph, styles.descriptionText]}
                        >
                            {data?.description || t('more.no_description')}
                        </Text>

                        <Text style={styles.categoryText}>
                            {t('more.category_name')} : {bookCategoryName || t('more.unknown')}
                        </Text>

                        {formattedDeadline !== '' && (
                            <Text style={styles.deadlineText}>
                                {t('more.return_deadline')} : {formattedDeadline}
                            </Text>
                        )}

                        {renderPendingStatus}
                        {renderReturnDate}
                        {renderBorrowButton}
                    </Pressable>
                </View>
            </View>
        </Card>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.data?.id === nextProps.data?.id &&
        prevProps.data?.nom === nextProps.data?.nom &&
        prevProps.data?.photo === nextProps.data?.photo &&
        prevProps.data?.available === nextProps.data?.available &&
        prevProps.data?.dateRetour === nextProps.data?.dateRetour &&
        prevProps.data?.dateEmprunt === nextProps.data?.dateEmprunt &&
        (prevProps.data?.deadlineRetour ?? prevProps.data?.deadline_retour) ===
        (nextProps.data?.deadlineRetour ?? nextProps.data?.deadline_retour) &&
        prevProps.showDeadline === nextProps.showDeadline &&
        prevProps.bookStatus === nextProps.bookStatus &&
        prevProps.borrowChildStatus === nextProps.borrowChildStatus &&
        prevProps.comeBackDate === nextProps.comeBackDate &&
        prevProps.borrowStatusType === nextProps.borrowStatusType &&
        prevProps.bookCategoryName === nextProps.bookCategoryName
    );
});

export default BookItem;

const styles = StyleSheet.create({
    appointmentItem: {
        flex: 1,
        flexDirection: 'row',
        padding: 10,
        paddingLeft: 0,
    },
    appointmentImage: {
        flex: 2,
        alignItems: 'center',
    },
    imageContainer: {
        alignItems: 'center',
    },
    rowWrap: {
        flexDirection: 'row',
    },
    zoomText: {
        fontSize: 11,
        color: COLORS.grayLight,
        textAlign: 'center',
        marginBottom: 2,
        fontWeight: 500
    },
    appointImageCover: {
        width: 65,
        height: 65,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.grayVeryLight,
        backgroundColor: COLORS.grayMedium,
        borderRadius: 4,
    },
    appointmentDetails: {
        flex: 5,
        paddingLeft: 10,
    },
    detailsContainer: {
        flex: 1,
    },
    titleDetail: {
        fontWeight: '700',
        fontSize: 14,
        color: COLORS.secondary,
        marginBottom: 4,
    },
    descriptionText: {
        textAlign: 'justify',
        marginBottom: 4,
    },
    categoryText: {
        fontWeight: 'bold',
        fontSize: 12,
        color: COLORS.gray,
        marginBottom: 4,
    },
    deadlineText: {
        fontWeight: '600',
        fontSize: 12,
        color: COLORS.primary,
        marginBottom: 4,
    },
    returnDateText: {
        fontWeight: 'bold',
        fontSize: 12,
        color: COLORS.primary,
        marginBottom: 4,
    },
    borrowStatusText: {
        marginTop: 8,
        fontSize: 10,
        backgroundColor: 'orange',
        padding: 1,
        paddingTop: 2,
        paddingHorizontal: 1,
        borderRadius: 3,
        marginLeft: 3,
        marginRight: 1,
        color: COLORS.white,
        textAlign: 'center',
        lineHeight: 12,
    },
    buttonContainer: {
        flex: 1,
        marginTop: 5,
        alignItems: 'flex-end',
    },
    button: {
        minWidth: 90,
        borderRadius: 5,
        padding: 6,
        marginRight: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonTextRight: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: 12,
    },
    pendingStatus: {
        color: COLORS.orangeTextSuccess,
        backgroundColor: COLORS.orangeExtraLight,
        marginVertical: 5,
        padding:3,
        paddingHorizontal:7,
        fontSize: 11,
        fontWeight: 400,
        borderRadius: 5,
    },
});
