function overrideOnResponseRenderResults(proto: any) {
    const originalMethod = proto.OnResponseRenderResults;

    proto.OnResponseRenderResults = function(responseClass: any) {
        const success = (responseClass && responseClass.responseJSON && responseClass.responseJSON.success) || false;
        if (!success) {
            paginationBox.showError();
        } else {
            paginationBox.hide();
        }

        originalMethod.call(this, responseClass);
    };
}

function overrideGoToPage(proto: any) {
    const originalMethodGoToPage = proto.GoToPage;

    proto.GoToPage = function(page: number) {
        paginationBox.showPending();
        originalMethodGoToPage.call(this, page);
    };
}

export function initResponseRenderResultsStatus() {
    const id = setInterval(() => {
        const searchResultsObject = g_oSearchResults;
        if (!searchResultsObject) return;

        const proto = Object.getPrototypeOf(searchResultsObject);

        overrideOnResponseRenderResults(proto);
        overrideGoToPage(proto);

        clearInterval(id);
    }, 1000);
}

class PaginationFailedBox extends HTMLElement {
    private container: HTMLDivElement;
    private progressBar: HTMLDivElement;
    private messageDiv: HTMLDivElement;
    private hideTimeout: number | null = null;
    private timeoutDuration: number = 1;
    private state: string = 'none';

    constructor() {
        super();
        this.container = document.createElement('div');
        this.messageDiv = document.createElement('div');
        this.progressBar = document.createElement('div');
        this.attachShadow({ mode: 'open' });
        this.createElements();
        this.setupStyles();
        this.addEventListeners();
    }

    private createElements() {
        this.container.appendChild(this.messageDiv);
        this.container.appendChild(this.progressBar);
        this.shadowRoot!.appendChild(this.container);
    }

    private setupStyles() {
        Object.assign(this.container.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            padding: '10px',
            color: 'white',
            fontSize: '14px',
            borderRadius: '5px',
            zIndex: '1000',
            display: 'none',
        });

        Object.assign(this.messageDiv.style, {
            position: 'relative',
        });

        Object.assign(this.progressBar.style, {
            position: 'absolute',
            bottom: '0',
            left: '0',
            height: '2px',
            width: '100%',
            backgroundColor: 'white',
            transition: `width ${this.timeoutDuration}s linear`,
        });
    }

    private addEventListeners() {
        this.container.addEventListener('click', () => {
            this.hide();
        });
    }

    showError(duration: number = this.timeoutDuration) {
        this.state = 'error';
        this.timeoutDuration = duration;
        this.messageDiv.textContent = 'Pagination failed';
        this.container.style.backgroundColor = 'red';
        this.container.style.display = 'block';
        this.progressBar.style.width = '100%';
        this.progressBar.style.transitionDuration = `${this.timeoutDuration}s`;

        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }

        setTimeout(() => {
            this.progressBar.style.width = '0%';
        }, 10);

        this.hideTimeout = window.setTimeout(() => {
            this.hide();
        }, this.timeoutDuration * 1000);
    }

    showPending() {
        this.state = 'pending';
        this.messageDiv.textContent = 'Pending';
        this.container.style.backgroundColor = 'lightblue';
        this.container.style.display = 'block';
        this.progressBar.style.width = '100%';
        this.progressBar.style.transitionDuration = `${this.timeoutDuration * 5}s`;

        setTimeout(() => {
            this.progressBar.style.width = '0%';
        }, 10);

        const id = setInterval(() => {
            if (this.state !== 'pending') {
                clearInterval(id);
                return;
            }
            this.progressBar.style.transitionDuration = '0s';
            this.progressBar.style.width = '100%';

            setTimeout(() => {
                this.progressBar.style.transitionDuration = `${this.timeoutDuration * 5}s`;
                this.progressBar.style.width = '0%';
            }, 10);
        }, this.timeoutDuration * 1000 * 5);
    }

    hide() {
        this.container.style.display = 'none';
        this.state = 'none';
    }
}

customElements.define('pagination-failed-box', PaginationFailedBox);
const paginationBox = document.createElement('pagination-failed-box') as PaginationFailedBox;
document.body.appendChild(paginationBox);