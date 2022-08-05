const constructDynamicBanner = async function(skinPrice, props) {
    const csmoneyDiv = document.createElement('div');
    csmoneyDiv.id = 'floatBanner';
    csmoneyDiv.style.padding = '12px 10px 12px 10px';

    const moneyButton = document.createElement('a');
    const moneyLogo = document.createElement('img');
    moneyLogo.src = 'https://cs.money/svg/logo.svg';
    moneyLogo.height = 32;

    const staticText = document.createElement('span');
    staticText.innerText = 'Get this skin on ';
    staticText.style.verticalAlign = 'bottom';

    const priceText = document.createElement('span');
    const price = document.createElement('span');
    price.innerText = `$${(skinPrice || 0).toFixed(2)}`;
    price.style.fontWeight = 'bold';
    price.style.verticalAlign = 'bottom';

    priceText.appendChild(price);
    priceText.insertAdjacentText('afterbegin', ' for ');
    priceText.insertAdjacentText('beforeend', ' USD');

    priceText.style.verticalAlign = 'bottom';

    if (!skinPrice) {
        priceText.innerText = '';
    }

    moneyButton.appendChild(staticText);
    moneyButton.appendChild(moneyLogo);
    moneyButton.appendChild(priceText);
    moneyButton.classList.add('float-money-button');
    csmoneyDiv.appendChild(moneyButton);

    moneyButton.target = '_blank';
    moneyButton.href = props.link || 'https://cs.money/?utm_source=sponsorship&utm_medium=csgoflt&utm_campaign=csgofloat&utm_content=link';

    return csmoneyDiv;
}

const constructBannerImage = async function(props) {
    const bannerDiv = document.createElement('div');
    bannerDiv.id = 'floatBanner';

    const link = document.createElement('a');
    link.href = props.link;
    link.target = '_blank';

    const bannerLogo = document.createElement('img');
    bannerLogo.src = props.src;
    bannerLogo.height = props.height;

    link.appendChild(bannerLogo);
    bannerDiv.appendChild(link);

    return bannerDiv;
}
