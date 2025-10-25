import {CInventory, CAppwideInventory} from '../types/steam';

export function defined(t: string): boolean {
    return t !== 'undefined';
}

export function isCAppwideInventory(inventory: CInventory | CAppwideInventory): inventory is CAppwideInventory {
    return 'm_rgChildInventories' in inventory;
}
