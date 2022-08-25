import {LitElement} from "lit";

function camelToDashCase(str: string) {
    return str.split(/(?=[A-Z])/).join('-').toLowerCase();
}

// LitElement wrapper with a pre-determined tag
export class FloatElement extends LitElement {
    static tag(): string {
        return `csgofloat-${camelToDashCase(this.name)}`;
    }

    static elem(): any {
        return document.createElement(this.tag());
    }
}
