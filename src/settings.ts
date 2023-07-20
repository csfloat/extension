export interface SettingsType {
    market: {
        '3d-screenshot-buttons': boolean;
    };
}

export const DEFAULT_SETTINGS: SettingsType = {
    market: {
        '3d-screenshot-buttons': true,
    },
};
