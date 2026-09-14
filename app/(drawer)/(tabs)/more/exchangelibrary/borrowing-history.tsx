import React, {useCallback, useEffect, useState, useMemo} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from "react-i18next";
import {useSelector} from "react-redux";
import {globalStyles} from "../../../../../style/Global";
import {COLORS} from "../../../../../constants";
import BookItem from "../../../../../components/tabs/more/exchangelibray/BookItem";
import BookDetails from "../../../../../components/tabs/more/exchangelibray/BookDetails";

const BorrowingHistory = () => {
    const {t} = useTranslation();
    const {childHistoryBooksList} = useSelector((state: any) => state.book);

    const [donor, setDonor] = useState<any>('');
    const [dataBook, setDataBook] = useState<any>(null);
    const [bookDetail, setBookDetail] = useState(false);
    const [bookCategory, setBookCategory] = useState<any>('');

    // Memoized empty state
    //const isEmpty = useMemo(() => childHistoryBooksList.length === 0, [childHistoryBooksList.length]);

    // Render book item
    const renderBookItem = useCallback(({item}: {item: any}) => (
        <BookItem
            key={`borrowed-book-${item.id}`}
            data={item}
            bookStatus={false}
            borrowChildStatus={true}
            comeBackDate={true}
            handleBorrowBook={() => {}}
            donor={donor}
            borrowStatusType={false}
            setDonor={setDonor}
            bookDetail={bookDetail}
            setBookDetail={setBookDetail}
            setDataBook={setDataBook}
            setBookCategory={setBookCategory}/>
    ), [donor, bookDetail]);

    // Key extractor
    const keyExtractor = useCallback((item: any) => `borrowed-book-${item.id}`, []);

    // Log borrowed books (dev only)
    useEffect(() => {
        if (__DEV__) {
            //console.log('Borrowed books:', JSON.stringify(childBorrowedBooksList));
        }
    }, [childHistoryBooksList]);

    return (
        <View style={globalStyles.container}>
            <FlatList
                style={styles.listContainer}
                data={childHistoryBooksList}
                keyExtractor={keyExtractor}
                renderItem={renderBookItem}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {t('more.empty_borrow_library')}
                        </Text>
                    </View>
                }
                contentContainerStyle={childHistoryBooksList.length === 0 && styles.emptyContentContainer}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
            />

            {dataBook && (
                <BookDetails
                    data={dataBook}
                    bookDetail={bookDetail}
                    setBookDetail={setBookDetail}
                    donor={donor}
                    bookCategory={bookCategory}
                />
            )}
        </View>
    );
};

export default BorrowingHistory;

const styles = StyleSheet.create({
    listContainer: {
        flex: 1,
        padding: 10,
        paddingTop: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.gray,
    },
    emptyContentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
});
