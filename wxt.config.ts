import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'Smooth Tab',
    version: '0.1.0',
    description: '__MSG_extensionDescription__',
    // @ts-expect-error WXT の型定義が author を string フィールドとして持たない
    author: 'ryyr_ry',
    default_locale: 'en',
    permissions: ['storage', 'scripting', 'alarms'],
    browser_specific_settings: {
      gecko: {
        id: 'smooth-tab@ryyr-ry',
        strict_min_version: '142.0',
        // @ts-expect-error Firefox AMO 要件だが WXT の gecko 型定義に未定義
        data_collection_permissions: {
          required: ['none'],
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
    // 開発時のみ: Firefox のUIロケールを日本語に設定
    firefoxPref: {
      'intl.locale.requested': 'ja',
    },
  },
});
