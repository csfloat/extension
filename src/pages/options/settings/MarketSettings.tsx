import {Card, Divider, Flex, Space, Switch, Text, Title} from '@mantine/core';

export const MarketSettings = () => {
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
                <Switch />
            </Flex>

            <Divider my="sm" />

            <Flex gap="xl">
                <Flex direction="column" w={500}>
                    <Title order={6}>Smart Filter/Sort</Title>
                    <Text fz="xs">Shows the smart filter and sort buttons in a listing.</Text>
                </Flex>
                <Switch />
            </Flex>
        </Card>
    );
};
