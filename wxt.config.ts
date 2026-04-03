import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'Smooth Tab',
    version: '0.1.0',
    description: '__MSG_extensionDescription__',
    author: 'ryyr_ry',
    default_locale: 'en',
    permissions: ['storage', 'scripting', 'alarms'],
    browser_specific_settings: {
      gecko: {
        id: 'smooth-tab@ryyr-ry',
        strict_min_version: '109.0',
        data_collection_permissions: {
          required: false,
        },
      },
    },
    host_permissions: ['http://*/*', 'https://*/*'],
    icons: {
      '48': 'icons/icon-48.png',
      '96': 'icons/icon-96.png',
      '128': 'icons/icon-128.png',
    },
    action: {
      default_icon: {
        '20': 'icons/icon-20.png',
        '48': 'icons/icon-48.png',
      },
      default_title: '__MSG_extensionName__',
    },
  },
  webExt: {
    firefoxPref: {
      'intl.locale.requested': 'ja',
    },
  },
});
