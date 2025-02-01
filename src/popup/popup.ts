window.addEventListener('DOMContentLoaded', async () => {
    const requestButton = document.getElementById('requestPermissions');
    if (!requestButton) {
        return;
    }

    const hasPermissions = await chrome.permissions.contains({
        origins: ['*://*.steampowered.com/*']
    });
    if (hasPermissions) {
        requestButton.children[1].textContent = 'Permissions already granted';
        requestButton.setAttribute('disabled', 'true');
    } else {
        requestButton.addEventListener('click', async () => {
            try {
                const success = await chrome.permissions.request({
                    origins: ['*://*.steampowered.com/*']
                });
                console.log('Requested permissions:', success);
            } catch (error) {
                console.error('Error requesting permissions:', error);
            }
        });
    }
});