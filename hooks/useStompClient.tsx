import { useEffect, useRef, useCallback, useState } from 'react';
import {Client, IMessage, StompSubscription, Versions} from '@stomp/stompjs';
import { BASEURL_SOCKET } from '../api/appUrl';

interface UseStompClientOptions {
    userToken: string | null;
    userUuid: string | null;
    onMessageReceived?: (message: IMessage) => void;
    onDiscussionListUpdate?: (list: any[]) => void;
}

interface PendingPublish {
    destination: string;
    body: any;
}

export function useStompClient({
                                   userToken,
                                   userUuid,
                                   onMessageReceived,
                                   onDiscussionListUpdate,
                               }: UseStompClientOptions) {
    const clientRef = useRef<Client | null>(null);
    const subscriptionsRef = useRef<Map<string, StompSubscription>>(new Map());
    const pendingPublishesRef = useRef<PendingPublish[]>([]);
    const onConnectHandlersRef = useRef<Set<(frame: any) => void>>(new Set());
    const isConnectingRef = useRef(false);
    const [isConnected, setIsConnected] = useState(false);

    // Créer le client une seule fois
    const getClient = useCallback(() => {
        if (!userToken) return null;

        if (!clientRef.current) {
            clientRef.current = new Client({
                brokerURL: `${BASEURL_SOCKET}/ws?token=${userToken}`,
                connectHeaders: {},
                // Ne jamais passer undefined : stompjs appelle this.debug() sans vérifier (crash en production)
                debug: __DEV__ ? (str) => console.log('[STOMP]', str) : () => {},
                reconnectDelay: 30000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 0,
                forceBinaryWSFrames: true,
                appendMissingNULLonIncoming: true,
                stompVersions: new Versions(['1.1', '1.0']),

                onConnect: (frame) => {
                    console.log('[STOMP] Connected');
                    setIsConnected(true);
                    isConnectingRef.current = false;

                    // Réinitialiser les abonnements lors de la reconnexion
                    subscriptionsRef.current.clear();

                    // Exécuter tous les handlers onConnect enregistrés
                    onConnectHandlersRef.current.forEach((handler) => {
                        try {
                            handler(frame);
                        } catch (error) {
                            console.log('[STOMP] Error in onConnect handler:', error);
                        }
                    });

                    // Vider la queue des publications en attente
                    if (pendingPublishesRef.current.length > 0) {
                        console.log(
                            `[STOMP] Flushing ${pendingPublishesRef.current.length} pending publishes`
                        );
                        const pending = [...pendingPublishesRef.current];
                        pendingPublishesRef.current = [];
                        pending.forEach(({ destination, body }) => {
                            try {
                                clientRef.current?.publish({
                                    destination,
                                    body: JSON.stringify(body),
                                    skipContentLengthHeader: true,
                                });
                            } catch (error) {
                                console.log('[STOMP] Error publishing pending message:', error);
                            }
                        });
                    }
                },

                onDisconnect: () => {
                    console.log('[STOMP] Disconnected');
                    setIsConnected(false);
                    isConnectingRef.current = false;
                },

                onStompError: (frame) => {
                    console.log('[STOMP] Error:', frame.headers['message'], frame.body);
                    isConnectingRef.current = false;
                },

                onWebSocketError: (event) => {
                    console.log('[STOMP] WebSocket Error:', event);
                    isConnectingRef.current = false;
                },

                onWebSocketClose: (event) => {
                    // event.code / event.reason viennent directement de la CloseEvent
                    // du WebSocket : indispensables pour distinguer un rejet
                    // d'authentification (souvent 1008) d'une coupure réseau (1006),
                    // d'un arrêt volontaire (1000), etc.
                    console.log('[STOMP] WebSocket closed. Code:', event?.code, 'Reason:', event?.reason);
                    setIsConnected(false);
                    isConnectingRef.current = false;
                },
            });
        }

        return clientRef.current;
    }, [userToken, userUuid]);

    // Enregistrer un handler qui sera appelé à chaque connexion
    const onConnect = useCallback((handler: (frame: any) => void) => {
        onConnectHandlersRef.current.add(handler);
        return () => {
            onConnectHandlersRef.current.delete(handler);
        };
    }, []);

    // S'abonner à un canal (avec déduplication)
    const subscribe = useCallback(
        (destination: string, callback: (message: IMessage) => void, id?: string) => {
            const client = getClient();
            if (!client || !client.connected) {
                console.warn('[STOMP] Cannot subscribe: client not connected');
                return null;
            }

            // Éviter les abonnements dupliqués
            const subscriptionKey = id || destination;
            if (subscriptionsRef.current.has(subscriptionKey)) {
                console.log(`[STOMP] Already subscribed to ${destination}`);
                return subscriptionsRef.current.get(subscriptionKey)!;
            }

            const subscription = client.subscribe(destination, callback, {
                id: subscriptionKey,
                'Content-Type': 'application/json',
            });

            subscriptionsRef.current.set(subscriptionKey, subscription);
            console.log(`[STOMP] Subscribed to ${destination}`);
            return subscription;
        },
        [getClient]
    );

    // ⬇️ CORRECTION : la fonction activate est déclarée AVANT publish
    // car publish en a besoin
    const activate = useCallback(() => {
        const client = getClient();
        if (client && !client.active && !isConnectingRef.current) {
            isConnectingRef.current = true;
            client.activate();
            console.log('[STOMP] Activating client');
        }
    }, [getClient]);

    // Publier un message (avec queueing automatique si non connecté)
    const publish = useCallback(
        (destination: string, body: any) => {
            const client = getClient();
            if (!client) {
                console.warn('[STOMP] Cannot publish: client not initialized');
                return false;
            }

            if (client.connected) {
                // Connecté : publier immédiatement
                client.publish({
                    destination,
                    body: JSON.stringify(body),
                    skipContentLengthHeader: true,
                });
                return true;
            }

            // Non connecté : mettre en queue et s'assurer que le client est activé
            console.log('[STOMP] Queueing message:', destination);
            pendingPublishesRef.current.push({ destination, body });

            if (!client.active) {
                activate();
            }
            return true;
        },
        [getClient, activate]
    );

    // Nettoyer tous les abonnements
    const unsubscribeAll = useCallback(() => {
        subscriptionsRef.current.forEach((sub, key) => {
            try {
                sub.unsubscribe();
                console.log(`[STOMP] Unsubscribed from ${key}`);
            } catch (e) {
                console.warn(`[STOMP] Error unsubscribing from ${key}:`, e);
            }
        });
        subscriptionsRef.current.clear();
    }, []);

    // Désactiver le client
    const deactivate = useCallback(async () => {
        const client = getClient();
        if (client && client.active) {
            unsubscribeAll();
            await client.deactivate();
            console.log('[STOMP] Client deactivated');
        }
    }, [getClient, unsubscribeAll]);

    // Cycle de vie
    useEffect(() => {
        if (userToken && userUuid) {
            activate();
        }

        return () => {
            unsubscribeAll();
        };
    }, [userToken, userUuid, activate, unsubscribeAll]);

    return {
        client: clientRef.current,
        getClient,
        subscribe,
        publish,
        unsubscribeAll,
        activate,
        deactivate,
        onConnect,
        isConnected,
    };
}
