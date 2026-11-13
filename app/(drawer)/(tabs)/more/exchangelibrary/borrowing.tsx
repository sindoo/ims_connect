   import React, {useCallback, useState, useMemo, useEffect} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from "react-i18next";
import {useSelector} from "react-redux";
import {globalStyles} from "../../../../../style/Global";
import {COLORS} from "../../../../../constants";
import BookItem from "../../../../../components/tabs/more/exchangelibray/BookItem";
import BookDetails from "../../../../../components/tabs/more/exchangelibray/BookDetails";
import ExchangeLibraryService from "../../../../../services/ExchangeLibraryService";

function Borrowing() {
    const {t} = useTranslation();
    const {childBorrowedBooksList = []} = useSelector((state: any) => state.book);

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
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }, []);

    // ✅ Fonction de comparaison pour le tri français
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

    // ✅ Précharger les catégories pour les livres empruntés
    useEffect(() => {
        const loadCategories = async () => {
            if (childBorrowedBooksList.length === 0) {
                setBooksWithCategories([]);
                return;
            }

            try {
                const categoryIds = [...new Set(childBorrowedBooksList
                    .map((book: any) => book?.livreCategorieId)
                    .filter((id: any) => id && !categoryCache.has(id))
                )];

                // BUG corrige : le code d'origine lisait "categoryCache.get(...)"
                // (la variable de state) juste apres avoir appele
                // "setCategoryCache(...)" pour construire "updatedBooks".
                // Comme setState est asynchrone, "categoryCache" ici pointait
                // encore vers l'ANCIENNE Map (sans les categories qu'on venait
                // de recuperer) : le nom de categorie de chaque livre
                // restait vide ("") au tout premier affichage, et comme cet
                // effet ne se relance que si "childBorrowedBooksList" change
                // (pas si "categoryCache" change), il ne se corrigeait jamais
                // tout seul. On construit maintenant "updatedCache" localement
                // (la Map fraichement fusionnee) et on s'en sert pour
                // "updatedBooks", au lieu de relire le state pas encore a jour.
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

                const updatedBooks = childBorrowedBooksList.map((book: any) => ({
                    ...book,
                    bookCategoryName: updatedCache.get(book?.livreCategorieId) || ''
                }));
                setBooksWithCategories(updatedBooks);

            } catch (error) {
                console.log('Load categories error:', error);
                setBooksWithCategories(childBorrowedBooksList);
            }
        };

        loadCategories().catch(error => {
            console.log('Load categories error 2:', error);
        });
    }, [childBorrowedBooksList]);

    const isEmpty = useMemo(() => booksWithCategories.length === 0, [booksWithCategories.length]);

    const renderBookItem = useCallback(({item}: {item: any}) => {
        if (!item || !item.id) return null;

        return (
            <BookItem
                key={`borrowed-book-${item.id}`}
                data={item}
                bookStatus={false}
                borrowChildStatus={true}
                comeBackDate={true}
                handleBorrowBook={() => {}}
                donor={donor}
                borrowStatusType={true}
                setDonor={setDonor}
                bookDetail={bookDetail}
                setBookDetail={setBookDetail}
                setDataBook={setDataBook}
                setBookCategory={setBookCategory}
                bookCategoryName={item?.bookCategoryName || ''}
                showDeadline={true}
            />
        );
    }, [donor, bookDetail]);

    const keyExtractor = useCallback((item: any, index: number) => {
        if (item?.id) {
            return `borrowed-book-${item.id}`;
        }
        return `borrowed-book-fallback-${index}`;
    }, []);

    const viewabilityConfig = useMemo(() => ({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 300,
    }), []);

    // ✅ Éviter les doublons et trier par ordre alphabétique (français)
    const uniqueList = useMemo(() => {
        const seen = new Set();
        const filtered = booksWithCategories.filter((item: any) => {
            if (!item || !item.id) return false;
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });

        return filtered.sort((a: any, b: any) => {
            return compareFrench(a?.nom || '', b?.nom || '');
        });
    }, [booksWithCategories, compareFrench]);

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
}

export default Borrowing;

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
