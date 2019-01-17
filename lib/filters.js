class Filter {
    constructor(expression, colour, filters) {
        this.expression = expression;
        this.colour = colour;
        this.validExpressionVars = ['float', 'seed', 'minfloat', 'maxfloat'];
        this.filters = filters;

        this.compileExpression();
    }

    static filtrexMatch(str, reg) {
        let thisMatch = str.toString().match(reg);

        if (thisMatch !== null) return thisMatch.length;
        else return 0;
    }

    compileExpression() {
        this.func = compileExpression(this.expression, {match: Filter.filtrexMatch}, this.validExpressionVars);
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
        colourDiv.addEventListener('change', (e) => this.onFilterColourChange(e));
        thisDiv.appendChild(colourDiv);

        // Add remove filter btn
        let removeFilterBtn = createButton('Remove Filter', 'grey');
        removeFilterBtn.addEventListener('click', (e) => this.removeFilter(e));
        removeFilterBtn.style.marginTop = '-3px';
        removeFilterBtn.style.float = 'right';
        thisDiv.appendChild(removeFilterBtn);

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
    }

    getMatchColour(vars) {
        let colours = [];

        for (let filter of this.filters) {
            if (filter.func(vars) === 1) colours.push(hexToRgb(filter.colour));
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
                avg_colours[index] = parseInt(avg_colours[index]/colours.length);
            }
            
            return rgbToHex(avg_colours);
        }
    }

    addFilter(expression, colour) {
        if (arguments.length === 0) {
            expression = document.querySelector('#float_expression_filter').value;
            colour = document.querySelector('#floatFilterColour').value;
        }

        let filter = new Filter(expression, colour, this);

        filter.addToUI();

        this.filters.push(filter);
        this.saveFilters();

        // Reset expression input value
        document.querySelector('#float_expression_filter').value = '';
    }

    tryCompile(expression) {
        new Filter(expression, '', this);
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
              <li>float == 0.2 or (seed > 500 and float < 0.15)</li>
                <ul>
                    <li>Matches items with floats of 0.2 or paint seeds greater than 500 and floats less than 0.15</li>
                </ul>
               <li>match(float, "7355608") >= 1</li>
                <ul>
                    <li>Matches items with floats that contain at least one match of the CS bomb code</li>
                    <li>Example Match: 0.234327355608454</li>
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

    addFilterUI(parent) {
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
        input.placeholder = 'Add Float Highlight Filter';
        input.style.width = '350px';
        input.style.marginLeft = '10px';
        input.addEventListener('keyup', (e) => this.filterKeyPress(e));
        filterdiv.appendChild(input);

        // Add filter help link
        let helpText = document.createElement('a');
        helpText.innerText = 'ⓘ';
        helpText.style.fontSize = '18px';
        helpText.title = 'Filter Help';
        helpText.style.marginLeft = '5px';
        helpText.href = 'javascript:void(0)';
        helpText.addEventListener('click', (e) => this.onHelpClick(e));
        filterdiv.appendChild(helpText);

        // Add compile status indicator
        let status = document.createElement('div');
        status.id = 'compileStatus';
        filterdiv.appendChild(status);

        // Add new filter btn
        let addFilterBtn = createButton('Add Filter', 'green');
        addFilterBtn.addEventListener('click', (e) => this.addFilter());
        addFilterBtn.id = 'addFloatFilter';
        addFilterBtn.style.display = 'none';
        addFilterBtn.style.marginLeft = '10px';

        filterdiv.appendChild(addFilterBtn);

        // Compile error div
        let compileError = document.createElement('div');
        compileError.id = 'compileError';
        filterdiv.appendChild(compileError);

        // Add any saved filters
        this.getSavedFilters((savedFilters) => {
            for (let filter of savedFilters) {
                let newFilter = new Filter(filter.expression, filter.colour, this);
                this.filters.push(newFilter);
                newFilter.addToUI();
            }
        });
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
            }
            catch (e) {
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

    getSavedFilters(cb) {
        let key = this.getSaveKey();

        if (!key) cb([]);

        let syncFilters = {};
        syncFilters[key] = [];

        let storageType = chrome.storage.sync;
        if (!storageType) storageType = chrome.storage.local;

        storageType.get(syncFilters, (items) => {
            cb(items[key]);
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
        let filterArray = [];

        for (let filter of this.filters) {
            filterArray.push({expression: filter.expression, colour: filter.colour});
        }

        syncFilters[key] = filterArray;

        let storageType = chrome.storage.sync;
        if (!storageType) storageType = chrome.storage.local;

        storageType.set(syncFilters);

        // update UI
        removeButtons();
    }
}
