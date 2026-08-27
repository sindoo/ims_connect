import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from "react-i18next";
import {useSelector} from "react-redux";
import {globalStyles} from "../../../../../style/Global";
import {COLORS} from "../../../../../constants";
import BookItem from "../../../../../components/tabs/more/exchangelibray/BookItem";
import BookDetails from "../../../../../components/tabs/more/exchangelibray/BookDetails";


function Borrowing(props) {
    const {t} = useTranslation();
    const {childBorrowedBooksList} = useSelector((state: any) => state.book);
    const [donor, setDonor] = useState<any>('');
    const [dataBook, setDataBook] = useState<any>(null);
    const [bookDetail, setBookDetail] = useState(false);

    return (
        <View style={globalStyles.container}>
            <ScrollView style={styles.listContainer}>
                {(childBorrowedBooksList.length === 0 || false) && (
                    <View>
                        <Text style={{flex: 1, textAlign: 'center', color: COLORS.gray} as StyleSheet}>
                            {t('more.empty_borrow_library')}
                        </Text>
                    </View>
                )}

                {childBorrowedBooksList.length > 0 &&
                    childBorrowedBooksList.map((book: any) => {
                        return (
                            <BookItem
                                key={book.id}
                                data={book}
                                bookStatus={false}
                                borrowChildStatus={true}
                                comeBackDate={true}
                                handleBorrowBook={() => {}}
                                donor={donor}
                                setDonor={setDonor}
                                bookDetail={bookDetail}
                                setBookDetail={setBookDetail}
                                setDataBook={setDataBook}
                            />
                        );
                    })}
            </ScrollView>

            {dataBook !== null && (
                <BookDetails
                    data={dataBook}
                    bookDetail={bookDetail}
                    setBookDetail={setBookDetail}
                    donor={donor}
                />
            )}
        </View>
    );
}

export default Borrowing;

const styles = StyleSheet.create({
    listContainer: {
        flex: 1,
        padding: 10,
        paddingTop: 20,
    },
});
