// @ts-nocheck
import {compileExpression} from "../../third_party/filtrex/filtrex";

export class Filter {
    constructor(expression, colour, isGlobal, filters) {
        this.expression = expression;
        this.colour = colour;
        this.isGlobal = isGlobal;
        this.validExpressionVars = ['float', 'seed', 'minfloat', 'maxfloat', 'minwearfloat', 'maxwearfloat', 'phase'];
        this.filters = filters;

        this.compileExpression();
    }

    static filtrexMatch(str, reg) {
        let thisMatch = str.toString().match(reg);

        if (thisMatch !== null) return thisMatch.length;
        else return 0;
    }

    static percentile(vars) {
        const minFloat = vars.minfloat > vars.minwearfloat ? vars.minfloat : vars.minwearfloat;
        const maxFloat = vars.maxfloat < vars.maxwearfloat ? vars.maxfloat : vars.maxwearfloat;
        const itemPercentile = 100 - (100 * (vars.float - minFloat)) / (maxFloat - minFloat);

        return function(rank) {
            // Assumes floats are distributed evenly
            return itemPercentile > rank ? 1 : 0;
        };
    }

    static percentileRange(vars) {
        const minFloat = vars.minfloat > vars.minwearfloat ? vars.minfloat : vars.minwearfloat;
        const maxFloat = vars.maxfloat < vars.maxwearfloat ? vars.maxfloat : vars.maxwearfloat;
        const itemPercentile = 100 - (100 * (vars.float - minFloat)) / (maxFloat - minFloat);

        return function(minRank, maxRank) {
            // Assumes floats are distributed evenly
            return itemPercentile > minRank && itemPercentile < maxRank ? 1 : 0;
        };
    }

    func(vars) {
        return this.filtrexFunc(vars, {
            match: Filter.filtrexMatch,
            percentile: Filter.percentile(vars),
            percentileRange: Filter.percentileRange(vars)
        });
    }

    compileExpression() {
        this.filtrexFunc = compileExpression(this.expression, this.validExpressionVars);
    }

    onFilterColourChange(e) {
        let colourSwitch = e.target || e.srcElement;

        this.filters.setFilterColour(this, colourSwitch.value);
    }

    addToUI() {
        let parentDiv = document.querySelector('#floatFilters');

        let thisDiv = document.createElement('div');
        thisDiv.innerText = this.expression;

        let colourDiv = document.createElement('input');
        colourDiv.type = 'color';
        colourDiv.value = this.colour;
        colourDiv.style.float = 'left';
        colourDiv.style.marginRight = '10px';
        colourDiv.style.marginTop = '-3px';
        colourDiv.addEventListener('change', e => this.onFilterColourChange(e));
        thisDiv.appendChild(colourDiv);

        // Add remove filter btn
        let removeFilterBtn = createButton('Remove Filter', 'grey');
        removeFilterBtn.addEventListener('click', e => this.removeFilter(e));
        removeFilterBtn.style.marginTop = '-3px';
        removeFilterBtn.style.float = 'right';
        thisDiv.appendChild(removeFilterBtn);

        // Add global filter toggle btn
        let globalToggleBtn = createButton('Global', this.isGlobal ? 'green' : 'grey');
        globalToggleBtn.addEventListener('click', e => {
            globalToggleBtn.classList.remove(`btn_${this.isGlobal ? 'green' : 'grey'}_white_innerfade`);
            this.isGlobal = !this.isGlobal;
            globalToggleBtn.classList.add(`btn_${this.isGlobal ? 'green' : 'grey'}_white_innerfade`);
            this.filters.saveFilters();
        });
        globalToggleBtn.classList.add('float-tooltip');
        globalToggleBtn.style.marginTop = '-3px';
        globalToggleBtn.style.marginRight = '10px';
        globalToggleBtn.style.float = 'right';

        // Inner tooltip text
        const tooltipText = document.createElement('span');
        tooltipText.classList.add('tiptext');
        tooltipText.innerText = 'Global filters apply to every item on the market';
        tooltipText.style.background = 'darkslategrey';
        globalToggleBtn.appendChild(tooltipText);
        thisDiv.appendChild(globalToggleBtn);

        // Add line break
        let hr = document.createElement('hr');
        thisDiv.appendChild(hr);

        this.div = thisDiv;
        parentDiv.appendChild(thisDiv);
    }

    removeFilter() {
        this.filters.removeFilter(this);
    }
}
