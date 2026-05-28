const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('homeoHubDesktop', {
  platform: process.platform,
  mode: 'desktop',
});

