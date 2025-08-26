declare module 'wikijs' {
    interface Page {
        rawInfo(title?: string | null | undefined);
    }

    export default function(args): any
}

declare module 'wikijs/dist/mjs/util' {
    export const aggregatePagination: any;
    export const pagination: any;
}