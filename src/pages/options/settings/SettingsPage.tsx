import {Tabs} from '@mantine/core';

import {IconBuildingStore} from '@tabler/icons-react';
import {MarketSettings} from './MarketSettings';

export const SettingsPage = () => {
    return (
        <Tabs defaultValue="market">
            <Tabs.List>
                <Tabs.Tab value="market" icon={<IconBuildingStore size="0.8rem" />}>
                    Market
                </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="market" pt="xs">
                <MarketSettings />
            </Tabs.Panel>
        </Tabs>
    );
};
