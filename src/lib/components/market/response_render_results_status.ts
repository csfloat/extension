export function initResponseRenderResultsStatus() {
    const id = setInterval(() => {
        const searchResultsObject = g_oSearchResults;
        if (!searchResultsObject) return;

        const proto = Object.getPrototypeOf(searchResultsObject);

        const originalMethod = proto.OnResponseRenderResults;

        proto.OnResponseRenderResults = function(responseClass: any) {
            const success = (responseClass && responseClass.responseJSON && responseClass.responseJSON.success) || false
            if (!success) {
                paginationBox.show()
            }

            originalMethod.call(this, responseClass);
        };

        clearInterval(id);
    }, 1000)
}

class PaginationFailedBox extends HTMLElement {
    private container: HTMLDivElement;
    private progressBar: HTMLDivElement;
    private hideTimeout: number | null = null;
    private timeoutDuration = 1

    constructor() {
        super();

        const shadow = this.attachShadow({ mode: 'open' });

        this.container = document.createElement('div');
        this.container.textContent = 'Pagination failed';
        this.container.style.position = 'fixed';
        this.container.style.top = '10px';
        this.container.style.right = '10px';
        this.container.style.padding = '10px';
        this.container.style.backgroundColor = 'red';
        this.container.style.color = 'white';
        this.container.style.fontSize = '14px';
        this.container.style.borderRadius = '5px';
        this.container.style.zIndex = '1000';
        this.container.style.display = 'none'

        this.progressBar = document.createElement('div');
        this.progressBar.style.position = 'absolute';
        this.progressBar.style.bottom = '0';
        this.progressBar.style.left = '0';
        this.progressBar.style.height = '2px';
        this.progressBar.style.width = '100%';
        this.progressBar.style.backgroundColor = 'white';
        this.progressBar.style.transition = `width ${this.timeoutDuration}s linear`;

        this.container.appendChild(this.progressBar);

        shadow.appendChild(this.container);

        this.container.addEventListener('click', () => {
            this.hide();
        });
    }

    show() {
        this.container.style.display = 'block';
        this.progressBar.style.width = '100%';   // Reset the progress bar

        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }

        // Start the progress bar animation
        setTimeout(() => {
            this.progressBar.style.width = '0%'; // Animate the progress bar over 2 seconds
        }, 10);  // A slight delay to ensure the transition is applied

        this.hideTimeout = window.setTimeout(() => {
            this.hide();
        }, this.timeoutDuration * 1000);
    }

    hide() {
        this.container.style.display = 'none';
    }
}

customElements.define('pagination-failed-box', PaginationFailedBox);
const paginationBox = document.createElement('pagination-failed-box') as PaginationFailedBox;
document.body.appendChild(paginationBox);