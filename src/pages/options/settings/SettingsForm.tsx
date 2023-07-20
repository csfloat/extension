import {Tabs} from '@mantine/core';
import {IconBackpack, IconBuildingStore} from '@tabler/icons-react';
import {useForm} from 'react-hook-form';
import {useEffect} from 'react';
import {MarketSettings} from './MarketSettings';
import {InventorySettings} from './InventorySettings';
import {SettingsType} from '../../../settings';
import {gStore} from '../../../lib/storage/store';
import {StorageKey} from '../../../lib/storage/keys';

interface SettingsFormProps {
    settings: SettingsType;
}

export const SettingsForm = ({settings}: SettingsFormProps) => {
    const {
        handleSubmit,
        control,
        formState: {isDirty},
        reset,
    } = useForm<SettingsType>({
        defaultValues: settings,
    });

    useEffect(() => {
        if (isDirty) {
            handleSubmit((data) => {
                gStore.set<SettingsType>(StorageKey.SETTINGS, data);
                reset(data);
            })();
        }
    }, [isDirty]);

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
                <MarketSettings control={control} />
            </Tabs.Panel>

            <Tabs.Panel value="inventory" pt="xs">
                <InventorySettings control={control} />
            </Tabs.Panel>
        </Tabs>
    );
};
