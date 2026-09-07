import React, {useCallback, useEffect, useState, useMemo, useRef} from 'react';
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
import {setChildBorrowedBooksList, setChildHistoryBooksList} from "../../../../../redux/features/book/bookSlice";
import {checkTokenExpired} from "../../../../../services/GeneralService";
import Loading from "../../../../../components/ui/Loading";
import {globalStyles} from "../../../../../style/Global";
import {withSnackbar} from "../../../../../components/ui/SnackbarHOC";
import {COLORS} from "../../../../../constants";
import SearchBox from "../../../../../components/ui/SearchBox";
import BookItem from "../../../../../components/tabs/more/exchangelibray/BookItem";
import BookDetails from "../../../../../components/tabs/more/exchangelibray/BookDetails";

const ITEM_PER_PAGE = 50;
const SEARCH_DEBOUNCE_DELAY = 1000;
const MAX_VISIBLE_ITEMS = 15;

function AllBook(props) {
    const {snackbarShowMessage} = props;
    const {t} = useTranslation();
    const dispatch = useDispatch();

    // Redux selectors
    const {childBorrowedBooksList, childHistoryBooksList} = useSelector((state: any) => state.book);
    const {selectedChild} = useSelector((state: any) => state.child);
    const {user, userToken} = useSelector((state: any) => state.user);

    // State
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [renderLoading, setRenderLoading] = useState(false);
    const [booksDataList, setBooksDataList] = useState<any>([]);
    const [bookListPages, setBookListPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalBook, setTotalBook] = useState(0);
    const [donor, setDonor] = useState<any>('');
    const [bookCategory, setBookCategory] = useState<any>('');
    const [dataBook, setDataBook] = useState<any>(null);
    const [bookDetail, setBookDetail] = useState(false);

    // Refs
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const bookStatusCache = useRef<Map<string, [boolean, boolean]>>(new Map());

    // Check if book is already borrowed avec cache
    const checkBorrowBook = useCallback((selectedChildId: number, book: any, borrowList: any) => {
        const cacheKey = `${selectedChildId}-${book.id}-${borrowList.length}`;

        if (bookStatusCache.current.has(cacheKey)) {
            return bookStatusCache.current.get(cacheKey)!;
        }

        let isBookUnavailable = false;
        let isBorrowedByChild = false;

        for (let i = 0; i < borrowList.length; i++) {
            if (borrowList[i].livreId === book.id) {
                if (borrowList[i].enfantId === selectedChildId) {
                    isBorrowedByChild = true;
                }
            }
        }
        if (!book.available) {
            isBookUnavailable = true;
            isBorrowedByChild = true;
        }

        const result: [boolean, boolean] = [isBookUnavailable, isBorrowedByChild];
        bookStatusCache.current.set(cacheKey, result);
        return result;
    }, []);

    // Load books from API
    const loadBook = useCallback(async (page: number) => {
        try {
            const bookReq = await ExchangeLibraryService.getBookDataByPageNumber(page, ITEM_PER_PAGE);
            if (bookReq.length > 0) {
                const [bookList, totalBookItems, totalBookListPage] = bookReq;
                return {
                    bookList,
                    totalBookItems,
                    totalBookListPage,
                    status: 200
                };
            }
            return { status: 400, bookList: [] };
        } catch (error) {
            console.log('Error loading books:', error);
            return { status: 400, bookList: [] };
        }
    }, []);

    // Fonction pour charger et mettre à jour la liste
    const fetchBooks = useCallback(async (page: number, append: boolean = false) => {
        try {
            const result = await loadBook(page);
            if (result.status === 200 && result.bookList) {
                const orderedList = ExchangeLibraryService.orderBookListAsc(result.bookList);

                bookStatusCache.current.clear();

                if (page === 0 || !append) {
                    setBooksDataList(orderedList);
                } else {
                    setBooksDataList(prev => {
                        const merged = [...prev, ...orderedList];
                        return ExchangeLibraryService.orderBookListAsc(merged);
                    });
                }

                if (totalBook === 0 && result.totalBookItems) {
                    setTotalBook(result.totalBookItems);
                    setBookListPages(result.totalBookListPage || 0);
                }
                return true;
            }
            return false;
        } catch (error) {
            console.log('Fetch books error:', error);
            return false;
        }
    }, [loadBook, totalBook]);

    // Load more books for pagination
    const loadMoreBook = useCallback(async () => {
        if (search !== '' || renderLoading) return;

        if (currentPage < bookListPages - 1 && booksDataList.length < totalBook) {
            setRenderLoading(true);
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            const success = await fetchBooks(nextPage, true);
            setRenderLoading(false);
        }
    }, [search, renderLoading, currentPage, bookListPages, booksDataList.length, totalBook, fetchBooks]);

    // Handle search with debounce
    const handleTextChange = useCallback(async (text: string) => {
        try {
            setSearch(text);

            if (text.trim() === '') {
                setSearchLoading(true);
                setCurrentPage(0);
                setTotalBook(0);
                bookStatusCache.current.clear();
                await fetchBooks(0, false);
                setSearchLoading(false);
                return;
            }

            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }

            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    setSearchLoading(true);
                    const toEncode = {
                        filters: [{
                            key: "nom",
                            operator: "CONTAIN",
                            field_type: "STRING",
                            value: text
                        }]
                    };
                    const base64 = btoa(JSON.stringify(toEncode));

                    let listBookSearch = await ExchangeLibraryService.getSearchBookData(base64, text);
                    listBookSearch = ExchangeLibraryService.orderBookListAsc(listBookSearch);
                    bookStatusCache.current.clear();
                    setBooksDataList(listBookSearch);
                    setTotalBook(listBookSearch.length);
                } catch (error) {
                    console.log('Search error:', error);
                } finally {
                    setSearchLoading(false);
                }
            }, SEARCH_DEBOUNCE_DELAY);
        } catch (error) {
            console.log('Handle text change error:', error);
            setSearchLoading(false);
        }
    }, [fetchBooks]);

    // Handle search submit
    const handleSearchBook = useCallback(async () => {
        if (search.trim() === '') {
            await handleClearSearch();
            return;
        }

        try {
            setBooksDataList([]);
            setSearchLoading(true);

            const toEncode = {
                filters: [{
                    key: "nom",
                    operator: "CONTAIN",
                    field_type: "STRING",
                    value: search.trim()
                }]
            };
            const base64 = btoa(JSON.stringify(toEncode));

            let listBookSearch = await ExchangeLibraryService.getSearchBookData(base64, search.trim());
            listBookSearch = ExchangeLibraryService.orderBookListAsc(listBookSearch);
            bookStatusCache.current.clear();
            setBooksDataList(listBookSearch);
            setTotalBook(listBookSearch.length);
        } catch (error) {
            console.log('Search submit error:', error);
        } finally {
            setSearchLoading(false);
        }
    }, [search]);

    // Clear search
    const handleClearSearch = useCallback(async () => {
        try {
            setSearch('');
            setBooksDataList([]);
            setTotalBook(0);
            setCurrentPage(0);
            setSearchLoading(true);
            bookStatusCache.current.clear();
            await fetchBooks(0, false);
            setSearchLoading(false);
        } catch (error) {
            console.log('Clear search error:', error);
            setSearchLoading(false);
        }
    }, [fetchBooks]);

    // Borrow a book
    const handleBorrowBook = useCallback(async (data: any, setBorrowLoadingItem: any) => {
        try {
            if (!selectedChild || !user) return;

            const bookBorrowed = await ExchangeLibraryService.borrowABook(selectedChild, user, data);

            setBooksDataList(prev => {
                const updated = prev.map((book: any) => {
                    if (book.id === bookBorrowed.id) {
                        return bookBorrowed.livre;
                    }
                    return book;
                });
                bookStatusCache.current.clear();
                return updated;
            });

            setBorrowLoadingItem(false);

            const empruntEnfantList = await ExchangeLibraryService.getChildBorrowBooksList(selectedChild.person.id);
            dispatch(setChildBorrowedBooksList(empruntEnfantList));

            snackbarShowMessage(t('snackBar.sb_success_save_book'));
        } catch (error: any) {
            setBorrowLoadingItem(false);
            if (error.response) {
                const msgToDisplay = error.response.data;
                if (msgToDisplay?.codeMessage === 'SIZE_EXCEPTION') {
                    snackbarShowMessage(t('more.book_not_available'));
                }
                console.log(msgToDisplay);
            } else {
                snackbarShowMessage(t('snackBar.sb_error_deadline_exceeded'));
                console.log(error);
            }
        }
    }, [selectedChild, user, dispatch, t, snackbarShowMessage]);

    // Initial data fetch
    useEffect(() => {
        const initializeData = async () => {
            try {
                if (!selectedChild) {
                    setLoading(false);
                    return;
                }

                setLoading(true);

                const [empruntEnfantList, booksResult] = await Promise.all([
                    ExchangeLibraryService.getChildBorrowBooksList(selectedChild.person.id),
                    loadBook(0)
                ]);

                if (empruntEnfantList) {
                    dispatch(setChildBorrowedBooksList(empruntEnfantList));
                }

                const empruntEnfantHistoryList = await ExchangeLibraryService.getChildBorrowHistoryBooksList(selectedChild.person.id);
                dispatch(setChildHistoryBooksList(empruntEnfantHistoryList));

                if (booksResult.status === 200 && booksResult.bookList) {
                    const orderedList = ExchangeLibraryService.orderBookListAsc(booksResult.bookList);
                    setBooksDataList(orderedList);
                    if (booksResult.totalBookItems) {
                        setTotalBook(booksResult.totalBookItems);
                        setBookListPages(booksResult.totalBookListPage || 0);
                    }
                }

                checkTokenExpired(userToken, dispatch);
            } catch (error) {
                console.log('Initial fetch error:', error);
                checkTokenExpired(userToken, dispatch);
            } finally {
                setLoading(false);
            }
        };

        initializeData();
    }, [selectedChild, loadBook, dispatch, userToken]);

    // Cleanup timeout
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            bookStatusCache.current.clear();
        };
    }, []);

    // Render book item optimisé
    const renderBookItem = useCallback(({item}: {item: any}) => {
        const [bookStatus, borrowChildStatus] = checkBorrowBook(
            selectedChild?.person.id,
            item,
            childBorrowedBooksList
        );

        return (
            <BookItem
                key={`book-item-${item.id}`}
                data={item}
                bookStatus={bookStatus}
                borrowChildStatus={borrowChildStatus}
                comeBackDate={false}
                borrowStatusType={false}
                handleBorrowBook={handleBorrowBook}
                donor={donor}
                setDonor={setDonor}
                bookDetail={bookDetail}
                setBookDetail={setBookDetail}
                setDataBook={setDataBook}
                setBookCategory={setBookCategory}
            />
        );
    }, [selectedChild, childBorrowedBooksList, handleBorrowBook, donor, bookDetail, checkBorrowBook, setDonor, setDataBook, setBookCategory]);

    // Memoize key extractor
    const keyExtractor = useCallback((item: any, index: number) => {
        return `book-${item.id || index}`;
    }, []);

    // Memoize getItemLayout
    const getItemLayout = useCallback((data: any, index: number) => ({
        length: 120,
        offset: 120 * index,
        index,
    }), []);

    // Render loader
    const renderLoader = useCallback(() => {
        if (!renderLoading) return null;
        return (
            <View style={styles.loaderContainer}>
                <Loading size="small" />
            </View>
        );
    }, [renderLoading]);

    // Render search loading
    const renderSearchLoading = useCallback(() => {
        if (!searchLoading) return null;
        return (
            <View style={styles.searchLoaderContainer}>
                <Loading size="large" />
            </View>
        );
    }, [searchLoading]);

    // Memoized empty state
    const isEmpty = useMemo(() => booksDataList.length === 0 && !searchLoading, [booksDataList.length, searchLoading]);

    if (loading) {
        return <Loading />;
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[globalStyles.container, styles.container]}>
                <SearchBox
                    paddingHorizontal={10}
                    searchValue={search}
                    setSearchValue={setSearch}
                    handleClearSearch={handleClearSearch}
                    handleSubmitSearch={handleSearchBook}
                />

                <View style={styles.listWrapper}>
                    {renderSearchLoading()}

                    {isEmpty && !searchLoading && (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {t('more.empty_library')}
                            </Text>
                        </View>
                    )}

                    <FlatList
                        ref={flatListRef}
                        style={styles.listContainer}
                        data={booksDataList}
                        keyExtractor={keyExtractor}
                        renderItem={renderBookItem}
                        onEndReached={loadMoreBook}
                        onEndReachedThreshold={0.3}
                        ListFooterComponent={renderLoader}
                        initialNumToRender={10}
                        maxToRenderPerBatch={5}
                        windowSize={5}
                        updateCellsBatchingPeriod={50}
                        removeClippedSubviews={true}
                        getItemLayout={getItemLayout}
                        extraData={childBorrowedBooksList}
                        maintainVisibleContentPosition={{
                            minIndexForVisible: 0,
                        }}
                        scrollEventThrottle={16}
                        showsVerticalScrollIndicator={true}
                        disableVirtualization={false}
                        viewabilityConfig={{
                            itemVisiblePercentThreshold: 50,
                        }}
                    />
                </View>

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
        </TouchableWithoutFeedback>
    );
}

export default withSnackbar(AllBook);

const styles = StyleSheet.create({
    container: {
        paddingTop: 15,
    },
    listWrapper: {
        flex: 1,
        padding: 10,
    },
    listContainer: {
        paddingHorizontal: 10,
        paddingTop: 15,
    },
    loaderContainer: {
        padding: 10,
        marginTop: 20,
    },
    searchLoaderContainer: {
        padding: 16,
        flex: 1,
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
});
