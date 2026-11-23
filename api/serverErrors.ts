import i18next from 'i18next';

/**
 * Correspondance entre les erreurs renvoyées par l'API (dictionnaire des codes
 * d'erreur du backend) et un message clair pour le parent.
 *
 * Réponse d'erreur du serveur : { code, codeMessage, message, errorDetails, guid }.
 *  - `code` (alias `codeMessage`) : catégorie stable (NOT_FOUND, CONSTRAINT_VIOLATION…)
 *  - `message` : libellé applicatif précis (RDV_NOT_FOUND, SPACE_CLOSE…)
 * Un même code recouvre plusieurs causes : on regarde donc d'abord `message`
 * (précis), puis un motif de message, puis `code` (générique).
 *
 * Règle de sécurité : tout ce qui n'est pas listé ici retourne null, et l'appelant
 * garde alors son message habituel. Ajouter une entrée ne change que le texte
 * affiché pour cette erreur précise.
 */

// Valeurs = clés de traduction (locales/fr.json, en.json).
const BY_MESSAGE: Record<string, string> = {
  // Rendez-vous
  RDV_DATE_NOT_FREE: 'allAppointment.rdv_date_not_free',
  RDV_PARENT_DATE_NOT_FREE: 'serverErrors.rdv_parent_date_not_free',
  RDV_EMPLOYEE_DATE_NOT_FREE: 'serverErrors.rdv_employee_date_not_free',
  RDV_NOT_FOUND: 'serverErrors.rdv_not_found',
  RDV_CANCELED_EDITION_LOCKED: 'serverErrors.rdv_canceled',
  APPOINTMENT_ALREADY_PAST: 'serverErrors.rdv_already_past',
  PARENT_ALREADY_CHOSE: 'serverErrors.parent_already_chose',
  CANCEL_NOT_PERMIT_FOR_THIS_PARENT: 'serverErrors.rdv_not_yours',
  THIS_PARENT_IS_NOT_RDV_ACTOR: 'serverErrors.rdv_not_yours',
  PARENT_NOT_OWN_THIS_CHOICE: 'serverErrors.rdv_not_yours',
  CRENEAU_ENFANT_PARENT_NOT_MATCHED: 'serverErrors.rdv_not_yours',
  DELETE_NOT_PERMIT_FOR_THIS_APPOINTMENT: 'serverErrors.rdv_delete_not_permitted',
  DELETE_NOT_PERMIT_YOU_ARE_NOT_OWNER: 'serverErrors.rdv_delete_not_owner',
  PARENT_NOT_REPLY_YET: 'serverErrors.rdv_other_not_replied',
  EMPLOYEE_NOT_REPLY_YET: 'serverErrors.rdv_other_not_replied',

  // Messagerie
  SPACE_CLOSE: 'serverErrors.space_closed',
  SPACE_NOT_FOUND: 'serverErrors.space_not_found',
  SPACE_CLOSE_PERMISSION_NOT_ALLOWED: 'serverErrors.space_close_not_allowed',
  SPACE_DELETE_PERMISSION_NOT_ALLOWED: 'serverErrors.space_delete_not_allowed',

  // Mini-club
  ENFANT_DEJA_INSCRIT: 'serverErrors.child_already_registered',

  // Bibliothèque
  BOOK_ALREADY_LOAN: 'serverErrors.book_already_loan',
  NOT_ENOUGH_BOOK_IN_STORE: 'more.book_not_available',
  BOOK_IS_LOAN_AND_CANNOT_BE_DELETED: 'serverErrors.book_loan_cannot_delete',
  BOOK_ALREADY_LOANED_BY_YOU: 'serverErrors.book_loan_confirmed',
  LIVRE_NOT_FOUND: 'serverErrors.book_not_found',
  LOAN_NOT_FOUND: 'serverErrors.book_not_found',

  // Sondages
  SONDAGE_IS_CLOSED: 'serverErrors.survey_closed',

  // Compte
  USERNAME_ALREADY_EXISTS: 'serverErrors.username_already_exists',
  LE_NOUVEAU_MOT_DE_PASSE_EST_INVALIDE: 'serverErrors.new_password_invalid',
  LE_NOUVEAU_USERNAME_EST_INVALIDE: 'serverErrors.username_invalid',
  LE_USERNAME_EST_INVALIDE: 'serverErrors.username_invalid',
};

// Repli par catégorie, uniquement pour les codes dont le sens est sans ambiguïté.
// NOT_FOUND, BAD_REQUEST, ILLEGAL_ARGUMENT, CONSTRAINT_VIOLATION, SIZE_EXCEPTION…
// sont volontairement absents : trop génériques, l'appelant garde son message.
const BY_CODE: Record<string, string> = {
  ACCOUNT_JWT_LOCKED: 'serverErrors.account_locked',
  ACCOUNT_JWT_DISABLED: 'serverErrors.account_disabled',
  ACCOUNT_JWT_EXPIRED: 'serverErrors.account_expired',
  PERMISSION_EXCEPTION: 'serverErrors.permission_denied',
  FORBIDEN_ACCESS: 'serverErrors.permission_denied',
  DEADLINE_EXCEEDED: 'snackBar.sb_error_deadline_exceeded',
  CANCELED: 'serverErrors.rdv_canceled',
  NUMBER_CHOICE_EXCEEDED: 'serverErrors.choice_exceeded',
  VALIDATION_ERROR: 'serverErrors.validation_error',
  SQL_EXCEPTION: 'serverErrors.data_conflict',
  SERVICE_UNAVAILABLE: 'snackBar.sb_server_unreachable',
  GONE_EXCEPTION: 'serverErrors.file_gone',
  STORAGE_EXCEPTION: 'serverErrors.storage_failed',
  RDV_DATE_NOT_FREE: 'allAppointment.rdv_date_not_free',
  RDV_PARENT_DATE_NOT_FREE: 'serverErrors.rdv_parent_date_not_free',
  RDV_EMPLOYEE_DATE_NOT_FREE: 'serverErrors.rdv_employee_date_not_free',
  USERNAME_ALREADY_EXISTS: 'serverErrors.username_already_exists',
  SPACE_NOT_FOUND: 'serverErrors.space_not_found',
  SPACE_CLOSE_PERMISSION_NOT_ALLOWED: 'serverErrors.space_close_not_allowed',
  SPACE_DELETE_PERMISSION_NOT_ALLOWED: 'serverErrors.space_delete_not_allowed',
};

export interface ServerErrorInfo {
  code?: string;
  message?: string;
}

// Lit { code, message } de la réponse d'erreur, quelle que soit sa forme
// (corps absent, texte brut, gateway sans guid…).
export const getServerError = (error: any): ServerErrorInfo => {
  const data = error?.response?.data;
  if (!data || typeof data !== 'object') return {};
  const rawCode = data.codeMessage ?? data.code;
  return {
    code: typeof rawCode === 'string' ? rawCode : undefined,
    message: typeof data.message === 'string' ? data.message : undefined,
  };
};

// Motifs de messages construits à l'exécution par le serveur.
const keyFromPattern = (code?: string, message?: string): string | undefined => {
  if (!message) return undefined;
  // « PRESET_CHOICE_EXCEED_<limite> »
  if (message.startsWith('PRESET_CHOICE_EXCEED_')) return 'serverErrors.choice_exceeded';
  // « <STATUT>_NOT_ALLOW », « …_FOR_CANCEL_RDV », « …_FOR_CONFIRM_RDV »
  if (code === 'CONSTRAINT_VIOLATION' && message.includes('_NOT_ALLOW')) {
    return 'serverErrors.rdv_action_not_allowed';
  }
  return undefined;
};

/**
 * Message utilisateur pour une erreur serveur connue, sinon null.
 * `onlyCodes` : restreint à certains codes (ex. écran de connexion).
 */
export const serverErrorMessage = (error: any, onlyCodes?: string[]): string | null => {
  const {code, message} = getServerError(error);
  if (!code && !message) return null;
  if (onlyCodes && !(code && onlyCodes.includes(code))) return null;

  const key =
      (message && BY_MESSAGE[message]) ||
      keyFromPattern(code, message) ||
      (code && BY_CODE[code]) ||
      undefined;
  if (!key) return null;

  const text = i18next.t(key);
  // Clé de traduction manquante : on ne montre jamais la clé brute à l'utilisateur.
  return text && text !== key ? text : null;
};
