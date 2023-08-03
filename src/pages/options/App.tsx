import {
    Button,
    Card,
    Divider,
    Flex,
    Group,
    Image,
    NavLink,
    Space,
    Stack,
    Switch,
    Tabs,
    Text,
    ThemeIcon,
    Title,
    UnstyledButton,
} from '@mantine/core';
import {AppShell, Navbar, Header} from '@mantine/core';
import {IconBackpack, IconBuildingStore, IconGitPullRequest, IconInfoCircle, IconSettings} from '@tabler/icons-react';
import {SettingsPage} from './settings/SettingsPage';
import {useState} from 'react';

const ALL_PAGE_IDS = ['settings'] as const;

type PageId = typeof ALL_PAGE_IDS[number];

const pageIdToComponent = (pageId: PageId) => {
    switch (pageId) {
        case 'settings':
            return <SettingsPage />;
    }
};

export const App = () => {
    const [activePageId, setActivePageId] = useState<PageId>('settings');

    return (
        <AppShell
            padding="md"
            navbar={
                <Navbar width={{base: 300}} p="xs">
                    <Flex direction="column" gap="xs">
                        <NavLink
                            label={<Text size="sm">Settings</Text>}
                            icon={
                                <ThemeIcon color="blue" variant="light">
                                    <IconSettings size="1rem" />
                                </ThemeIcon>
                            }
                            variant="light"
                            active={activePageId === 'settings'}
                            onClick={() => setActivePageId('settings')}
                        />
                    </Flex>
                </Navbar>
            }
            header={
                <Header height={60} p="xs">
                    <Group pl="md">
                        <Image width={160} src="https://csfloat.com/assets/full_logo.png" alt="CSFloat Logo" />
                        <Title order={2}>Market Checker</Title>
                    </Group>
                </Header>
            }
            styles={(theme) => ({
                main: {backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0]},
            })}
        >
            {pageIdToComponent(activePageId)}
        </AppShell>
    );
};
