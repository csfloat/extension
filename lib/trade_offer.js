
const addFloatMarketFill = async function () {
    let data;
    try {
        data = await sendMessage({ floatMarket: true });
    } catch (e) {
        return;
    }

    if (!data.trades_to_send) {
        return;
    }

    const partnerId = await retrievePartnerInfo();

    const partnerTrades = data.trades_to_send.filter(e => e.buyer_id === partnerId);

    for (const trade of partnerTrades) {
        const item = trade.contract.offering;
        const tradeNode = document.createElement('div');
        tradeNode.style.marginTop = '10px';
        tradeNode.style.marginBottom = '10px';
        tradeNode.style.padding = '15px';
        tradeNode.style.backgroundColor = '#303030';
        tradeNode.style.color = 'white';
        tradeNode.style.display = 'flex';
        tradeNode.style.justifyContent = 'space-between';
        tradeNode.style.alignItems = 'center';

        const left = document.createElement('div');
        tradeNode.appendChild(left);

        /* left content */
        const logo = document.createElement('div');
        logo.style.float = 'left';

        const logoImage = document.createElement('img');
        // TODO: Change when out of beta
        logoImage.src = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/79/798a12316637ad8fbb91ddb7dc63f770b680bd19_full.jpg';
        logoImage.style.height = '32px';
        logo.appendChild(logoImage);

        left.appendChild(logo);

        const name = document.createElement('span');
        name.style.fontSize = '18px';
        name.style.marginLeft = '15px';
        name.style.lineHeight = '32px';
        name.innerText = item.market_hash_name;
        left.appendChild(name);

        const detected = document.createElement('div');
        detected.style.paddingLeft = '45px';
        detected.style.color = 'darkgrey';
        detected.innerText = `Detected Trade (Float: ${item.float_value.toFixed(12)}, Seed: ${item.paint_seed})`;
        detected.style.color = 'darkgrey';
        left.appendChild(detected);

        /* right */
        const right = document.createElement('div');

        const autoFill = createButton('Auto-Fill', 'green');
        autoFill.addEventListener('click', () => {
            window.postMessage(
                {
                    type: 'autoFill',
                    id: item.asset_id
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

let tScript = document.createElement('script');
tScript.innerText = `
    window.addEventListener('message', (e) => {
        if (e.data.type == 'autoFill') {
            MoveItemToTrade(UserYou.findAsset(730, 2, e.data.id).element);
        }
    });
`;

document.head.appendChild(tScript);

