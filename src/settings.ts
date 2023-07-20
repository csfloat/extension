export interface SettingsType {
    market: {
        '3d-screenshot-buttons': boolean;
        'smart-filter-sort': boolean;
    };
    inventory: {
        'paint-seed': boolean;
    };
}

export const DEFAULT_SETTINGS: SettingsType = {
    market: {
        '3d-screenshot-buttons': true,
        'smart-filter-sort': true,
    },
    inventory: {
        'paint-seed': true,
    },
};
