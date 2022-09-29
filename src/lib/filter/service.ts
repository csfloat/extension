import {GLOBAL_FILTERS, StorageRow} from "../storage/keys";
import {SerializedFilter} from "./types";
import {Get} from "../bridge/handlers/storage_get";
import {Filter} from "./filter";
import {Set} from "../bridge/handlers/storage_set";
import {ItemInfo} from "../bridge/handlers/fetch_inspect_info";
import {rangeFromWear} from "../utils/skin";
import {getDopplerPhase} from "../utils/dopplers";
import {Subject} from "rxjs";


/**
 * Provides state for
 */
class FilterService {
    private filters: Filter[] = [];
    private itemRow: StorageRow<SerializedFilter[]> | undefined;
    private onUpdate = new Subject<Filter[]>();
    onUpdate$ = this.onUpdate.asObservable();

    constructor() {}

    /**
     * Initializes the service for the given item storage key
     *
     * This should be called before any other method
     */
    async initialize(row: StorageRow<SerializedFilter[]>) {
        const globalFilters = (await Get(GLOBAL_FILTERS)) || [];
        const itemFilters = (await Get(row)) || [];
        this.filters = globalFilters.concat(itemFilters).map(e => Filter.from(e));
        this.onUpdate.next(this.filters);
    }

    getFilters(): Filter[] {
        return this.filters;
    }

    matchColour(info: ItemInfo): string|null {
        const wearRange = rangeFromWear(info.floatvalue) || [0, 1];

        const vars = {
            float: info.floatvalue,
            seed: info.paintseed,
            minfloat: info.min,
            maxfloat: info.max,
            minwearfloat: wearRange[0],
            maxwearfloat: wearRange[1],
            phase: (getDopplerPhase(info.paintindex) || '').replace('Phase', '').trim(),
            low_rank: info.low_rank!,
            high_rank: info.high_rank!
        };

        for (const filter of this.filters) {
            if (filter.run(vars)) {
                return filter.getColour();
            }
        }

        return null;
    }

    upsert(filter: Filter) {
        const existingIndex = this.filters.findIndex((f) => f.equals(filter));
        if (existingIndex === -1) {
            // Doesn't already exist, insert
            this.filters.push(filter);
        } else {
            this.filters[existingIndex] = filter;
        }

        this.save();
        this.onUpdate.next(this.filters);
    }

    private async save() {
        if (!this.itemRow) {
            throw new Error('cannot save filters without being initialized');
        }

        const gFilters = this.filters.filter(f => f.getIsGlobal()).map(f => f.serialize());

        await Set(GLOBAL_FILTERS, gFilters);

        const iFilters = this.filters.filter(f => !f.getIsGlobal()).map(f => f.serialize());

        // TODO: If this is an empty array, we can just delete the key
        await Set(this.itemRow, iFilters);

    }
}

export const gFilterService = new FilterService();
