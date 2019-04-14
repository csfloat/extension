window.onload = function() {
    const url = new URL(location.href);
    const iframe = document.getElementById('model-frame');
    iframe.src = decodeURI(url.searchParams.get('url'));
};
