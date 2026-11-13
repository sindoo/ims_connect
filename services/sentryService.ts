import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import type {ComponentType} from 'react';

// Passer à true pour tester l'envoi d'erreurs depuis un build de développement.
const ENABLE_IN_DEV = false;

// Le DSN est lu dans app.json (extra.sentry.dsn). Vide = Sentry désactivé.
const dsn: string = String(Constants.expoConfig?.extra?.sentry?.dsn ?? '').trim();

export const isSentryEnabled = dsn.length > 0 && (!__DEV__ || ENABLE_IN_DEV);

export const initSentry = () => {
    if (!isSentryEnabled) return;

    Sentry.init({
        dsn,
        environment: __DEV__ ? 'development' : 'production',
        // Application scolaire : aucune donnée personnelle envoyée par défaut
        // (pas d'adresse IP, pas de cookies, pas d'en-têtes).
        sendDefaultPii: false,
        // Les console.log de l'app contiennent des données d'enfants et de
        // parents : on ne les joint pas aux rapports d'erreur.
        integrations: [Sentry.breadcrumbsIntegration({console: false})],
    });
};

export const wrapWithSentry = <P extends Record<string, unknown>>(
    RootComponent: ComponentType<P>,
): ComponentType<P> => (isSentryEnabled ? Sentry.wrap(RootComponent) : RootComponent);

type StoreLike = {
    getState: () => any;
    subscribe: (listener: () => void) => () => void;
};

// Associe chaque erreur à l'identifiant technique du parent et de l'enfant
// sélectionné (jamais de nom ni d'email).
export const bindSentryToStore = (store: StoreLike) => {
    if (!isSentryEnabled) return;

    let lastUserId: string | null | undefined;
    let lastChildId: string | null | undefined;

    const sync = () => {
        const state = store.getState();

        const user = state?.user?.user;
        const userId = user?.uuid ? String(user.uuid) : null;
        if (userId !== lastUserId) {
            lastUserId = userId;
            Sentry.setUser(userId ? {id: userId} : null);
            Sentry.setTag('user.role', typeof user?.role === 'string' ? user.role : undefined);
        }

        const rawChildId = state?.child?.selectedChild?.person?.id;
        const childId = rawChildId != null ? String(rawChildId) : null;
        if (childId !== lastChildId) {
            lastChildId = childId;
            Sentry.setTag('child.id', childId ?? undefined);
        }
    };

    sync();
    store.subscribe(sync);
};

const API_ERROR_THROTTLE_MS = 60_000;
const lastApiErrorAt = new Map<string, number>();

// /enfants/123/photo -> /enfants/:id/photo : regroupe les erreurs par route.
const toRoute = (url: string) =>
    url
        .replace(/^https?:\/\/[^/]+/i, '')
        .replace(/[?#].*$/, '')
        .replace(/\/(\d+|[0-9a-fA-F]{8}-[0-9a-fA-F-]{27}|[0-9a-fA-F]{16,})(?=\/|$)/g, '/:id');

const truncate = (value: unknown, max = 500) => {
    if (value == null) return undefined;
    let text: string;
    try {
        text = typeof value === 'string' ? value : JSON.stringify(value);
    } catch {
        text = String(value);
    }
    return text.length > max ? `${text.slice(0, max)}…` : text;
};

// Signale à Sentry les réponses d'erreur de l'API (4xx/5xx).
// Ignorés : requêtes annulées, absence de réseau (pas de réponse) et 401
// (session expirée, cas normal).
export const captureApiError = (error: any) => {
    if (!isSentryEnabled) return;
    if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') return;

    const status: number | undefined = error?.response?.status;
    if (!status || status === 401) return;

    const config = error?.config ?? {};
    const method = String(config.method ?? 'get').toUpperCase();
    const route = toRoute(`${config.baseURL ?? ''}${config.url ?? ''}`);

    // Une même erreur (route + statut) n'est envoyée qu'une fois par minute.
    const key = `${method} ${route} ${status}`;
    const now = Date.now();
    if (now - (lastApiErrorAt.get(key) ?? 0) < API_ERROR_THROTTLE_MS) return;
    lastApiErrorAt.set(key, now);

    Sentry.withScope(scope => {
        scope.setLevel(status >= 500 ? 'error' : 'warning');
        scope.setFingerprint(['api-error', method, route, String(status)]);
        scope.setTag('api.status', String(status));
        scope.setTag('api.route', route);
        scope.setContext('api', {
            method,
            route,
            status,
            response: truncate(error?.response?.data),
        });
        Sentry.captureMessage(`API ${status} ${method} ${route}`);
    });
};

// Signale l'échec d'une action métier avec son contexte technique
// (identifiants, dates, statut HTTP). Jamais de texte saisi par l'utilisateur.
export const captureFeatureError = (
    name: string,
    error: any,
    context: Record<string, unknown> = {},
) => {
    if (!isSentryEnabled) return;

    const status: number | undefined = error?.response?.status;
    const config = error?.config ?? {};

    Sentry.withScope(scope => {
        scope.setLevel('error');
        scope.setFingerprint(['feature-error', name, String(status ?? error?.code ?? 'no-status')]);
        scope.setTag('feature', name);
        if (status) scope.setTag('api.status', String(status));
        scope.setContext('feature', {
            ...context,
            status,
            errorCode: error?.code,
            route: config.url ? toRoute(`${config.baseURL ?? ''}${config.url}`) : undefined,
            response: truncate(error?.response?.data),
        });
        Sentry.captureMessage(`Feature error: ${name}${status ? ` (${status})` : ''}`);
    });
};
