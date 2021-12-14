import { Action } from "redux";
import { buffers, Buffer } from "redux-saga";

export class PriorityBuffer<T> implements Buffer<Action<T>> {
    _buffer: Buffer<Action<T>>;
    _size: number;

    constructor(
        private initialSize: number,
        private action: string,
    ) {
        this._buffer = buffers.expanding(initialSize);
        this._size = 0;
    }

    put(it: Action<any>) {
        // console.log('Putting type: ' + it.type);

        if (it.type === this.action) {
            this._size++;
            this._buffer.put(it);
        }
    };
    
    take() {
        if (!this._buffer.isEmpty()) {
            this._size--;
            return this._buffer.take() as Action<any> | undefined;
        }
    };

    flush() {
        this._size = 0;;
        const items = this._buffer.flush();
        return items as Action<any>[];
    };

    isEmpty() {
        return this._size === 0;
    };

    getSize() {
        return this._size;
    }

    hasHiPriItems() {
        return !this._buffer.isEmpty();
    }
};