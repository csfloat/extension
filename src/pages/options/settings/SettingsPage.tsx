import {Loader} from '@mantine/core';
import {useEffect, useState} from 'react';
import {DEFAULT_SETTINGS, SettingsType} from '../utils';
import {SettingsForm} from './SettingsForm';

export const SettingsPage = () => {
    const [settings, setSettings] = useState<SettingsType>();

    useEffect(() => {
        try {
            chrome.storage.local.get('csgofloat-settings', (data) => {
                const existingSettings = data['csgofloat-settings'] || {};

                setSettings({...DEFAULT_SETTINGS, ...existingSettings} as SettingsType);
            });
        } catch {
            setSettings(DEFAULT_SETTINGS);
        }
    }, []);

    if (settings === undefined) {
        return <Loader />;
    }

    return <SettingsForm settings={settings} />;
};
