import React, {useCallback, useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import {MaterialCommunityIcons, MaterialIcons} from '@expo/vector-icons';
import AuthenticationService from '../../../services/AuthenticationService';
import {apiErrorMessage} from '../../../api/ApiManager';
import {checkTokenExpired} from '../../../services/GeneralService';
import {loginUser} from '../../../redux/features/user/userSlice';
import {globalStyles} from '../../../style/Global';
import {COLORS} from '../../../constants';
import FlatButton from '../../../components/ui/FlatButton';
import {withSnackbar} from '../../../components/ui/SnackbarHOC';

const MIN_LENGTH = 3;
// Délai après la dernière frappe avant d'interroger le serveur
const CHECK_DELAY_MS = 500;

type CheckState =
    | {status: 'idle'}
    | {status: 'checking'}
    | {status: 'done'; available: boolean | null; suggestions: string[]}
    | {status: 'error'; message: string};

// Écran "Mon nom d'utilisateur" : le parent connecté saisit le nom souhaité,
// l'app vérifie sa disponibilité auprès du serveur, puis l'enregistre après
// confirmation par mot de passe.
function ChangeUsername({snackbarShowMessage}: {snackbarShowMessage: any}) {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const {user, userToken} = useSelector((state: any) => state.user);
    const currentUsername: string = user?.username ?? '';

    const [newUsername, setNewUsername] = useState('');
    const [check, setCheck] = useState<CheckState>({status: 'idle'});
    const [saving, setSaving] = useState(false);
    // Mot de passe actuel, exigé par le serveur pour confirmer le changement
    const [password, setPassword] = useState('');
    const [passwordHidden, setPasswordHidden] = useState(true);

    const wanted = newUsername.trim();
    const sameAsCurrent = wanted !== '' && wanted.toLowerCase() === currentUsername.toLowerCase();
    const tooShort = wanted !== '' && wanted.length < MIN_LENGTH;

    // Formulaire remis à zéro à chaque ouverture (les écrans du menu restent montés)
    useFocusEffect(
        useCallback(() => {
            setNewUsername('');
            setPassword('');
            setPasswordHidden(true);
            setCheck({status: 'idle'});
        }, []),
    );

    // Vérification de disponibilité, après une courte pause dans la saisie.
    // Une vérification devenue obsolète (nouvelle frappe) est annulée.
    useEffect(() => {
        if (wanted === '' || tooShort || sameAsCurrent) {
            setCheck({status: 'idle'});
            return;
        }

        const controller = new AbortController();
        setCheck({status: 'checking'});
        const timer = setTimeout(async () => {
            try {
                const result = await AuthenticationService.checkUsernameAvailability(wanted, controller.signal);
                if (controller.signal.aborted) return;
                setCheck({status: 'done', ...result});
            } catch (error: any) {
                if (controller.signal.aborted || error?.code === 'ERR_CANCELED') return;
                console.log('❌ Vérification nom d\'utilisateur:', JSON.stringify({
                    status: error?.response?.status,
                    data: error?.response?.data,
                    code: error?.code,
                }));
                setCheck({status: 'error', message: apiErrorMessage(error, t('usernameChange.check_error'))});
                checkTokenExpired(userToken, dispatch);
            }
        }, CHECK_DELAY_MS);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [wanted, tooShort, sameAsCurrent, userToken, dispatch, t]);

    const available = check.status === 'done' ? check.available : null;
    const suggestions = check.status === 'done'
        ? check.suggestions.filter(name => name.toLowerCase() !== wanted.toLowerCase())
        : [];
    // Enregistrement possible si le serveur confirme la disponibilité. Si sa
    // réponse n'est pas reconnue (available = null) ou si la vérification a
    // échoué, on laisse le serveur trancher à l'enregistrement.
    const canSave = !saving
        && wanted !== '' && !tooShort && !sameAsCurrent
        && password.trim() !== ''
        && check.status !== 'checking'
        && available !== false;

    const handleSave = async () => {
        if (!canSave) return;
        Keyboard.dismiss();
        setSaving(true);
        try {
            const response: any = await AuthenticationService.updateUsername(currentUsername, password, wanted);
            // Met à jour l'utilisateur connecté (et le jeton si le serveur en renvoie un nouveau)
            dispatch(loginUser({
                token: response?.token ?? userToken,
                user: response?.user ?? {...user, username: wanted},
            }));
            setNewUsername('');
            setPassword('');
            setCheck({status: 'idle'});
            snackbarShowMessage(t('usernameChange.success'));
        } catch (error: any) {
            const status = error?.response?.status;
            const serverData = error?.response?.data;
            const serverCode = serverData?.codeMessage ?? serverData?.code;
            console.log('❌ Changement nom d\'utilisateur:', JSON.stringify({
                status,
                data: serverData,
                code: error?.code,
                message: error?.message,
            }));

            if ((status === 401 || status === 403) && AuthenticationService.checkTokenValidity(userToken)) {
                // Session expirée : déconnexion, comme sur les autres écrans
                checkTokenExpired(userToken, dispatch);
            } else if (serverCode === 'BAD_CREDENTIALS' || status === 401 || status === 403) {
                // Mot de passe refusé par le serveur
                snackbarShowMessage(t('usernameChange.password_error'));
            } else if (status === 409) {
                // Nom pris entre-temps
                snackbarShowMessage(t('usernameChange.not_available'));
                setCheck({status: 'done', available: false, suggestions: []});
            } else {
                const detail = serverCode ?? status;
                const fallback = detail ? `${t('snackBar.sb_error')} (${detail})` : t('snackBar.sb_error');
                snackbarShowMessage(apiErrorMessage(error, fallback));
            }
        } finally {
            setSaving(false);
        }
    };

    // Ligne d'état sous le champ
    let statusText: string | null = null;
    let statusColor = COLORS.gray;
    let statusIcon: any = null;
    if (sameAsCurrent) {
        statusText = t('usernameChange.same_as_current');
    } else if (tooShort) {
        statusText = t('usernameChange.too_short');
    } else if (check.status === 'checking') {
        statusText = t('usernameChange.checking');
    } else if (check.status === 'error') {
        statusText = check.message;
        statusColor = COLORS.red;
        statusIcon = 'error-outline';
    } else if (available === true) {
        statusText = t('usernameChange.available');
        statusColor = COLORS.greenLight;
        statusIcon = 'check-circle';
    } else if (available === false) {
        statusText = t('usernameChange.unavailable');
        statusColor = COLORS.red;
        statusIcon = 'cancel';
    }

    return (
        <View style={globalStyles.container}>
            <ScrollView
                style={styles.flexOne}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>{t('drawer.title_edit_username')}</Text>

                <Text style={styles.label}>{t('usernameChange.current')}</Text>
                <View style={styles.currentBox}>
                    <Text style={styles.currentText}>{currentUsername}</Text>
                </View>

                <Text style={styles.label}>{t('usernameChange.new_label')}</Text>
                <TextInput
                    style={[
                        styles.input,
                        available === false && styles.inputError,
                        available === true && styles.inputValid,
                    ]}
                    placeholder={t('usernameChange.new_placeholder')}
                    placeholderTextColor={COLORS.gray}
                    value={newUsername}
                    onChangeText={setNewUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!saving}
                />

                {statusText !== null && (
                    <View style={styles.statusRow}>
                        {check.status === 'checking' && !tooShort && !sameAsCurrent && (
                            <ActivityIndicator size="small" color={COLORS.gray} />
                        )}
                        {statusIcon !== null && <MaterialIcons name={statusIcon} size={16} color={statusColor} />}
                        <Text style={[styles.statusText, {color: statusColor}]}>{statusText}</Text>
                    </View>
                )}

                {suggestions.length > 0 && (
                    <View style={styles.suggestions}>
                        <Text style={styles.suggestionsLabel}>{t('usernameChange.suggestions')}</Text>
                        <View style={styles.chips}>
                            {suggestions.map(name => (
                                <TouchableOpacity
                                    key={name}
                                    style={styles.chip}
                                    activeOpacity={0.8}
                                    disabled={saving}
                                    onPress={() => setNewUsername(name)}>
                                    <Text style={styles.chipText}>{name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                <Text style={styles.label}>{t('usernameChange.password_label')}</Text>
                <View style={styles.passwordRow}>
                    <TextInput
                        style={styles.passwordInput}
                        secureTextEntry={passwordHidden}
                        placeholder={t('login.password')}
                        placeholderTextColor={COLORS.gray}
                        value={password}
                        onChangeText={setPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!saving}
                    />
                    <TouchableOpacity
                        onPress={() => setPasswordHidden(hidden => !hidden)}
                        activeOpacity={0.8}
                        style={styles.passwordIcon}>
                        <MaterialCommunityIcons
                            name={passwordHidden ? 'eye' : 'eye-off'}
                            size={22}
                            color={COLORS.gray}
                        />
                    </TouchableOpacity>
                </View>

                <Text style={styles.hint}>{t('usernameChange.login_hint')}</Text>
                <View style={styles.button}>
                    <FlatButton
                        title={t('allAppointment.save_form')}
                        fontWeight="bold"
                        fontSize={16}
                        backgroundColor={COLORS.secondary}
                        onPress={handleSave}
                        paddingVertical={17}
                        borderRadius={30}
                        disabled={!canSave}
                        loading={saving}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

export default withSnackbar(ChangeUsername);

const styles = StyleSheet.create({
    flexOne: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
        color: COLORS.secondary,
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    label: {
        color: COLORS.gray,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 10,
    },
    currentBox: {
        borderWidth: 1,
        borderColor: COLORS.grayMedium,
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        backgroundColor: COLORS.grayExtraLight,
    },
    currentText: {
        fontSize: 16,
        color: COLORS.blackDark,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.grayMedium,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.blackDark,
    },
    inputError: {
        borderColor: COLORS.red,
    },
    inputValid: {
        borderColor: COLORS.greenLight,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    statusText: {
        marginLeft: 6,
        fontSize: 13,
        flexShrink: 1,
    },
    suggestions: {
        marginTop: 12,
    },
    suggestionsLabel: {
        color: COLORS.gray,
        fontSize: 13,
        marginBottom: 6,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    chip: {
        borderWidth: 1,
        borderColor: COLORS.secondary,
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8,
    },
    chipText: {
        color: COLORS.secondary,
        fontWeight: '600',
    },
    passwordRow: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: COLORS.grayMedium,
        borderRadius: 8,
        marginBottom: 10,
        marginTop: 0,
    },
    passwordInput: {
        flex: 6,
        fontSize: 16,
        padding: 12,
        color: COLORS.blackDark,
    },
    passwordIcon: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hint: {
        color: COLORS.gray,
        fontSize: 13,
        marginTop: 5,
    },
    button: {
        marginTop: 25,
    },
});
