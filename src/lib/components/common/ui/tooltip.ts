import {css, CSSResult} from 'lit';
import {ChildPart, directive, Directive, DirectiveParameters} from 'lit-html/directive.js';
import {hintcss} from '../../../../thirdparty/hintcss/hintcss';

class TooltipDirective extends Directive {
    parentNode: Element | null = null;
    label = '';
    // Extra classes to customize the tooltip. See https://kushagra.dev/lab/hint/ for all available classes
    extraClasses = '';

    update(part: ChildPart, [label, extraClasses]: DirectiveParameters<this>) {
        this.parentNode = part.parentNode as Element;
        this.label = label;
        if (extraClasses) {
            this.extraClasses = extraClasses;
        }

        if (!this.parentNode) {
            return;
        }

        const newParentClass = `${this.parentNode.getAttribute('class') || ''} hint--top hint--rounded hint--no-arrow ${
            this.extraClasses
        }`;

        this.parentNode.setAttribute('class', newParentClass);
        this.parentNode.setAttribute('aria-label', this.label);
    }

    render(label: string, extraClasses?: string) {}
}

export const tooltip = directive(TooltipDirective);

export const tooltipStyles: CSSResult[] = [
    hintcss,
    css`
        [class*='hint--'][aria-label]:after {
            text-shadow: none;
            font-family: 'Motiva Sans', Arial, Helvetica, sans-serif;
            font-weight: normal;
            line-height: normal;
            text-align: center;
            background: #c2c2c2;
            color: #3d3d3f;
            font-size: 11px;
            border-radius: 3px;
            padding: 5px;
        }
        .hint--whitespace-pre-wrap:after,
        .hint--whitespace-pre-wrap:before {
            white-space: pre-wrap;
        }
    `,
];
