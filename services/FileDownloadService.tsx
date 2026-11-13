import {Alert, Platform} from 'react-native';
import {Directory, File, Paths} from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

export type MessageFileType = 'image' | 'document';

// Extrait l'extension (sans le point) d'une URL/nom de fichier, en ignorant
// une éventuelle query string ("...photo.jpg?token=..."). Renvoie null si
// aucune extension n'est trouvée.
const extractExtension = (uri: string): string | null => {
    const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
    return match ? match[1] : null;
};

// Télécharge le fichier joint à un message et l'enregistre sur le
// téléphone de l'utilisateur, en tenant compte de son type — utilisée par
// les 4 variantes de bulle de message (EmployeeMessageItem,
// ParentMessageItem, ParentTwoMessageItem, ParticipantMessageItem), qui se
// contentaient auparavant d'un Linking.openURL (ouverture dans le
// navigateur, sans rien enregistrer réellement sur l'appareil).
//
// - "image" : ajoutée directement à la pellicule/galerie via
//   expo-media-library (même logique que ImageItem.tsx). C'est la seule
//   librairie disponible ici pour écrire dans la galerie, mais elle
//   N'ACCEPTE QUE des médias (images/vidéos/audio) — voir le cas
//   "document" ci-dessous.
// - "document" (PDF, Word, Excel...) : expo-media-library refuserait ce
//   type de fichier. On passe donc par la feuille de partage native
//   (expo-sharing), où l'utilisateur choisit lui-même où l'enregistrer
//   ("Enregistrer dans Fichiers" sur iOS, une appli de gestion de
//   fichiers/Drive sur Android) — seule solution cross-platform pour un
//   fichier qui n'est pas un média.
//
// Toutes les erreurs (réseau, permission refusée, partage indisponible...)
// sont capturées et affichées via Alert ici, pour que les composants
// appelants n'aient qu'à basculer un état "downloading" autour de l'appel,
// sans dupliquer la gestion d'erreurs 4 fois.
export const downloadMessageFile = async (
    remoteUri: string,
    fileType: MessageFileType,
    suggestedName?: string,
): Promise<void> => {
    try {
        // L'extension doit impérativement venir de l'URL réelle du fichier
        // (remoteUri, qui correspond à message.fichier côté serveur et a donc
        // toujours une vraie extension). "suggestedName" (= message.nomFichier)
        // n'est qu'un libellé choisi par l'utilisateur à l'envoi et peut très
        // bien n'avoir aucune extension — c'est ce qui provoquait l'erreur
        // "Could not get the file's extension" de expo-media-library, qui exige
        // une extension reconnaissable pour enregistrer une image en galerie.
        const remoteExtension = extractExtension(remoteUri);
        const baseName = (
            suggestedName ||
            remoteUri.split('/').pop() ||
            `ims_fichier_${Date.now()}`
        ).replace(/\.[a-zA-Z0-9]+$/, ''); // on retire une éventuelle extension déjà présente pour éviter un doublon ("photo.png.jpg")
        const fileName = remoteExtension ? `${baseName}.${remoteExtension}` : baseName;
        // "idempotent: true" évite une erreur si l'utilisateur retélécharge
        // deux fois le même fichier (déjà présent dans le cache).
        const destinationFile = new File(Paths.cache, fileName);
        const downloadedFile = await File.downloadFileAsync(remoteUri, destinationFile, {
            idempotent: true,
        });

        if (fileType === 'image') {
            const {status} = await MediaLibrary.requestPermissionsAsync(true); // écriture seule : pas d'accès en lecture aux photos
            if (status !== 'granted') {
                Alert.alert(
                    'Autorisation requise',
                    "L'accès à vos photos est nécessaire pour enregistrer l'image.",
                );
                return;
            }
            await MediaLibrary.saveToLibraryAsync(downloadedFile.uri);
            Alert.alert('Photo enregistrée', 'La photo a été ajoutée à votre galerie.');
            return;
        }

        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (!isSharingAvailable) {
            Alert.alert(
                'Partage indisponible',
                "Le partage de fichiers n'est pas disponible sur cet appareil.",
            );
            return;
        }
        await Sharing.shareAsync(downloadedFile.uri, {
            dialogTitle: 'Enregistrer le document',
        });
    } catch (error) {
        console.log('[FileDownloadService] Erreur téléchargement:', error);
        Alert.alert(
            'Échec du téléchargement',
            "Une erreur est survenue lors de l'enregistrement du fichier.",
        );
    }
};

const MIME_TYPES: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    csv: 'text/csv',
    zip: 'application/zip',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
};

export type DocumentDownloadResult = 'saved' | 'shared' | 'cancelled';

// Télécharge un document scolaire et l'enregistre sur le téléphone.
// - Android : le fichier est téléchargé puis copié dans le dossier choisi par
//   l'utilisateur (sélecteur système, ex. "Téléchargements"), expo-media-library
//   n'acceptant que des médias.
// - iOS (ou repli si le dossier ne peut pas être utilisé) : feuille de partage
//   native ("Enregistrer dans Fichiers").
// Les erreurs sont propagées : l'appelant affiche les messages traduits.
export const downloadDocumentToDevice = async (
    remoteUri: string,
    fileName: string,
): Promise<DocumentDownloadResult> => {
    const extension = (extractExtension(fileName) || extractExtension(remoteUri) || '').toLowerCase();
    const safeName = fileName.replace(/[\\/:*?"<>|]/g, '_');
    const finalName = extractExtension(safeName) || !extension ? safeName : `${safeName}.${extension}`;

    const cacheFile = new File(Paths.cache, finalName);
    const downloadedFile = await File.downloadFileAsync(remoteUri, cacheFile, {idempotent: true});

    if (Platform.OS === 'android') {
        let directory: Directory;
        try {
            directory = await Directory.pickDirectoryAsync();
        } catch (error) {
            // Sélecteur fermé sans choisir de dossier
            console.log('[FileDownloadService] Sélection de dossier annulée:', error);
            return 'cancelled';
        }
        const mimeType = MIME_TYPES[extension] ?? 'application/octet-stream';
        const targetFile = directory.createFile(finalName, mimeType);
        targetFile.write(await downloadedFile.bytes());
        return 'saved';
    }

    if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Sharing unavailable');
    }
    await Sharing.shareAsync(downloadedFile.uri, {dialogTitle: finalName});
    return 'shared';
};

const FileDownloadService = {
    downloadMessageFile,
    downloadDocumentToDevice,
};

export default FileDownloadService;
