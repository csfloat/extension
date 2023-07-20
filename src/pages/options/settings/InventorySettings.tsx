import {Card, Divider, Flex, Space, Switch, Text, Title} from '@mantine/core';
import {Control, Controller} from 'react-hook-form';
import {SettingsType} from '../../../settings';

interface InventorySettingsProps {
    control: Control<SettingsType>;
}

export const InventorySettings = ({control}: InventorySettingsProps) => {
    return (
        <Card>
            <Flex direction="column">
                <Title order={4}>Inventory Settings</Title>
                <Text fz="xs">Configure CSGOFloat Market Checker features in inventories.</Text>
            </Flex>

            <Space h="sm" />

            <Flex gap="xl">
                <Flex direction="column" w={500}>
                    <Title order={6}>Paint Seed</Title>
                    <Text fz="xs">Show the paint seed of items in an inventory.</Text>
                </Flex>

                <Controller
                    control={control}
                    name="inventory.paint-seed"
                    render={({field: {value, ...rest}}) => <Switch checked={value} {...rest} />}
                />
            </Flex>
        </Card>
    );
};
