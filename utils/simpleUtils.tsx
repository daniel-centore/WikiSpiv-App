export function shallowCompare(obj1: any, obj2: any) {
    if (obj1 === null && obj2 === null) {
        return true;
    }
    if (obj1 === null && obj2 !== null) {
        return false
    }
    if (obj1 !== null && obj2 === null) {
        return false
    }
    if (obj1 === undefined && obj2 === undefined) {
        return true;
    }
    if (obj1 === undefined && obj2 !== undefined) {
        return false
    }
    if (obj1 !== undefined && obj2 === undefined) {
        return false
    }

    return Object.keys(obj1).length === Object.keys(obj2).length &&
        Object.keys(obj1).every(key =>
            obj2.hasOwnProperty(key) && obj1[key] === obj2[key]
        );
}

export function isSpaceChar(s : string) {
    // TODO: Make this behave the same as Java's Character.isSpaceChar()
    //       so consumers have the same behaviour
    return s === ' ';
}

// https://stackoverflow.com/a/11318797/998251
export const chunks = (a: any[], size: number) =>
    Array.from(
        new Array(Math.ceil(a.length / size)),
        (_, i) => a.slice(i * size, i * size + size)
    );

export function fuckNegativeZero(num: number) {
    if (num === 0) {
        return 0;
    }
    return num;
}