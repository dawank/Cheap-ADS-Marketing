// electron/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronFB', {
  isDesktop: true,
  platform: process.platform,
  injectCookies: (partition, cookieString) => 
    ipcRenderer.invoke('inject-fb-cookies', { partition, cookieString }),
  setPartitionProxy: (partition, proxyRules) => 
    ipcRenderer.invoke('set-partition-proxy', { partition, proxyRules }),
  openExternal: (url) => 
    ipcRenderer.invoke('open-external-url', url),
  
  // Real Facebook Account Authentication
  autoLogin: (params) =>
    ipcRenderer.invoke('auto-login-fb', params),
  extractSession: (params) =>
    ipcRenderer.invoke('extract-fb-session', params),

  // Real Facebook Operations
  searchLiveGroups: (params) => 
    ipcRenderer.invoke('search-fb-groups', params),
  fetchMyJoinedGroups: (params) => 
    ipcRenderer.invoke('fetch-my-joined-groups', params),
  joinGroup: (params) => 
    ipcRenderer.invoke('join-fb-group', params),
  postToGroup: (params) => 
    ipcRenderer.invoke('post-to-fb-group', params),
  commentOnPost: (params) => 
    ipcRenderer.invoke('comment-on-fb-post', params),
  runHumanGroupCommentCycle: (params) => 
    ipcRenderer.invoke('run-human-group-commenting', params),
  stopAutomation: () => 
    ipcRenderer.invoke('stop-automation'),
  refreshProfile: (params) => 
    ipcRenderer.invoke('refresh-fb-profile', params),
  onAutomationLog: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('automation-log', listener);
    return () => ipcRenderer.removeListener('automation-log', listener);
  }
});
