import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { Snackbar } from 'react-native-paper';
import debounce from 'lodash/debounce';
import { useFocusEffect } from 'expo-router';
import MiniClubService from '../../../../../services/MiniClubService';
import { setChildMiniClubList } from '../../../../../redux/features/club/miniClubSlice';
import { checkTokenExpired } from '../../../../../services/GeneralService';
import Loading from '../../../../../components/ui/Loading';
import { COLORS } from '../../../../../constants';
import { TMiniClub } from '../../../../../lib/type/TMiniClubProps';
import MiniClubItem from '../../../../../components/tabs/more/club/MiniClubItem';

const SNACKBAR_DURATION = 3000;

function MiniClub() {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    // Sélecteurs memoïsés
    const { selectedChild } = useSelector((state: any) => state.child);
    const { userToken } = useSelector((state: any) => state.user);
    const { childMiniClubList, updateMiniClubStatus } = useSelector((state: any) => state.miniclub);

    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filteredList, setFilteredList] = useState<TMiniClub[]>([]);

    // États pour le Snackbar
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

    const abortControllerRef = useRef<AbortController | null>(null);

    // Fonction pour afficher le snackbar
    const showSnackbar = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setSnackbarMessage(message);
        setSnackbarType(type);
        setSnackbarVisible(true);
    }, []);

    // Fonction de recherche optimisée avec debounce
    const handleSearch = useCallback(
        debounce((searchTerm: string) => {
            if (!searchTerm.trim()) {
                setFilteredList(childMiniClubList);
                return;
            }

            const filtered = childMiniClubList.filter((item: TMiniClub) =>
                item.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredList(filtered);
        }, 300),
        [childMiniClubList]
    );

    // Nettoyer le debounce
    useEffect(() => {
        return () => {
            handleSearch.cancel();
        };
    }, [handleSearch]);

    const handleClearSearch = useCallback(() => {
        setSearch('');
        setFilteredList(childMiniClubList);
    }, [childMiniClubList]);

    const handleSearchChange = useCallback((text: string) => {
        setSearch(text);
        handleSearch(text);
    }, [handleSearch]);

    // Chargement des données
    const fetchMiniClubs = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
        }

        try {
            // Annuler la requête précédente
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            if (selectedChild) {
                const miniClubListFiltered = await MiniClubService.getChildClassMiniClubData(selectedChild);
                setFilteredList(miniClubListFiltered);
                dispatch(setChildMiniClubList(miniClubListFiltered));
            } else {
                setFilteredList([]);
                dispatch(setChildMiniClubList([]));
            }

            checkTokenExpired(userToken, dispatch);
        } catch (error: any) {
            if (error?.name !== 'AbortError') {
                console.error('Error fetching mini clubs:', error);
                showSnackbar(t('common.error_loading'), 'error');
                checkTokenExpired(userToken, dispatch);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedChild, userToken, dispatch, showSnackbar, t]);

    // Rafraîchissement
    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMiniClubs(false);
    }, [fetchMiniClubs]);

    // Recharger quand le statut change
    useEffect(() => {
        if (updateMiniClubStatus) {
            fetchMiniClubs();
        }
    }, [updateMiniClubStatus, fetchMiniClubs]);

    // Chargement initial avec focus
    useFocusEffect(
        useCallback(() => {
            fetchMiniClubs();
            return () => {
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }
            };
        }, [fetchMiniClubs])
    );

    // Message vide memoïsé
    const emptyMessage = useMemo(() => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                {t('more.empty_mini_club')}
            </Text>
        </View>
    ), [t]);

    // Couleur du snackbar selon le type
    const snackbarColor = snackbarType === 'success' ? COLORS.secondary : COLORS.redIms;

    if (loading) {
        return <Loading />;
    }

    return (
        <>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    {/* Barre de recherche */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchBar}>
                            <MaterialIcons name="search" size={20} color={COLORS.gray} />
                            <TextInput
                                style={styles.input}
                                placeholder={t('allAppointment.search')}
                                placeholderTextColor={COLORS.gray}
                                value={search}
                                onChangeText={handleSearchChange}
                                returnKeyType="search"
                                clearButtonMode="while-editing"
                                accessibilityLabel={t('allAppointment.search_placeholder')}
                            />
                            {search.length > 0 && (
                                <TouchableOpacity
                                    onPress={handleClearSearch}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    accessibilityLabel={t('common.clear_search')}
                                >
                                    <MaterialIcons name="close" size={18} color={COLORS.gray} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Liste des mini-clubs */}
                    <ScrollView
                        style={styles.miniClubList}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={filteredList.length === 0 && styles.emptyListContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                colors={[COLORS.secondary]}
                                tintColor={COLORS.secondary}
                            />
                        }
                    >
                        {filteredList.length === 0 ? (
                            emptyMessage
                        ) : (
                            filteredList.map((miniClub: TMiniClub) => (
                                <MiniClubItem
                                    key={miniClub.id}
                                    data={miniClub}
                                />
                            ))
                        )}
                    </ScrollView>
                </View>
            </TouchableWithoutFeedback>

            {/* Snackbar react-native-paper */}
            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={SNACKBAR_DURATION}
                style={[styles.snackbar, { backgroundColor: snackbarColor }]}
                wrapperStyle={styles.snackbarWrapper}
                theme={{ colors: { surface: snackbarColor } }}
            >
                <Text style={styles.snackbarText}>{snackbarMessage}</Text>
            </Snackbar>
        </>
    );
}

export default MiniClub;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    searchContainer: {
        padding: 10,
        paddingHorizontal: 15,
    },
    searchBar: {
        flexDirection: 'row',
        marginTop: 10,
        padding: 6,
        paddingHorizontal: 10,
        backgroundColor: COLORS.grayVeryLight,
        borderRadius: 6,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        padding: 3,
        fontSize: 16,
        color: COLORS.gray,
        marginLeft: 4,
    },
    miniClubList: {
        paddingHorizontal: 10,
        paddingTop: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.gray,
        fontSize: 16,
    },
    emptyListContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    snackbar: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 8,
        elevation: 4,
    },
    snackbarWrapper: {
        bottom: 0,
        position: 'absolute',
    },
    snackbarText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
});
