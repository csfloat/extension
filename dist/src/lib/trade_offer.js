/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
const getLogoEl = function () {
    const logo = document.createElement('div');
    logo.style.float = 'left';
    const logoImage = document.createElement('img');
    logoImage.src = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/79/798a12316637ad8fbb91ddb7dc63f770b680bd19_full.jpg';
    logoImage.style.height = '32px';
    logo.appendChild(logoImage);
    return logo;
};

const createBanner = function (backgroundColor) {
    const banner = document.createElement('div');
    banner.style.marginTop = '10px';
    banner.style.marginBottom = '10px';
    banner.style.padding = '15px';
    banner.style.backgroundColor = backgroundColor;
    banner.style.color = 'white';
    banner.style.display = 'flex';
    banner.style.justifyContent = 'space-between';
    banner.style.alignItems = 'center';
    return banner;
};

const showWarning = function () {
    const tradeNode = createBanner('#b30000');

    const content = document.createElement('div');
    tradeNode.appendChild(content);

    content.appendChild(getLogoEl());

    const name = document.createElement('span');
    name.style.fontSize = '18px';
    name.style.marginLeft = '15px';
    name.style.lineHeight = '32px';
    name.style.fontWeight = 'bold';
    name.innerText = 'Warning!';
    content.appendChild(name);

    const detected = document.createElement('div');
    detected.style.paddingLeft = '45px';
    detected.style.color = 'darkgrey';
    detected.innerText = `Some of the items in the offer were not purchased from you on CSGOFloat Market (or you're logged into the wrong account)`;
    content.appendChild(detected);

    const tradeArea = document.querySelector('.trade_area');

    tradeArea.parentNode.insertBefore(tradeNode, tradeArea);
};

const showValidated = function f() {
    const tradeNode = createBanner('#006700');

    const content = document.createElement('div');
    tradeNode.appendChild(content);

    content.appendChild(getLogoEl());

    const name = document.createElement('span');
    name.style.fontSize = '18px';
    name.style.marginLeft = '15px';
    name.style.lineHeight = '32px';
    name.style.fontWeight = 'bold';
    name.innerText = 'Trade Validated';
    content.appendChild(name);

    const detected = document.createElement('div');
    detected.style.paddingLeft = '45px';
    detected.style.color = 'darkgrey';
    detected.innerText = `All of the items you're sending correspond to a CSGOFloat purchase`;
    detected.style.color = 'darkgrey';
    content.appendChild(detected);

    const tradeArea = document.querySelector('.trade_area');

    tradeArea.parentNode.insertBefore(tradeNode, tradeArea);
};

const addAutoFill = function (trades, tradeStatus, isSeller) {
    const type = isSeller ? 'Sale' : 'Purchase';

    for (const trade of trades) {
        // TODO: Remove backwards compatibility once rolled out
        const item = trade.contract.offering || trade.contract.item;

        if (tradeStatus.them.assets.find(e => e.assetid == item.asset_id)) {
            // They are viewing an offer sent to them that already has the item included
            continue;
        }

        const tradeNode = createBanner('#303030');

        const left = document.createElement('div');
        tradeNode.appendChild(left);

        left.appendChild(getLogoEl());

        const name = document.createElement('span');
        name.style.fontSize = '18px';
        name.style.marginLeft = '15px';
        name.style.lineHeight = '32px';
        name.innerText = item.market_hash_name;
        left.appendChild(name);

        const detected = document.createElement('div');
        detected.style.paddingLeft = '45px';
        detected.style.color = 'darkgrey';
        detected.innerText = `Detected ${type} (Float: ${item.float_value.toFixed(12)}, Seed: ${item.paint_seed})`;
        detected.style.color = 'darkgrey';
        left.appendChild(detected);

        /* right */
        const right = document.createElement('div');

        const autoFill = createButton('Auto-Fill', 'green');
        autoFill.addEventListener('click', () => {
            window.postMessage(
                {
                    type: 'autoFill',
                    id: item.asset_id,
                    isSeller
                },
                '*'
            );

            document.getElementById('trade_offer_note').value = `CSGOFloat Market Trade Offer #${trade.id} \n\nThanks for using CSGOFloat!`;
        });

        right.appendChild(autoFill);
        tradeNode.appendChild(right);

        const tradeArea = document.querySelector('.trade_area');
        tradeArea.parentNode.insertBefore(tradeNode, tradeArea);
    }
};

const addFloatMarketFill = async function () {
    let data;
    try {
        data = await sendMessage({ floatMarket: true });
    } catch (e) {
        return;
    }

    if (!data.trades_to_send) {
        // Must be logged out of CSGOFloat
        return;
    }

    const partnerId = await retrievePartnerInfo();

    const partnerTrades = data.trades_to_send.filter(e => e.buyer_id === partnerId);
    const tradeStatus = await retrieveTradeStatus();

    if (tradeStatus.me.assets.length > 0) {
        let hasAutofillText = false;

        const tradeMessages = document.getElementsByClassName("included_trade_offer_note_ctn");
        if (tradeMessages.length > 0) {
            const sanitized = tradeMessages[0].innerText.trim().replace(/ /g, '').toLowerCase();

            // TODO: Use edit-distance
            hasAutofillText = sanitized.includes('csgofloat') || sanitized.includes('floatmarket');
        }

        // Whether all items match a csgofloat purchase from this seller (this account)
        let allItemsMatch = true;

        for (const item of tradeStatus.me.assets) {
            const hasTrade = partnerTrades.find(e => (e.contract.offering || e.contract.item).asset_id === item.assetid);

            if (!hasTrade) {
                allItemsMatch = false;
                break;
            }
        }

        if (allItemsMatch) {
            showValidated();
        } else if (hasAutofillText) {
            // Only show warning if we find csgofloat related text in the description
            // Otherwise we'd show a warning on every non-csgofloat trade offer
            showWarning();
        }
    }

    addAutoFill(partnerTrades, tradeStatus, true);

    // Auto-fill for buyers
    addAutoFill(data.trades_to_receive.filter(e => e.seller_id === partnerId), tradeStatus, false);
};

let tScript = document.createElement('script');
tScript.innerText = `
    window.addEventListener('message', (e) => {
        if (e.data.type == 'autoFill') {
            if (e.data.isSeller) {
                $J('#inventory_select_your_inventory').click();
                MoveItemToTrade(UserYou.findAsset(730, 2, e.data.id).element);
            } else {
                $J('#inventory_select_their_inventory').click();

                /* Make sure their inventory is loaded first (it is dynamically loaded when the tab is clicked) */
                const fetchEl = setInterval(() => {
                    const item = UserThem.findAsset(730, 2, e.data.id);
                    if (item) {
                        clearInterval(fetchEl);
                        MoveItemToTrade(UserThem.findAsset(730, 2, e.data.id).element);
                    }
                }, 250);
            }
        }
    });
`;

document.head.appendChild(tScript);


/******/ })()
;