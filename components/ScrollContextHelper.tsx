import {ContextProvider} from 'recyclerlistview';

export default class ScrollContextHelper extends ContextProvider {
    private _uniqueKey: any;
    private _contextStore: any;

    constructor(uniqueKey: string) {
        super();
        this._contextStore = {};
        this._uniqueKey = uniqueKey;
    }

    getUniqueKey() {
        return this._uniqueKey;
    };

    save(key: string, value: any) {
        this._contextStore[key] = value;
    }

    get(key: string) {
        return this._contextStore[key];
    }

    remove(key: string) {
        delete this._contextStore[key];
    }
}
