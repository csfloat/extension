import {nothing} from 'lit';
import {property} from 'lit/decorators.js';
import type {Subscription} from 'rxjs';
import {CustomElement, InjectIntoScope} from '../../injectors';
import {FloatElement} from '../../custom';
import {gFilterService} from '../../../services/filter';
import {pickTextColour} from '../../../utils/colours';
import {ReactMarketListingScope, type ReactListingContext} from './listing';

@CustomElement()
@InjectIntoScope(ReactMarketListingScope, {
    anchor: ({scope}) => scope,
})
export class ReactListingHighlight extends FloatElement {
    @property({attribute: false}) injectionContext?: ReactListingContext;

    private filterSubscription?: Subscription;

    private originalStyle: {backgroundColor: string; color: string} = {backgroundColor: '', color: ''};

    connectedCallback(): void {
        super.connectedCallback();
        const card = this.parentElement;
        if (card) {
            this.originalStyle = {backgroundColor: card.style.backgroundColor, color: card.style.color};
        }
        this.filterSubscription = gFilterService.onUpdate$.subscribe(() => this.applyColour());
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.filterSubscription?.unsubscribe();
        this.filterSubscription = undefined;
    }

    private get convertedPrice(): number | undefined {
        const listing = this.injectionContext?.listing;
        if (!listing?.unPrice) return undefined;
        return (listing.unPrice + listing.unFee) / 100;
    }

    private applyColour(): void {
        const card = this.parentElement;
        const context = this.injectionContext;
        if (!card || !context) return;

        const colour = gFilterService.matchColour(context.itemInfo, this.convertedPrice);
        card.style.backgroundColor = colour ?? this.originalStyle.backgroundColor;
        card.style.color = colour ? pickTextColour(colour, '#8F98A0', '#484848') : this.originalStyle.color;
    }

    protected render() {
        return nothing;
    }
}
