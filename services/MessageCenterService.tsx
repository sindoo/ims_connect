import {Client, IMessage, StompSubscription} from '@stomp/stompjs';
import {BASEURL_SOCKET} from '../api/appUrl';
import {getRequest} from '../api/ApiManager';

type DiscussionListUpdateHandler = (discussionList: any[]) => void;

/**
 * Service de messagerie temps réel (STOMP sur WebSocket).
 *
 * Changements par rapport à la version précédente :
 * - `connectToWebSocket` (qui créait un Client STOMP immédiatement, même
 *   quand il n'était pas utilisé) devient `createStompClient()` : le client
 *   n'est créé que lorsque l'appelant en a réellement besoin.
 * - `onConnect` accepte désormais un callback `onDiscussionListUpdate`,
 *   appelé à chaque message reçu sur le topic des espaces de discussion,
 *   afin que l'écran appelant puisse répercuter la mise à jour (ex: dispatch
 *   Redux) au lieu de la laisser se perdre dans une variable locale.
 * - Correction d'un bug : la récupération des derniers messages utilisait
 *   `discussionThread.id` (la trame STOMP reçue) au lieu de l'id de chaque
 *   discussion de la liste (`discussion.id`).
 * - Ajout de `disconnect(client)` pour se désabonner proprement et
 *   désactiver le client (à appeler quand l'utilisateur quitte l'écran).
 */
export function MessageCenterService() {
  let spacesSubscription: StompSubscription | null = null;

  const createStompClient = (tokenParent): Client => {
    return new Client({
      brokerURL: `${BASEURL_SOCKET}/ws?token=${tokenParent}`,
      connectHeaders: {},
      debug: (str: string) => console.log(str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
    });
  };

  const onConnect = (
      client: Client,
      dataTosend: any,
      user: any,
      onDiscussionListUpdate?: DiscussionListUpdateHandler,
  ) => {
    client.onConnect = () => {
      // Écoute de tous les espaces de discussion de l'utilisateur connecté
      client.publish({
        destination: '/app/chat/spaces',
        body: JSON.stringify(dataTosend),
        skipContentLengthHeader: true,
      });

      spacesSubscription = client.subscribe(
          `/chat/utilisateur/${user.uuid}/spaces`,
          async (discussionThread: IMessage) => {
            const discussionList: any[] = JSON.parse(discussionThread.body)
                .sort((a: any, b: any) => a.theDate - b.theDate)
                .reverse();

            if (discussionList.length === 0) {
              onDiscussionListUpdate?.([]);
              return;
            }

            const discussionListReq = await Promise.all(
                discussionList.map(async (discussion: any) => {
                  const messagesReq: any = await getRequest(
                      '',
                      `/ws/chat/space/${discussion.id}/messages`,
                  );
                  const messages = (messagesReq ?? [])
                      .sort((a: any, b: any) => a.theDate - b.theDate)
                      .reverse();

                  return {
                    ...discussion,
                    lastMessage: messages[0]?.message,
                    theDateMessage: messages[0]?.theDate,
                  };
                }),
            );

            onDiscussionListUpdate?.(discussionListReq);
          },
          {'Content-Type': 'application/json'},
      );
    };

    client.activate();
  };

  // À appeler quand l'utilisateur quitte l'écran : désabonne le topic puis
  // désactive le client (ferme proprement la connexion WebSocket).
  const disconnect = (client: Client | null) => {
    spacesSubscription?.unsubscribe();
    spacesSubscription = null;
    client?.deactivate();
  };

  return {
    createStompClient,
    onConnect,
    disconnect,
  };
}
