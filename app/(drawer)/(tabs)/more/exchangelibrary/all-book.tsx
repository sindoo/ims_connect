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
import {apiErrorMessage} from "../../../../../api/ApiManager";
import {setChildBorrowedBooksList, setChildHistoryBooksList} from "../../../../../redux/features/book/bookSlice";
import {checkTokenExpired} from "../../../../../services/GeneralService";
import Loading from "../../../../../components/ui/Loading";
import {globalStyles} from "../../../../../style/Global";
import {withSnackbar} from "../../../../../components/ui/SnackbarHOC";
import {COLORS} from "../../../../../constants";
import SearchBox from "../../../../../components/ui/SearchBox";
import BookItem from "../../../../../components/tabs/more/exchangelibray/BookItem";
import BookDetails from "../../../../../components/tabs/more/exchangelibray/BookDetails";

const ITEM_PER_PAGE = 20;
const ACCENT_REGEX = /[\u0300-\u036f]/g;

// ✅ Types de requêtes pour le token
type RequestType = 'init' | 'search' | 'pagination' | 'clear';

function AllBook(props) {
    const {snackbarShowMessage} = props;
    const {t} = useTranslation();
    const dispatch = useDispatch();

    const {childBorrowedBooksList} = useSelector((state: any) => state.book);
    const {selectedChild} = useSelector((state: any) => state.child);
    const {user, userToken} = useSelector((state: any) => state.user);

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
    const [categoryCache, setCategoryCache] = useState<Map<number, string>>(new Map());

    // ✅ STATE qui contrôle physiquement onEndReached + affichage
    const [isSearchMode, setIsSearchMode] = useState(false);

    // ✅ STATE "displayMode" : garantit qu'on ne peut PAS afficher les livres "normaux"
    // tant qu'on est en mode recherche
    const [displayMode, setDisplayMode] = useState<'browse' | 'search'>('browse');

    const flatListRef = useRef<FlatList>(null);
    const bookStatusCache = useRef<Map<string, [boolean, boolean]>>(new Map());
    const isInitializedRef = useRef(false);
    const isLoadingMoreRef = useRef(false);

    // ═══════════════════════════════════════════════════════════════════
    // ✅ COEUR DE LA SOLUTION : Token unique pour CHAQUE requête
    // ═══════════════════════════════════════════════════════════════════
    // Chaque requête (init, search, pagination, clear) obtient un ID unique.
    // Après chaque "await", on vérifie que notre ID est toujours le "dernier".
    // Si non → on JETTE la réponse sans toucher au state.
    // ═══════════════════════════════════════════════════════════════════
    const requestTokenRef = useRef<{ id: number; type: RequestType }>({
        id: 0,
        type: 'init'
    });

    const startRequest = useCallback((type: RequestType): number => {
        const id = ++requestTokenRef.current.id;
        requestTokenRef.current = { id, type };
        return id;
    }, []);

    const isTokenValid = useCallback((id: number): boolean => {
        return requestTokenRef.current.id === id;
    }, []);

    // ✅ Verrou pour pagination (ref = synchrone)
    const paginationLockedRef = useRef(false);

    const normalizeString = useCallback((str: string) => {
        if (!str) return '';
        return str.normalize('NFD').replace(ACCENT_REGEX, '').toLowerCase();
    }, []);

    const compareFrench = useCallback((a: string, b: string) => {
        if (!a && !b) return 0;
        if (!a) return 1;
        if (!b) return -1;
        const na = normalizeString(a);
        const nb = normalizeString(b);
        if (na < nb) return -1;
        if (na > nb) return 1;
        return 0;
    }, [normalizeString]);

    const sortBooksByNom = useCallback((books: any[]) => {
        if (!books || books.length === 0) return books;
        return [...books].sort((a: any, b: any) => compareFrench(a?.nom || '', b?.nom || ''));
    }, [compareFrench]);

    const preloadCategories = useCallback(async (books: any[]) => {
        const categoryIds = [...new Set(books
            .map((b: any) => b?.livreCategorieId)
            .filter((id: any) => id && !categoryCache.has(id))
        )];
        if (categoryIds.length === 0) return;
        try {
            const promises = categoryIds.map((id: number) =>
                ExchangeLibraryService.getCategoryBookById(id)
            );
            const results = await Promise.all(promises);
            setCategoryCache(prev => {
                const newMap = new Map(prev);
                categoryIds.forEach((id: number, index: number) => {
                    if (results[index]?.nom) newMap.set(id, results[index].nom);
                });
                return newMap;
            });
        } catch (error) {
            console.log('Preload categories error:', error);
        }
    }, [categoryCache]);

    const checkBorrowBook = useCallback((selectedChildId: number, book: any, borrowList: any) => {
        const cacheKey = `${selectedChildId}-${book.id}`;
        if (bookStatusCache.current.has(cacheKey)) {
            return bookStatusCache.current.get(cacheKey)!;
        }
        let isBookUnavailable = false;
        let isBorrowedByChild = false;
        for (let i = 0; i < borrowList.length; i++) {
            if (borrowList[i].livreId === book.id) {
                if (borrowList[i].enfantId === selectedChildId) isBorrowedByChild = true;
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

    // ✅ CORRECTIF : bookStatusCache est une memoisation manuelle indexee
    // uniquement par "childId-bookId". Sa validite depend en realite de
    // "childBorrowedBooksList" (pour isBorrowedByChild) et de
    // "book.available" (pour isBookUnavailable) - mais rien ne la videait
    // automatiquement quand "childBorrowedBooksList" changeait (ex: apres le
    // dispatch redux qui suit un emprunt). Elle n'etait videe qu'a des
    // endroits precis (recherche, pagination...), pas systematiquement au
    // bon moment par rapport a ce dispatch : un rendu intermediaire pouvait
    // mettre en cache le statut "pas encore emprunte", puis ce statut perime
    // restait en cache meme apres que la liste d'emprunts soit a jour. On la
    // vide maintenant a chaque changement de "childBorrowedBooksList", ce
    // qui garantit que le statut affiche est toujours recalcule avec les
    // donnees a jour - c'est ce qui causait le badge/bouton qui ne se
    // rafraichissait pas tout seul apres avoir clique sur "Emprunter".
    useEffect(() => {
        bookStatusCache.current.clear();
    }, [childBorrowedBooksList]);

    const loadBook = useCallback(async (page: number) => {
        try {
            const bookReq = await ExchangeLibraryService.getBookDataByPageNumber(page, ITEM_PER_PAGE);
            if (bookReq.length > 0) {
                const [bookList, totalBookItems, totalBookListPage] = bookReq;
                return { bookList, totalBookItems, totalBookListPage, status: 200 };
            }
            return { status: 400, bookList: [] };
        } catch (error) {
            console.log('Error loading books:', error);
            return { status: 400, bookList: [] };
        }
    }, []);

    /**
     * ✅ loadMoreBook avec token
     * Chaque appel génère un NOUVEAU token → invalide automatiquement
     * toute requête en vol précédente.
     */
    const loadMoreBook = useCallback(() => {
        // 🔒 Vérifications synchrones AVANT de faire quoi que ce soit
        if (paginationLockedRef.current) return;
        if (isSearchMode) return;
        if (search.trim() !== '') return;
        if (displayMode === 'search') return;
        if (isLoadingMoreRef.current) return;
        if (renderLoading) return;
        if (currentPage >= bookListPages - 1) return;
        if (booksDataList.length >= totalBook) return;
        if (totalBook === 0) return;
        if (bookListPages === 0) return;

        // ✅ Générer un token pour CETTE pagination
        const paginationToken = startRequest('pagination');

        isLoadingMoreRef.current = true;
        setRenderLoading(true);

        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);

        setTimeout(async () => {
            // 🔒 Re-vérifier AVANT le réseau
            if (!isTokenValid(paginationToken)) {
                isLoadingMoreRef.current = false;
                setRenderLoading(false);
                return;
            }

            try {
                const result = await loadBook(nextPage);

                // 🔒 Vérifier APRÈS le réseau
                if (!isTokenValid(paginationToken)) {
                    isLoadingMoreRef.current = false;
                    setRenderLoading(false);
                    return;
                }

                if (result.status === 200 && result.bookList && result.bookList.length > 0) {
                    await preloadCategories(result.bookList);

                    // 🔒 Vérifier APRÈS preloadCategories
                    if (!isTokenValid(paginationToken)) {
                        isLoadingMoreRef.current = false;
                        setRenderLoading(false);
                        return;
                    }

                    const orderedList = sortBooksByNom(result.bookList);
                    bookStatusCache.current.clear();

                    setBooksDataList(prev => {
                        // 🔒 Dernière vérification AVANT setState
                        if (!isTokenValid(paginationToken)) {
                            return prev; // Ne rien changer
                        }
                        const merged = [...prev, ...orderedList];
                        return sortBooksByNom(merged);
                    });

                    if (totalBook === 0 && result.totalBookItems) {
                        setTotalBook(result.totalBookItems);
                        setBookListPages(result.totalBookListPage || 0);
                    }
                } else {
                    setCurrentPage(currentPage);
                }
            } catch (error) {
                console.log('Load more error:', error);
                if (isTokenValid(paginationToken)) {
                    setCurrentPage(currentPage);
                }
            } finally {
                isLoadingMoreRef.current = false;
                if (isTokenValid(paginationToken)) {
                    setRenderLoading(false);
                }
            }
        }, 50);
    }, [isSearchMode, displayMode, search, renderLoading, currentPage, bookListPages, booksDataList.length, totalBook, loadBook, preloadCategories, sortBooksByNom, startRequest, isTokenValid]);

    const handleSearchBook = useCallback(async () => {
        if (search.trim() === '') {
            await handleClearSearch();
            return;
        }

        // ✅ 1. Générer le token de recherche IMMÉDIATEMENT
        const searchToken = startRequest('search');

        // ✅ 2. Poser le verrou SYNCHRONEMENT
        paginationLockedRef.current = true;
        isLoadingMoreRef.current = false;

        // ✅ 3. Changer les modes (state) — déclenche re-render
        setIsSearchMode(true);
        setDisplayMode('search');
        setSearchLoading(true);
        setRenderLoading(false);

        try {
            const dataToSend = {
                page: 0,
                size: 20,
                offset: 0,
                filters: [{
                    key: "nom",
                    operator: "CONTAIN",
                    value: search.trim()
                }],
            };

            const listBookSearch = await ExchangeLibraryService.getSearchBookData(
                JSON.stringify(dataToSend),
                search.trim()
            );

            // 🔒 Vérifier le token
            if (!isTokenValid(searchToken)) {
                return;
            }

            let sortedList = sortBooksByNom(listBookSearch);

            if (sortedList.length > 0) {
                await preloadCategories(sortedList);
            }

            // 🔒 Re-vérifier après preload
            if (!isTokenValid(searchToken)) {
                return;
            }

            bookStatusCache.current.clear();
            setBooksDataList(sortedList);
            setTotalBook(sortedList.length);
            setCurrentPage(0);
            setBookListPages(0);

            flatListRef.current?.scrollToOffset({offset: 0, animated: false});
        }
        catch (error) {
            console.log('Search submit error:', JSON.stringify(error));
        }
        finally {
            // ✅ Ne clear le loading QUE si notre token est toujours valide
            if (isTokenValid(searchToken)) {
                setSearchLoading(false);
            }
        }
    }, [search, preloadCategories, sortBooksByNom, startRequest, isTokenValid]);

    const handleClearSearch = useCallback(async () => {
        // ✅ Token de clear
        const clearToken = startRequest('clear');

        setSearch('');
        setTotalBook(0);
        setCurrentPage(0);
        setSearchLoading(true);

        // ✅ Changer les modes
        setIsSearchMode(false);
        setDisplayMode('browse');

        // ✅ Lever les verrous
        paginationLockedRef.current = false;
        isLoadingMoreRef.current = false;
        setRenderLoading(false);
        bookStatusCache.current.clear();

        try {
            const result = await loadBook(0);

            // 🔒 Vérifier
            if (!isTokenValid(clearToken)) {
                return;
            }

            if (result.status === 200 && result.bookList) {
                if (result.bookList.length > 0) {
                    await preloadCategories(result.bookList);
                }
                if (!isTokenValid(clearToken)) return;

                const orderedList = sortBooksByNom(result.bookList);
                setBooksDataList(orderedList);
                if (result.totalBookItems) {
                    setTotalBook(result.totalBookItems);
                    setBookListPages(result.totalBookListPage || 0);
                }
            }
        } catch (error) {
            console.log('Clear search error:', error);
        } finally {
            if (isTokenValid(clearToken)) {
                setSearchLoading(false);
            }
        }
    }, [loadBook, preloadCategories, sortBooksByNom, startRequest, isTokenValid]);

    const handleBorrowBook = useCallback(async (data: any, setBorrowLoadingItem: any) => {
        try {
            if (!selectedChild || !user) return;
            const bookBorrowed = await ExchangeLibraryService.borrowABook(selectedChild, user, data);
            // ✅ BUG CORRIGE : "bookBorrowed" est l'enregistrement d'EMPRUNT
            // renvoye par l'API (il contient bookBorrowed.livre, le livre
            // lui-meme, en plus de son propre id d'emprunt). Le code
            // comparait "book.id === bookBorrowed.id" - c'est-a-dire l'id du
            // LIVRE dans la liste contre l'id de l'EMPRUNT : ça ne
            // correspondait quasiment jamais, donc aucun livre de la liste
            // n'etait jamais remplace par sa version a jour (available:
            // false). Comparaison corrigee sur l'id du livre imbrique.
            const borrowedBookId = bookBorrowed?.livre?.id ?? bookBorrowed?.id;
            setBooksDataList(prev => {
                const updated = prev.map((book: any) => {
                    if (book.id === borrowedBookId) return bookBorrowed.livre;
                    return book;
                });
                return sortBooksByNom(updated);
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
                } else {
                    // Autre refus du serveur (déjà emprunté, livre introuvable…) :
                    // on prévient l'utilisateur au lieu de ne rien afficher.
                    snackbarShowMessage(apiErrorMessage(error, t('snackBar.sb_error')));
                }
            } else {
                snackbarShowMessage(t('snackBar.sb_error_deadline_exceeded'));
            }
        }
    }, [selectedChild, user, dispatch, t, snackbarShowMessage, sortBooksByNom]);

    const renderBookItem = useCallback(({item}: {item: any}) => {
        if (!item || !item.id) return null;
        const [bookStatus, borrowChildStatus] = checkBorrowBook(
            selectedChild?.person.id, item, childBorrowedBooksList
        );
        const categoryName = categoryCache.get(item?.livreCategorieId) || '';
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
                bookCategoryName={categoryName}
            />
        );
    }, [selectedChild, childBorrowedBooksList, handleBorrowBook, donor, bookDetail, checkBorrowBook, categoryCache, setDonor, setDataBook, setBookCategory]);

    const keyExtractor = useCallback((item: any, index: number) => {
        return item?.id ? `book-${item.id}` : `book-${index}`;
    }, []);

    const renderLoader = useCallback(() => {
        if (!renderLoading || isSearchMode || displayMode === 'search') return null;
        return (
            <View style={styles.loaderContainer}>
                <Loading size="small" />
            </View>
        );
    }, [renderLoading, isSearchMode, displayMode]);

    const renderSearchLoading = useCallback(() => {
        if (!searchLoading) return null;
        return (
            <View style={styles.searchLoaderContainer}>
                <Loading size="large" />
            </View>
        );
    }, [searchLoading]);

    const viewabilityConfig = useMemo(() => ({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 500,
        waitForInteraction: true,
    }), []);

    const uniqueBooksDataList = useMemo(() => {
        const seen = new Set();
        const result = [];
        for (let i = 0; i < booksDataList.length; i++) {
            const book = booksDataList[i];
            if (book?.id && !seen.has(book.id)) {
                seen.add(book.id);
                result.push(book);
            }
        }
        return result;
    }, [booksDataList]);

    useEffect(() => {
        if (isInitializedRef.current) return;
        isInitializedRef.current = true;

        const initializeData = async () => {
            const initToken = startRequest('init');
            try {
                if (!selectedChild) {
                    setLoading(false);
                    return;
                }
                setIsSearchMode(false);
                setDisplayMode('browse');
                paginationLockedRef.current = false;

                // ✅ Les 3 appels sont independants les uns des autres
                // (emprunts en cours, page 0 des livres, historique des
                // emprunts) : ils sont maintenant lances en parallele au
                // lieu d'attendre les 2 premiers puis appeler le 3e en
                // sequence - un aller-retour reseau de moins au demarrage.
                const [empruntEnfantList, booksResult, empruntEnfantHistoryList] = await Promise.all([
                    ExchangeLibraryService.getChildBorrowBooksList(selectedChild.person.id),
                    loadBook(0),
                    ExchangeLibraryService.getChildBorrowHistoryBooksList(selectedChild.person.id)
                ]);

                if (!isTokenValid(initToken)) return;

                if (empruntEnfantList) {
                    dispatch(setChildBorrowedBooksList(empruntEnfantList));
                }

                let empruntEnfantHistoryListFiltered  = [];
                if(empruntEnfantHistoryList){
                    empruntEnfantHistoryListFiltered  = empruntEnfantHistoryList.filter(book => book?.dateRetour !== null);
                }
                dispatch(setChildHistoryBooksList(empruntEnfantHistoryListFiltered || []));

                if (booksResult.status === 200 && booksResult.bookList) {
                    if (booksResult.bookList.length > 0) {
                        await preloadCategories(booksResult.bookList);
                    }
                    if (!isTokenValid(initToken)) return;

                    const orderedList = sortBooksByNom(booksResult.bookList);
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

        initializeData().catch(error => { console.log('Initial fetch error 2:', error)});

        return () => {
            isInitializedRef.current = false;
        };
        // ✅ On ne dépend QUE de l'identifiant réel de l'enfant sélectionné.
        // ⚠️ Ne PAS remettre loadBook/preloadCategories/sortBooksByNom/startRequest/isTokenValid
        // ici : ce sont des useCallback dont l'identité change (ex: preloadCategories change
        // dès qu'une nouvelle catégorie est mise en cache), ce qui redéclenchait cet effet,
        // remettait isInitializedRef à false, relançait initializeData() en plein milieu
        // d'une recherche, et donc réinitialisait isSearchMode/displayMode + rechargeait
        // la page 0 par-dessus les résultats de recherche déjà affichés.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChild?.person?.id]);

    useEffect(() => {
        return () => {
            bookStatusCache.current.clear();
            isLoadingMoreRef.current = false;
            paginationLockedRef.current = true;
            // ✅ Invalider toute requête en cours au démontage
            requestTokenRef.current.id++;
        };
    }, []);

    if (loading) {
        return <Loading />;
    }

    // ═══════════════════════════════════════════════════════════════════
    // ✅ LA LIGNE LA PLUS IMPORTANTE : onEndReached n'est attaché QUE
    // dans le mode "browse" pur. Dès qu'on est en search → undefined.
    // ═══════════════════════════════════════════════════════════════════
    const isPaginationEnabled = !isSearchMode
        && displayMode === 'browse'
        && search.trim() === '';

    const onEndReachedHandler = isPaginationEnabled ? loadMoreBook : undefined;

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

                    {uniqueBooksDataList.length === 0 && !searchLoading && (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {t('more.empty_library')}
                            </Text>
                        </View>
                    )}

                    {uniqueBooksDataList.length > 0 && (
                        <FlatList
                            ref={flatListRef}
                            style={styles.listContainer}
                            data={uniqueBooksDataList}
                            keyExtractor={keyExtractor}
                            renderItem={renderBookItem}
                            onEndReached={onEndReachedHandler}
                            onEndReachedThreshold={0.2}
                            ListFooterComponent={renderLoader}
                            initialNumToRender={6}
                            maxToRenderPerBatch={3}
                            windowSize={5}
                            updateCellsBatchingPeriod={100}
                            removeClippedSubviews={true}
                            extraData={childBorrowedBooksList}
                            scrollEventThrottle={32}
                            showsVerticalScrollIndicator={true}
                            viewabilityConfig={viewabilityConfig}
                            disableVirtualization={uniqueBooksDataList.length < 15}
                            keyboardShouldPersistTaps="handled"
                            onScrollToIndexFailed={() => {}}
                        />
                    )}
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
        flex: 1,
        backgroundColor: COLORS.white,
    },
    listWrapper: {
        flex: 1,
        padding: 10,
    },
    listContainer: {
        paddingHorizontal: 10,
        paddingTop: 15,
        flex: 1,
    },
    loaderContainer: {
        padding: 10,
        marginTop: 10,
        alignItems: 'center',
    },
    searchLoaderContainer: {
        padding: 16,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
