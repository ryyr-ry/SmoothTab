import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'Smooth Tab',
    version: '2.0.0',
    description: '__MSG_extensionDescription__',
    author: { email: 'ryyr_ry' },
    default_locale: 'en',
    permissions: ['storage', 'scripting', 'alarms'],
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
});
