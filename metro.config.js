// Configuration Metro par défaut d'Expo + identifiants de debug Sentry
// (nécessaires pour relier les erreurs de production au code source).
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
