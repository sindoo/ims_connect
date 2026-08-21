const { withAndroidManifest } = require('@expo/config-plugins');

const CONFLICTING_META_DATA = [
    'com.google.firebase.messaging.default_notification_color',
    'com.google.firebase.messaging.default_notification_icon',
];

module.exports = function withFcmNotificationMetaFix(config) {
    return withAndroidManifest(config, (config) => {
        const manifest = config.modResults.manifest;

        if (!manifest.$['xmlns:tools']) {
            manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
        }

        const application = manifest.application[0];
        const metaDataList = application['meta-data'] || [];

        metaDataList.forEach((item) => {
            if (CONFLICTING_META_DATA.includes(item.$['android:name'])) {
                item.$['tools:replace'] = 'android:resource';
            }
        });

        return config;
    });
};
