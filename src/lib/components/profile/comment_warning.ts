import {css, html} from 'lit';

import {CustomElement, InjectAfter, InjectionMode} from '../injectors';
import {FloatElement} from '../custom';
import '../common/ui/steam-button';
import {state} from 'lit/decorators.js';
import {Observe} from '../../utils/observers';

@CustomElement()
@InjectAfter('.commentthread_area .commentthread_header', InjectionMode.ONCE)
export class CommentWarning extends FloatElement {
    @state()
    show = false;

    static styles = [
        ...FloatElement.styles,
        css`
            .container {
                background-color: rgba(235, 87, 87, 0.05);
                color: #de6667;
                border-radius: 6px;
                padding: 8px;
                margin: 5px;
                font-size: 14px;
            }
        `,
    ];

    private getRawCommentBoxText(): string {
        const elems = document.getElementsByClassName('commentthread_textarea');
        if (elems.length === 0) {
            return '';
        }

        const elem = elems[0] as HTMLTextAreaElement;
        return elem.value || '';
    }

    async connectedCallback() {
        super.connectedCallback();

        Observe(
            () => {
                return this.getRawCommentBoxText();
            },
            () => {
                this.refreshWarningApplicable();
            }
        );
    }

    refreshWarningApplicable() {
        const text = this.getRawCommentBoxText();
        const words = new Set(text.toLowerCase().split(' '));

        const hasTriggerWord = ['buy', 'sell', 'bought', 'sold', 'csfloat'].some((e) => words.has(e));
        this.show = hasTriggerWord;
    }

    render() {
        if (!this.show) {
            return html``;
        }

        return html`<div class="container">
            <b>WARNING:</b> Commenting on profiles with words relating to buying and selling CS2 items
            <b>WILL</b> result in a Steam community ban!
        </div>`;
    }
}
