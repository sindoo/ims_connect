import React, {useCallback, useEffect, useState} from 'react';
import {
    FlatList,
    Keyboard,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import ExchangeLibraryService from "../../../../../services/ExchangeLibraryService";
import {setChildBorrowedBooksList} from "../../../../../redux/features/book/bookSlice";
import {checkTokenExpired} from "../../../../../services/GeneralService";
import Loading from "../../../../../components/ui/Loading";
import {globalStyles} from "../../../../../style/Global";
import {withSnackbar} from "../../../../../components/ui/SnackbarHOC";
import {COLORS} from "../../../../../constants";
import SearchBox from "../../../../../components/ui/SearchBox";
import BookItem from "../../../../../components/tabs/more/exchangelibray/BookItem";
import BookDetails from "../../../../../components/tabs/more/exchangelibray/BookDetails";


const ITEM_PER_PAGE:number = 50;

function AllBook(props) {
    const {snackbarShowMessage} = props;
    //const inputProps = {enterKeyHint: 'search'};
    const {t} = useTranslation();
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [renderLoading, setRenderLoading] = useState(false);
    const [booksDataList, setBooksDataList] = useState<any>([]);
    const [bookListPages, setBookListPages] = useState(0);
    const [donor, setDonor] = useState<any>('');
    const [dataBook, setDataBook] = useState<any>(null);
    const [bookDetail, setBookDetail] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalBook, setTotalBook] = useState(0);
    const {childBorrowedBooksList} = useSelector((state:any) => state.book);
    const {selectedChild} = useSelector((state: any) => state.child);
    const {user, userToken} = useSelector((state: any) => state.user);

    const dispatch = useDispatch();

    const handleTextChange = async (text:string) => {
        try {
            setBooksDataList([]);
            setSearch(text);
            setTotalBook(0);

            const toEncode:any = {
                filters:[
                    {
                        key: "nom",
                        operator: "CONTAIN",
                        field_type: "STRING",
                        value: `${search}`
                    }
                ]
            };

            const base64 = btoa(JSON.stringify(toEncode));
            setSearchLoading(true);

            const timeoutId = setTimeout(async () => {
                let listBookSearch = await ExchangeLibraryService.getSearchBookData(base64, text);
                listBookSearch = ExchangeLibraryService.orderBookListAsc(listBookSearch);
                setBooksDataList(listBookSearch);
                setSearchLoading(false);
            }, 1000);

            return () => {
                clearTimeout(timeoutId);
            }
        }
        catch (error) {
            console.log(error)
        }
    }

    const handleSearchBook = async () => {
        setBooksDataList([]);
        if (search !== '') {
            const toEncode:any = {
                filters:[
                    {
                        key: "nom",
                        operator: "CONTAIN",
                        field_type: "STRING",
                        value: `${search.trim()}`
                    }
                ]
            };
            const base64 = btoa(JSON.stringify(toEncode));
            setSearchLoading(true);
            let listBookSearch = await ExchangeLibraryService.getSearchBookData(base64, search.trim());
            listBookSearch = ExchangeLibraryService.orderBookListAsc(listBookSearch);
            setBooksDataList(listBookSearch);

            setSearchLoading(false);
        }
    };

    const handleClearSearch = async () => {
        setSearch('');
        setBooksDataList([]);
        setSearchLoading(true);
        setTotalBook(0);
        setCurrentPage(0);
        await loadBook(0);
        setSearchLoading(false);
    };

    const handleBorrowBook = async (data: any, setBorrowLoadingItem: any) => {
        try {
            if(selectedChild !== null && user !== null) {
                const bookBorrowed = await ExchangeLibraryService.borrowABook(selectedChild, user, data);

                const bookListUpdated = booksDataList.map((book:any) => {
                    if(book.id === bookBorrowed.id)
                        return bookBorrowed.livre;
                    else
                        return book;
                });
                setBooksDataList(bookListUpdated);
                setBorrowLoadingItem(false);

                const empruntEnfantList = await ExchangeLibraryService.getChildBorrowBooksList(selectedChild.person.id);
                dispatch(setChildBorrowedBooksList(empruntEnfantList));
                snackbarShowMessage(t('snackBar.sb_success_save_book'));
            }
        }
        catch (error: any) {
            setBorrowLoadingItem(false);
            if (error.response) {
                const msgToDisplay = error.response.data;
                if(msgToDisplay?.codeMessage === 'SIZE_EXCEPTION') {
                    snackbarShowMessage(t('more.book_not_available'));
                }
                console.log(msgToDisplay);
            }
            else {
                snackbarShowMessage(t('snackBar.sb_error_deadline_exceeded'));
                console.log(error.config);
            }

        }
    };

    const loadBook = async (page:number) => {
        try {
            const bookReq = await ExchangeLibraryService.getBookDataByPageNumber(page, ITEM_PER_PAGE);
            if(bookReq.length > 0){
                const bookList = bookReq[0];
                const totalBookItems:number = bookReq[1];
                const totalBookListPage:number = bookReq[2];
                if(totalBook === 0) {
                    setTotalBook(totalBookItems);
                    setBookListPages(totalBookListPage);
                }
                let listBook = [];
                if(page === 0){
                    listBook = [...bookList];
                    //console.log(JSON.stringify(listBook))
                }
                else
                    listBook = [...booksDataList, ...bookList];
                listBook = ExchangeLibraryService.orderBookListAsc(listBook);
                setBooksDataList(listBook);
            }
            return {status: 200}
        }
        catch (error){
            console.log(error);
            return {status: 400}
        }
    }

    const loadMoreBook = async () => {
        if(search === ''){
            setRenderLoading(true);
            if(currentPage < bookListPages){
                const page = currentPage + 1;
                setCurrentPage(page);
                const response = await loadBook(page);
                if(response.status === 200)
                    setRenderLoading(false);
            }
            else {
                setRenderLoading(false);
            }

            if(booksDataList.length === totalBook) {
                setRenderLoading(false);
            }
        }
    }

    const checkBorrowBook = useCallback((selectedChildId: number, book: any, borrowList: any) => {
        let status = false;
        let statusBookChild = false;

        for (let i = 0; i < borrowList.length; i++) {
            if (borrowList[i].livreId === book.id) {
                if (borrowList[i].enfantId === selectedChildId) {
                    statusBookChild = true;
                }
            }
        }
        if (!book.available) {
            status = true;
            statusBookChild = true;
        }
        return [status, statusBookChild];
    }, []);

    const isRealValue = (obj: any) => {
        return obj && obj !== 'null' && obj !== 'undefined';
    }
    const renderBookItem = (item: any) => {
        const status: any = checkBorrowBook(selectedChild.person.id, item, childBorrowedBooksList);
        return (
            <BookItem
                key={`book-item-${item.id}`}
                data={item}
                bookStatus={status[0]}
                borrowChildStatus={status[1]}
                comeBackDate={false}
                handleBorrowBook={handleBorrowBook}
                donor={donor}
                setDonor={setDonor}
                bookDetail={bookDetail}
                setBookDetail={setBookDetail}
                setDataBook={setDataBook}
            />
        );
    }

    useEffect(()=> {
        const fetchData = async () => {
            try {
                if(selectedChild !== null) {
                    setLoading(true);
                    const response = await loadBook(0);
                    const empruntEnfantList = await ExchangeLibraryService.getChildBorrowBooksList(selectedChild.person.id)
                    dispatch(setChildBorrowedBooksList(empruntEnfantList));
                    setLoading(false);
                }
                setLoading(false);

                checkTokenExpired(userToken, dispatch);
            }
            catch (error) {
                console.log(JSON.stringify(error));

                setLoading(false);
                checkTokenExpired(userToken, dispatch);
            }
        };

        fetchData().catch(error => {
            console.log(error);
        });
    }, [selectedChild]);


    const RenderLoader = () => {
        return (
            <View style={{padding: 10, marginTop:20}}>
                <Loading size="small" />
            </View>
        )
    }
    const renderLoader = () => {
        if(renderLoading){
            return (
                <View style={{padding: 10, marginTop:20}}>
                    <Loading size="small" />
                </View>
            )
        }
        return <></>;
    }

    const searchLoadingElement = () => {
        if(searchLoading){
            return (
                <View style={{padding: 16, flex:1}}>
                    <Loading size="large" />
                </View>
            )
        }
    }

    if (loading) {
        return <Loading />;
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{...globalStyles.container, paddingTop: 15}}>
                <SearchBox
                    paddingHorizontal={10}
                    searchValue={search}
                    setSearchValue={setSearch}
                    handleClearSearch={handleClearSearch}
                    handleSubmitSearch={handleSearchBook}
                    //handleTextChange={handleTextChange}
                />

                <View style={{flex:1, padding: 10}}>
                    {searchLoadingElement()}
                    {(booksDataList.length === 0 || false) && (
                        <View style={{flex: 1}}>
                            <Text style={{flex: 1, textAlign: 'center'}}>
                                {t('more.empty_library')}
                            </Text>
                        </View>
                    )}
                    <FlatList
                        style={styles.listContainer}
                        data={booksDataList}
                        keyExtractor={(item, index) => `${index}`}
                        onEndReached={!renderLoading ? loadMoreBook : null}
                        //onEndReached={loadMoreBook}
                        onEndReachedThreshold={0.5}
                        //ListFooterComponent={renderLoader}
                        renderItem={({ item }) => renderBookItem(item)}
                    />
                    {renderLoading && <RenderLoader />}
                </View>

                {dataBook !== null && (
                    <BookDetails
                        data={dataBook}
                        bookDetail={bookDetail}
                        setBookDetail={setBookDetail}
                        donor={donor}
                    />
                )}
            </View>
        </TouchableWithoutFeedback>
    );
}

export default withSnackbar(AllBook);

const styles = StyleSheet.create({
    searchContainer: {
        padding: 10,
    },
    searchBar: {
        flexDirection: 'row',
        marginTop: 10,
        padding: 6,
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor: COLORS.grayVeryLight,
        borderRadius: 6,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        padding: 3,
        fontSize: 16,
        borderRadius: 0,
        color: COLORS.gray,
        marginLeft: 4,
    },
    listContainer: {
        padding: 10,
        paddingTop: 15,
    },
});
