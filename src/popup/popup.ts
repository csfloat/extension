document.getElementById('requestPermissions')?.addEventListener('click', async () => {
    try {
        const success = await chrome.permissions.request({
            origins: ['*://*.steampowered.com/*']
        });
        console.log('Requested permissions:', success);
    } catch (error) {
        console.error('Error requesting permissions:', error);
    }
});