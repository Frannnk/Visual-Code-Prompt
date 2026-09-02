chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'RUNTIME_CODE_MODE_TOGGLE' });
  } catch (error) {
    console.warn('Unable to toggle runtime code mode:', error);
  }
});
