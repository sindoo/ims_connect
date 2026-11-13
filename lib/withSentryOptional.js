// Active le plugin Expo de Sentry (envoi des source maps et des symboles
// natifs pendant les builds Release) uniquement quand l'organisation et le
// projet Sentry sont renseignés dans app.json > extra.sentry.
// Tant qu'ils sont vides, les builds ne sont pas modifiés.
module.exports = function withSentryOptional(config) {
  const { organization, project, url } = (config.extra && config.extra.sentry) || {};

  if (!organization || !project) {
    console.warn(
      '[Sentry] extra.sentry.organization / project non renseignés dans app.json : ' +
        'envoi des source maps désactivé.'
    );
    return config;
  }

  const { withSentry } = require('@sentry/react-native/expo');
  return withSentry(config, {
    organization,
    project,
    url: url || 'https://sentry.io/',
  });
};
