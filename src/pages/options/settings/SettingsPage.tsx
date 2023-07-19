import {Card, Divider, Flex, Space, Switch, Tabs, Text, Title} from '@mantine/core';
import {IconBackpack, IconBuildingStore} from '@tabler/icons-react';
import {MarketSettings} from './MarketSettings';
import {InventorySettings} from './InventorySettings';

export const SettingsPage = () => {
    return (
        <Tabs defaultValue="market">
            <Tabs.List>
                <Tabs.Tab value="market" icon={<IconBuildingStore size="0.8rem" />}>
                    Market
                </Tabs.Tab>
                <Tabs.Tab value="inventory" icon={<IconBackpack size="0.8rem" />}>
                    Inventory
                </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="market" pt="xs">
                <MarketSettings />
            </Tabs.Panel>

            <Tabs.Panel value="inventory" pt="xs">
                <InventorySettings />
            </Tabs.Panel>
        </Tabs>
    );
};
