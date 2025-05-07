export enum CSFErrorCode {
    NOT_AUTHENTICATED = 'NOT_AUTHENTICATED',
    FAILED_TO_FETCH = 'FAILED_TO_FETCH',
}

export const ErrorMessage = {
    [CSFErrorCode.NOT_AUTHENTICATED]: 'Not authenticated',
    [CSFErrorCode.FAILED_TO_FETCH]: 'Failed to fetch data',
};

export class CSFError extends Error {
    code: CSFErrorCode;

    constructor(code: CSFErrorCode, message?: string) {
        super(message || ErrorMessage[code]);
        this.code = code;
        this.name = 'CSFError';

        // This is needed to make instanceof work correctly with TypeScript
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
        Object.setPrototypeOf(this, CSFError.prototype);
    }
}
