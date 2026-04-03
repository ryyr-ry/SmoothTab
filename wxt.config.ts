import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'Smooth Tab',
    version: '0.1.0',
    description: '__MSG_extensionDescription__',
    // WXT の型定義が author を string として受け付けないため as any が必要
    author: 'ryyr_ry' as any,
    default_locale: 'en',
    permissions: ['storage', 'scripting', 'alarms'],
    browser_specific_settings: {
      gecko: {
        id: 'smooth-tab@ryyr-ry',
        strict_min_version: '142.0',
        data_collection_permissions: {
          required: ['none'],
        },
      // WXT の gecko 型定義が data_collection_permissions を含まないため as any が必要
      } as any,
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
