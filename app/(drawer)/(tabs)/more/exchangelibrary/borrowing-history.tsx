import React, {useCallback, useState, useMemo, useEffect} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from "react-i18next";
import {useSelector} from "react-redux";
import {globalStyles} from "../../../../../style/Global";
import {COLORS} from "../../../../../constants";
import BookItem from "../../../../../components/tabs/more/exchangelibray/BookItem";
import BookDetails from "../../../../../components/tabs/more/exchangelibray/BookDetails";
import ExchangeLibraryService from "../../../../../services/ExchangeLibraryService";

const ACCENT_REGEX = /[̀-ͯ]/g;

const BorrowingHistory = () => {
    const {t} = useTranslation();
    const {childHistoryBooksList = []} = useSelector((state: any) => state.book);

    const [donor, setDonor] = useState<any>('');
    const [dataBook, setDataBook] = useState<any>(null);
    const [bookDetail, setBookDetail] = useState(false);
    const [bookCategory, setBookCategory] = useState<any>('');
    const [categoryCache, setCategoryCache] = useState<Map<number, string>>(new Map());
    const [booksWithCategories, setBooksWithCategories] = useState<any[]>([]);

    // ✅ Fonction pour normaliser les chaînes (enlever les accents)
    const normalizeString = useCallback((str: string) => {
        if (!str) return '';
        return str
            .normalize('NFD')
            .replace(ACCENT_REGEX, '')
            .toLowerCase();
    }, []);

    // ✅ Fonction de comparaison pour le tri français (gardee pour un usage
    // eventuel ailleurs, mais n'est plus utilisee pour trier cette liste)
    const compareFrench = useCallback((a: string, b: string) => {
        if (!a && !b) return 0;
        if (!a) return 1;
        if (!b) return -1;

        const normalizedA = normalizeString(a);
        const normalizedB = normalizeString(b);

        if (normalizedA < normalizedB) return -1;
        if (normalizedA > normalizedB) return 1;
        return 0;
    }, [normalizeString]);

    // ✅ Precharger les categories pour les livres de l'historique
    useEffect(() => {
        const loadCategories = async () => {
            if (childHistoryBooksList.length === 0) {
                setBooksWithCategories([]);
                return;
            }

            try {
                const categoryIds = [...new Set(childHistoryBooksList
                    .map((book: any) => book?.livreCategorieId)
                    .filter((id: any) => id && !categoryCache.has(id))
                )];

                let updatedCache = categoryCache;
                if (categoryIds.length > 0) {
                    const promises = categoryIds.map((id: number) =>
                        ExchangeLibraryService.getCategoryBookById(id)
                    );
                    const results = await Promise.all(promises);

                    const newMap = new Map(categoryCache);
                    categoryIds.forEach((id: number, index: number) => {
                        if (results[index]?.nom) {
                            newMap.set(id, results[index].nom);
                        }
                    });
                    updatedCache = newMap;
                    setCategoryCache(newMap);
                }

                const updatedBooks = childHistoryBooksList.map((book: any) => ({
                    ...book,
                    bookCategoryName: updatedCache.get(book?.livreCategorieId) || ''
                }));
                setBooksWithCategories(updatedBooks);

            } catch (error) {
                console.log('Load categories error:', error);
                setBooksWithCategories(childHistoryBooksList);
            }
        };

        loadCategories().catch(error => {
            console.log('Load categories error fetch 2:', error);
        });
    }, [childHistoryBooksList]);

    const isEmpty = useMemo(() => booksWithCategories.length === 0, [booksWithCategories.length]);

    const renderBookItem = useCallback(({item}: {item: any}) => {
        if (!item || !item.id) return null;

        return (
            <BookItem
                key={`history-book-${item.id}`}
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
                setBookCategory={setBookCategory}
                bookCategoryName={item?.bookCategoryName || ''}
            />
        );
    }, [donor, bookDetail]);

    const keyExtractor = useCallback((item: any, index: number) => {
        if (item?.id) {
            return `history-book-${item.id}`;
        }
        return `history-book-fallback-${index}`;
    }, []);

    const viewabilityConfig = useMemo(() => ({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 300,
    }), []);

    // ✅ Eviter les doublons et trier par date de retour DECROISSANTE
    // (le retour le plus recent en premier). Un livre sans dateRetour
    // (ne devrait plus arriver ici puisque all-book.tsx filtre deja sur
    // dateRetour !== null, mais on securise quand meme) est repousse en
    // fin de liste plutot que de faire planter le tri.
    const uniqueList = useMemo(() => {
        const seen = new Set();
        const filtered = booksWithCategories.filter((item: any) => {
            if (!item || !item.id) return false;
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });

        return filtered.sort((a: any, b: any) => {
            const timeA = a?.dateRetour ? new Date(a.dateRetour).getTime() : null;
            const timeB = b?.dateRetour ? new Date(b.dateRetour).getTime() : null;
            if (timeA === null && timeB === null) return 0;
            if (timeA === null) return 1;
            if (timeB === null) return -1;
            return timeB - timeA;
        });
    }, [booksWithCategories]);

    return (
        <View style={globalStyles.container}>
            <FlatList
                style={styles.listContainer}
                data={uniqueList}
                keyExtractor={keyExtractor}
                renderItem={renderBookItem}
                // ✅ Pas de pagination ici - liste statique
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {t('more.empty_borrow_library')}
                        </Text>
                    </View>
                }
                contentContainerStyle={isEmpty && styles.emptyContentContainer}
                initialNumToRender={8}
                maxToRenderPerBatch={5}
                windowSize={7}
                removeClippedSubviews={true}
                updateCellsBatchingPeriod={100}
                viewabilityConfig={viewabilityConfig}
                disableVirtualization={uniqueList.length < 20}
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
