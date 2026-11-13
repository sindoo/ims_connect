const fs = require('fs');
const path = require('path');
const { withFinalizedMod } = require('@expo/config-plugins');

/**
 * Numéros de version INDÉPENDANTS pour l'App Store et le Play Store.
 *
 * Source : "expo.extra.storeVersions" dans app.json
 *   ios     : { version, buildNumber }   -> MARKETING_VERSION / CURRENT_PROJECT_VERSION
 *   android : { version, versionCode }   -> versionName / versionCode
 *
 * Appliqué en toute fin de prebuild (mod "finalized"), donc après la version
 * commune "expo.version" : plus besoin de retoucher les fichiers natifs à la main.
 */
function withStoreVersions(config) {
    const versions = (config.extra && config.extra.storeVersions) || {};

    config = withFinalizedMod(config, [
        'ios',
        async (cfg) => {
            const ios = versions.ios;
            if (!ios) return cfg;
            const iosRoot = cfg.modRequest.platformProjectRoot;
            const projectDir = fs.readdirSync(iosRoot).find((name) => name.endsWith('.xcodeproj'));
            if (!projectDir) return cfg;
            const file = path.join(iosRoot, projectDir, 'project.pbxproj');
            let content = fs.readFileSync(file, 'utf8');
            if (ios.version) {
                content = content.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${ios.version};`);
            }
            if (ios.buildNumber) {
                content = content.replace(
                    /CURRENT_PROJECT_VERSION = [^;]+;/g,
                    `CURRENT_PROJECT_VERSION = ${ios.buildNumber};`,
                );
            }
            fs.writeFileSync(file, content);

            // Info.plist : Expo y écrit en dur la version commune (expo.version) et
            // "1" comme build ; ces valeurs l'emportent sur le projet Xcode.
            // On les aligne sur la version propre à iOS.
            const plistDirs = fs
                .readdirSync(iosRoot, { withFileTypes: true })
                .filter((entry) => entry.isDirectory() && entry.name !== 'Pods' && entry.name !== 'build')
                .map((entry) => path.join(iosRoot, entry.name, 'Info.plist'))
                .filter((plist) => fs.existsSync(plist));
            plistDirs.forEach((plist) => {
                let xml = fs.readFileSync(plist, 'utf8');
                if (ios.version) {
                    xml = xml.replace(
                        /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/,
                        `$1${ios.version}$2`,
                    );
                }
                if (ios.buildNumber) {
                    xml = xml.replace(
                        /(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/,
                        `$1${ios.buildNumber}$2`,
                    );
                }
                fs.writeFileSync(plist, xml);
            });
            return cfg;
        },
    ]);

    config = withFinalizedMod(config, [
        'android',
        async (cfg) => {
            const android = versions.android;
            if (!android) return cfg;
            const file = path.join(cfg.modRequest.platformProjectRoot, 'app', 'build.gradle');
            if (!fs.existsSync(file)) return cfg;
            let content = fs.readFileSync(file, 'utf8');
            if (android.versionCode) {
                content = content.replace(/versionCode \d+/, `versionCode ${android.versionCode}`);
            }
            if (android.version) {
                content = content.replace(/versionName "[^"]*"/, `versionName "${android.version}"`);
            }
            fs.writeFileSync(file, content);
            return cfg;
        },
    ]);

    return config;
}

module.exports = withStoreVersions;
