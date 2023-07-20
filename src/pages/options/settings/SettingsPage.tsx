import {Loader} from '@mantine/core';
import {useEffect, useState} from 'react';

import {SettingsForm} from './SettingsForm';
import {DEFAULT_SETTINGS, SettingsType} from '../../../settings';
import {gStore} from '../../../lib/storage/store';
import {StorageKey} from '../../../lib/storage/keys';

export const SettingsPage = () => {
    const [settings, setSettings] = useState<SettingsType>();

    useEffect(() => {
        gStore
            .get<SettingsType>(StorageKey.SETTINGS)
            .then((settings) => setSettings({...DEFAULT_SETTINGS, ...(settings || {})}))
            .catch(() => setSettings(DEFAULT_SETTINGS));
    }, []);

    if (settings === undefined) {
        return <Loader />;
    }

    return <SettingsForm settings={settings} />;
};
