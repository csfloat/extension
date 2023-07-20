import {Card, Divider, Flex, Space, Switch, Text, Title} from '@mantine/core';
import {Control, Controller} from 'react-hook-form';
import {SettingsType} from '../utils';

interface MarketSettingsProps {
    control: Control<SettingsType>;
}

export const MarketSettings = ({control}: MarketSettingsProps) => {
    return (
        <Card>
            <Flex direction="column">
                <Title order={4}>Market Settings</Title>
                <Text fz="xs">Configure CSGOFloat Market Checker features in the market page and its listings.</Text>
            </Flex>

            <Space h="sm" />

            <Flex gap="xl">
                <Flex direction="column" w={500}>
                    <Title order={6}>3D/Screenshot Buttons</Title>
                    <Text fz="xs">
                        Shows buttons under a listing to quickly view 3d model or screenshot of the specific item.
                    </Text>
                </Flex>

                <Controller
                    control={control}
                    name="market.3d-screenshot-buttons"
                    render={({field: {value, ...rest}}) => <Switch checked={value} {...rest} />}
                />
            </Flex>

            <Divider my="sm" />

            <Flex gap="xl">
                <Flex direction="column" w={500}>
                    <Title order={6}>Smart Filter/Sort</Title>
                    <Text fz="xs">Shows the smart filter and sort buttons in a listing.</Text>
                </Flex>

                <Controller
                    control={control}
                    name="market.smart-filter-sort"
                    render={({field: {value, ...rest}}) => <Switch checked={value} {...rest} />}
                />
            </Flex>
        </Card>
    );
};
