import {Card, Divider, Flex, Skeleton, Space, Switch, Text, Title} from '@mantine/core';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {GetSetting, SetSetting, Settings} from '../../../settings';

export const MarketSettings = () => {
    const queryClient = useQueryClient();

    const query = useQuery({queryKey: ['3d-screenshot-buttons'], queryFn: () => GetSetting('3d-screenshot-buttons')});
    const mutation = useMutation<void, unknown, Settings['3d-screenshot-buttons']>({
        mutationFn: (value) => SetSetting('3d-screenshot-buttons', value),
        onSuccess: () => queryClient.invalidateQueries(['3d-screenshot-buttons']),
    });

    return (
        <Card>
            <Flex direction="column">
                <Title order={4}>Market Settings</Title>
                <Text fz="xs">Configure CSGOFloat Market Checker features in the market page and its listings.</Text>
            </Flex>

            <Space h="sm" />

            <Flex gap="xl">
                {query.isLoading ? (
                    <Skeleton height={8} />
                ) : (
                    <>
                        <Flex direction="column" w={500}>
                            <Title order={6}>3D/Screenshot Buttons</Title>
                            <Text fz="xs">
                                Shows buttons under a listing to quickly view 3d model or screenshot of the specific
                                item.
                            </Text>
                        </Flex>

                        <Switch checked={query.data} onChange={(e) => mutation.mutate(e.currentTarget.checked)} />
                    </>
                )}
            </Flex>
        </Card>
    );
};
