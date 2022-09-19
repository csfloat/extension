import {LitElement} from "lit";

function camelToDashCase(str: string) {
    return str.split(/(?=[A-Z])/).join('-').toLowerCase();
}

export enum ViewEncapsulation {
    NONE,
    SHADOW_DOM,
}

// LitElement wrapper with a pre-determined tag
export class FloatElement extends LitElement {
    protected encapsulation: ViewEncapsulation = ViewEncapsulation.SHADOW_DOM;

    static tag(): string {
        return `csgofloat-${camelToDashCase(this.name)}`;
    }

    static elem(): any {
        return document.createElement(this.tag());
    }

    protected createRenderRoot(): Element | ShadowRoot {
        if (this.encapsulation === ViewEncapsulation.NONE) {
            return this;
        } else {
            return super.createRenderRoot();
        }
    }
}
