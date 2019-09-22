class Filter {
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

class Filters {
    constructor() {
        this.filters = [];
        this.expressionTimer = false;
        this.waitForFilters = [];
        this.filtersLoaded = false;
    }

    onFiltersLoaded() {
        if (this.filtersLoaded) {
            return Promise.resolve();
        } else {
            return new Promise((resolve) => {
                this.waitForFilters.push(resolve);
            })
        }
    }

    async getMatchColour(vars) {
        // Ensure that filters are loaded from storage
        await this.onFiltersLoaded();

        let colours = [];

        for (let filter of this.filters) {
            if (filter.func(vars) == true) colours.push(hexToRgb(filter.colour));
        }

        if (colours.length > 0) {
            // Get the average colour between each matching filter
            let avg_colours = [0, 0, 0];

            for (let colour of colours) {
                for (let index in colour) {
                    avg_colours[index] += colour[index];
                }
            }

            for (let index in avg_colours) {
                avg_colours[index] = parseInt(avg_colours[index] / colours.length);
            }

            return rgbToHex(avg_colours);
        }
    }

    addFilter(expression, colour) {
        if (arguments.length === 0) {
            expression = document.querySelector('#float_expression_filter').value;
            colour = document.querySelector('#floatFilterColour').value;
        }

        let filter = new Filter(expression, colour, false, this);

        filter.addToUI();

        this.filters.push(filter);
        this.saveFilters();

        // Reset expression input value
        document.querySelector('#float_expression_filter').value = '';
    }

    tryCompile(expression) {
        new Filter(expression, '', false, this);
    }

    setFilterColour(filter, colour) {
        let index = this.filters.indexOf(filter);

        if (index === -1) return;

        this.filters[index].colour = colour;

        this.saveFilters();
    }

    removeFilter(filter) {
        let index = this.filters.indexOf(filter);

        if (index === -1) return;

        filter.div.parentNode.removeChild(filter.div);
        this.filters.splice(index, 1);

        this.saveFilters();
    }

    onHelpClick() {
        let filterdiv = document.querySelector('#floatFilter');

        let helpdiv = filterdiv.querySelector('#filterHelp');
        if (helpdiv) filterdiv.removeChild(helpdiv);
        else {
            // create it
            helpdiv = document.createElement('div');
            helpdiv.id = 'filterHelp';

            helpdiv.innerHTML = `
            <hr></hr>
            Filters will highlight matching items with the specified colour<br><br>
            
            <b>Note: </b> If multiple filters match an item, it will be highlighted with the average colour<br><br>
            
            <b>New: </b> You can now filter based on <a href="https://db.csgofloat.com">FloatDB</a> ranks and item price!<br><br>
            
            <b>Examples: </b>
            <ul>
              <li>float < 0.3</li>
                <ul>
                    <li>Matches items with floats less than 0.3</li>
                </ul>
              <li>float >= 0.112 and float < 0.2</li>
                <ul>
                    <li>Matches items with floats greater than or equal to 0.112 and less than 0.2</li>
                </ul>
              <li>float < 0.02 and price < 12.30</li>
                <ul>
                    <li>Matches items with floats less than 0.02 and a price of 12.30 or less in your logged-in account currency</li>
                    <li>Note: Price only works when you're logged in to ensure the proper currency</li>
                </ul>
              <li>phase == "Ruby" or phase == "1"</li>
                <ul>
                    <li>Matches items with a doppler phase 1 or Ruby</li>
                    <li>Equivalent to phase in ("Ruby", "1")</li>
                </ul>
              <li>float == 0.2 or (seed > 500 and float < 0.15)</li>
                <ul>
                    <li>Matches items with floats of 0.2 or paint seeds greater than 500 and floats less than 0.15</li>
                </ul>
              <li>low_rank <= 500 </li>
                <ul>
                    <li>Matches items with floats ranked in the top 500 lowest for this skin on FloatDB</li>
                </ul>
               <li>match(float, "7355608") >= 1</li>
                <ul>
                    <li>Matches items with floats that contain at least one match of the CS bomb code</li>
                    <li>Example Match: 0.234327355608454</li>
                </ul>
              <li>percentile(90)</li>
                <ul>
                    <li>Matches items with a float better than 90% of items of this type</li>
                </ul>
              <li>percentileRange(0, 10)</li>
                <ul>
                    <li>Matches items with a float within the percentile range 0-10%</li>
                    <li>This matches the worst 10% of floats of items of this type</li>
                </ul>
            </ul>
            
            <b>Variables</b>
            <ul>
              <li>float</li>
                <ul>
                    <li>The float value of the item</li>
                </ul>
              <li>seed</li>
                <ul>
                    <li>The paint seed of the item</li>
                </ul>
              <li>low_rank</li>
                <ul>
                    <li>If the item is in the top 1000 lowest float for this skin and category (normal, stattrak, souvenir), this is the FloatDB rank</li>
                </ul>
              <li>high_rank</li>
                <ul>
                    <li>If the item is in the top 1000 highest float for this skin and category (normal, stattrak, souvenir), this is the FloatDB rank</li>
                </ul>
              <li>price</li>
                <ul>
                    <li>Price of the item in your currency in decimal format (ex. 18.43), includes fees</li>
                    <li>Note: Price only works when you're logged in to ensure the proper currency</li>
                </ul>
              <li>phase</li>
                <ul>
                    <li>Phase of the item if it's a doppler, empty otherwise</li>
                    <li>Possible values are "1", "2", "3", "4", "Ruby", "Sapphire", "Black Pearl", "Emerald"</li>
                </ul>
              <li>minfloat</li>
                <ul>
                    <li>The minimum float the skin can have (regardless of wear)</li>
                </ul>
              <li>maxfloat</li>
                <ul>
                    <li>The maximum float the skin can have (regardless of wear)</li>
                </ul>
            </ul>
            
            <b>Functions:</b>
            <ul>
              <li>match(x, regex)</li>
                <ul>
                    <li>Performs a regex match on 'x' and returns the amount of matches</li>
                </ul>
              <li>percentile(rank)</li>
                <ul>
                    <li>Returns true if the skin's float is in the given percentile, lower floats are considered "better"</li>
                    <li>This takes into account the range of the wear and specific per-skin range</li>
                    <li>Note: This assumes that floats are distributed evenly</li>
                </ul>
              <li>percentileRange(minRank, maxRank)</li>
                <ul>
                    <li>Returns true if the skin's float is in the given percentile range</li>
                    <li>This takes into account the range of the wear and specific per-skin range</li>
                    <li>Note: This assumes that floats are distributed evenly</li>
                </ul>
              <li>abs(x)</li>
                <ul>
                    <li>Absolute value</li>
                </ul>
              <li>ceil(x)</li>
                <ul>
                    <li>Round floating point up</li>
                </ul>
              <li>floor(x)</li>
                <ul>
                    <li>Round floating point down</li>
                </ul>
              <li>log(x)</li>
                <ul>
                    <li>Natural logarithm</li>
                </ul>
              <li>max(a, b, c...)</li>
                <ul>
                    <li>Max value (variable length of args)</li>
                </ul>
              <li>min(a, b, c...)</li>
                <ul>
                    <li>Min value (variable length of args)</li>
                </ul>
              <li>random()</li>
                <ul>
                    <li>Random floating point from 0.0 to 1.0</li>
                </ul>
              <li>round(x)</li>
                <ul>
                    <li>Round floating point</li>
                </ul>
              <li>sqrt(x)</li>
                <ul>
                    <li>Square root</li>
                </ul>
            </ul>
        `;

            filterdiv.appendChild(helpdiv);
        }
    }

    async addFilterUI(parent) {
        let filterdiv = document.createElement('div');
        filterdiv.id = 'floatFilter';
        parent.appendChild(filterdiv);

        // Add separator
        let hr = document.createElement('hr');
        filterdiv.appendChild(hr);

        // Adds filters div
        let filtersdiv = document.createElement('div');
        filtersdiv.id = 'floatFilters';
        filterdiv.appendChild(filtersdiv);

        // Adds colour picker
        let colourDiv = document.createElement('input');
        colourDiv.id = 'floatFilterColour';
        colourDiv.type = 'color';
        colourDiv.value = '#354908';
        colourDiv.style.float = 'left';
        colourDiv.style.marginTop = '2px';
        filterdiv.appendChild(colourDiv);

        // Add new filter input box
        let input = document.createElement('input');
        input.id = 'float_expression_filter';
        input.classList.add('filter_search_box');
        input.placeholder = 'Add Highlight Filter';
        input.style.width = '350px';
        input.style.marginLeft = '10px';
        input.addEventListener('keyup', e => this.filterKeyPress(e));
        filterdiv.appendChild(input);

        // Add filter help link
        let helpText = document.createElement('a');
        helpText.innerText = 'ⓘ';
        helpText.style.fontSize = '18px';
        helpText.title = 'Filter Help';
        helpText.style.marginLeft = '5px';
        helpText.href = 'javascript:void(0)';
        helpText.addEventListener('click', e => this.onHelpClick(e));
        filterdiv.appendChild(helpText);

        // Add compile status indicator
        let status = document.createElement('div');
        status.id = 'compileStatus';
        filterdiv.appendChild(status);

        // Add new filter btn
        let addFilterBtn = createButton('Add Filter', 'green');
        addFilterBtn.addEventListener('click', e => this.addFilter());
        addFilterBtn.id = 'addFloatFilter';
        addFilterBtn.style.display = 'none';
        addFilterBtn.style.marginLeft = '10px';

        filterdiv.appendChild(addFilterBtn);

        // Compile error div
        let compileError = document.createElement('div');
        compileError.id = 'compileError';
        filterdiv.appendChild(compileError);

        const globalFilters = await this.getGlobalFilters();
        const localFilters = await this.getItemFilters();

        const allFilters = globalFilters.concat(localFilters);

        for (let filter of allFilters) {
            let newFilter = new Filter(filter.expression, filter.colour, !!filter.isGlobal, this);
            this.filters.push(newFilter);
            newFilter.addToUI();
        }

        this.filtersLoaded = true;
        for (const resolve of this.waitForFilters) {
            resolve();
        }
    }

    filterKeyPress() {
        if (this.expressionTimer) clearTimeout(this.expressionTimer);

        this.expressionTimer = setTimeout(() => {
            let input = document.querySelector('#float_expression_filter');
            let compileError = document.querySelector('#compileError');
            let status = document.querySelector('#compileStatus');
            let addFilterBtn = document.querySelector('#addFloatFilter');

            let expression = input.value;

            // try to compile the expression
            try {
                this.tryCompile(expression);
                status.setAttribute('error', 'false');
                status.innerText = '✓';
                compileError.innerText = '';
                addFilterBtn.style.display = '';
            } catch (e) {
                if (expression === '') {
                    status.innerText = '';
                    compileError.innerText = '';
                } else {
                    status.setAttribute('error', 'true');
                    compileError.innerText = e.message;
                }
                addFilterBtn.style.display = 'none';
            }
        }, 250);
    }

    getSaveKey() {
        let itemName = document.querySelector('.market_listing_nav a:nth-child(2)');

        if (itemName) return itemName.innerText + '_expressions';
    }

    getItemFilters() {
        return new Promise((resolve, reject) => {
            let key = this.getSaveKey();

            if (!key) cb([]);

            let syncFilters = {};
            syncFilters[key] = [];

            let storageType = chrome.storage.sync;
            if (!storageType) storageType = chrome.storage.local;

            storageType.get(syncFilters, items => {
                resolve(items[key]);
            });
        });
    }

    getGlobalFilters() {
        return new Promise((resolve, reject) => {
            let syncFilters = {};
            syncFilters['global'] = [];

            let storageType = chrome.storage.sync;
            if (!storageType) storageType = chrome.storage.local;

            storageType.get(syncFilters, items => {
                resolve(items['global']);
            });
        });
    }

    /**
     * Ensures we don't hit MAX_WRITE_OPERATIONS_PER_MINUTE
     */
    saveFilters() {
        clearTimeout(this.saveTimeout);

        this.saveTimeout = setTimeout(() => this._saveFilters(), 500);
    }

    _saveFilters() {
        let key = this.getSaveKey();

        if (!key) return;

        let syncFilters = {};

        const pureFilters = this.filters.map(f => ({
            expression: f.expression,
            colour: f.colour,
            isGlobal: f.isGlobal
        }));
        const localFilters = pureFilters.filter(f => !f.isGlobal);
        const globalFilters = pureFilters.filter(f => f.isGlobal);

        syncFilters['global'] = globalFilters;
        syncFilters[key] = localFilters;

        let storageType = chrome.storage.sync;
        if (!storageType) storageType = chrome.storage.local;

        if (localFilters.length === 0) {
            storageType.remove(key);
            delete syncFilters[key];
        }

        storageType.set(syncFilters, () => {
            if (chrome.runtime.lastError) {
                alert(
                    'Error occurred while saving, you may have to remove some filters and try again\n' +
                        chrome.runtime.lastError.toString()
                );
            }
        });

        // update UI
        removeAllItemsHtml();
    }
}
