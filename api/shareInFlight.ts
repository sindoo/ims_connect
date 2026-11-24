/**
 * Partage d'un appel déjà en cours : si plusieurs écrans demandent la même donnée
 * au même instant (ex. les 3 onglets Scolarité qui se montent ensemble), un seul
 * appel part au serveur et tous reçoivent sa réponse.
 *
 * Aucun cache : dès que l'appel est terminé (succès ou erreur), l'entrée est
 * supprimée. Un appel fait plus tard repart donc toujours au serveur, la donnée
 * ne peut pas être périmée.
 *
 * Chaque appelant reçoit sa propre copie (superficielle) du résultat : un écran
 * qui trierait ou modifierait la liste reçue n'altère pas ce que voient les autres.
 */
const inFlight = new Map<string, Promise<any>>();

const copyResult = (result: any): any => {
  if (Array.isArray(result)) return [...result];
  if (result !== null && typeof result === 'object') return {...result};
  return result;
};

export const shareInFlight = <T = any>(key: string, load: () => Promise<T>): Promise<T> => {
  let pending = inFlight.get(key);
  if (!pending) {
    pending = load().finally(() => {
      inFlight.delete(key);
    });
    inFlight.set(key, pending);
  }
  return pending.then(copyResult);
};
