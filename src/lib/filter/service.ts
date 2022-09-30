import {GLOBAL_FILTERS, StorageRow} from "../storage/keys";
import {InternalInputVars, SerializedFilter} from "./types";
import {Get} from "../bridge/handlers/storage_get";
import {Filter} from "./filter";
import {Set} from "../bridge/handlers/storage_set";
import {ItemInfo} from "../bridge/handlers/fetch_inspect_info";
import {rangeFromWear} from "../utils/skin";
import {getDopplerPhase} from "../utils/dopplers";
import {ReplaySubject} from "rxjs";
import {debounce} from "lodash-decorators";
import {averageColour} from "./utils";


/**
 * Provides state for
 */
class FilterService {
    private filters: Filter[] = [];
    private itemRow: StorageRow<SerializedFilter[]> | undefined;
    /* Send last value upon subscription */
    private onUpdate = new ReplaySubject<Filter[]>(1);
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
        this.itemRow = row;
        this.onUpdate.next(this.filters);
    }

    getFilters(): Filter[] {
        return this.filters;
    }

    matchColour(info: ItemInfo, price?: number): string|null {
        const wearRange = rangeFromWear(info.floatvalue) || [0, 1];

        const vars: InternalInputVars = {
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

        if (price) {
            vars.price = price;
        }

        const colours = this.filters.filter(e => e.run(vars)).map(e => e.getColour());
        if (colours.length === 0) {
            return null;
        }

        return averageColour(colours);
    }

    remove(filter: Filter) {
        this.filters = this.filters.filter(f => !f.equals(filter));
        this.save();
        this.onUpdate.next(this.filters);
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

    // Prevent spamming and hitting MAX_WRITE_OPERATIONS_PER_MINUTE
    @debounce(500)
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
