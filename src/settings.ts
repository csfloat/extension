import {StorageKey} from './lib/storage/keys';
import {gStore} from './lib/storage/store';

export interface Settings {
    '3d-screenshot-buttons': boolean;
}

export type StoredSettings = Partial<Settings>;

export const DEFAULT_SETTINGS: Settings = {
    '3d-screenshot-buttons': true,
};

export const GetStoredSettings = async () => {
    const settings = await gStore.get<StoredSettings>(StorageKey.SETTINGS);

    if (settings !== null) {
        return settings;
    }

    await gStore.set<StoredSettings>(StorageKey.SETTINGS, {});

    return {};
};

export const GetSetting = async (name: keyof Settings) => {
    const settings = await GetStoredSettings();

    const value = settings[name];

    return value !== undefined ? value : DEFAULT_SETTINGS[name];
};

export const SetSetting = async <T extends keyof Settings>(name: T, value: Settings[T]) => {
    const settings = await GetStoredSettings();

    await gStore.set<StoredSettings>(StorageKey.SETTINGS, {...settings, [name]: value});
};
