import { Action, applyMiddleware, combineReducers, createStore } from 'redux';
import { persistStore, persistReducer, PersistConfig } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import Song from '../interfaces/Song';
import { createAction, createReducer } from '@reduxjs/toolkit'
import {
    call,
    put,
    take,
    fork,
    actionChannel,
    delay,
    SimpleEffect,
    all
} from 'redux-saga/effects'
import { buffers, channel, Buffer, Saga } from 'redux-saga'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { REHYDRATE } from 'redux-persist/lib/constants';
import wiki from 'wikijs';
import { aggregatePagination, pagination } from 'wikijs/dist/mjs/util'
import { PriorityBuffer } from './PriorityBuffer';
import { ChordModeSetting, DarkModeSetting, PhoneticModeSetting } from './SettingEnums';
import { chunks } from '../utils/simpleUtils';

// Workaround from https://github.com/redux-saga/redux-saga/issues/2709#issuecomment-2847140992
const createSagaMiddleware = require('redux-saga').default

const SEC_MS = 1000;
const MIN_MS = 60 * SEC_MS;
const HOUR_MS = 60 * MIN_MS;
const DAY_MS = 24 * HOUR_MS;

// How long before songs are considered stale
const REFRESH_TIME_MS = 1 * DAY_MS;

// Bump this ONLY if making a change which makes the state
// incompatible with an old state - it will force a full
// refresh as if the app had been installed from scratch.
// This is not normally needed.
const DATA_MAJOR_VERSION = 2;

const initialState = {
    version: DATA_MAJOR_VERSION as number | null,
    songs: [] as Song[],
    zoomScale: 1.25,
    darkMode: DarkModeSetting.SYSTEM,
    chordsMode: ChordModeSetting.BASIC_CHORDS,
    phoneticMode: PhoneticModeSetting.OFF,
    lastUpdateTrigger: 0,
    displayCategories: null as string[] | null,
    transposition: false,
    // transient will not be saved between app sessions
    transient: {
        searchText: null as string | null,
        error: null as string | null,
        errorTime: 0,
    },
}

const RESET_APP = 'app/reset'
export const resetApp = createAction<null>(RESET_APP);

const CLEAR_SONG_LIST = 'song/clearSongList';
export const clearSongList = createAction<null>(CLEAR_SONG_LIST);
// Updates data in a multiple songs (like calling updateSong multiple times)
const UPDATE_SONGS = 'song/updateSongs';
const updateSongs = createAction<Song[]>(UPDATE_SONGS);
// Updates the full list of songs, adding and deleting as necessary
const UPDATE_SONG_LIST = 'song/updateSongList';
const updateSongList = createAction<{ songs: Song[], categories: string[] }>(UPDATE_SONG_LIST);
const UPDATE_SONG_LIST_TRIGGERED = 'song/updateSongListTriggered';
const updateSongListTriggered = createAction<number>(UPDATE_SONG_LIST_TRIGGERED);
const TRANSPOSE_SONG = 'song/transpose';
export const transposeSong = createAction<{ song: Song, amount: number }>(TRANSPOSE_SONG);

export const updateZoom = createAction<number>('ux/updateZoom');
export const updateDarkMode = createAction<DarkModeSetting>('ux/updateDarkMode');
export const updateChordMode = createAction<ChordModeSetting>('ux/updateChordMode');
export const updatePhoneticMode = createAction<PhoneticModeSetting>('ux/updatePhoneticMode');
export const updateShowTransposition = createAction<boolean>('ux/updateShowTransposition');
export const updateColumns = createAction<{ song: Song, columns: number }>('ux/updateColumns');

const UPDATE_ERROR = 'error/updateError';
export const updateError = createAction<string>(UPDATE_ERROR);

export const updateSearchText = createAction<string>('search/updateSearchText');

export const HIGH_PRI_FETCH = 'HIGH_PRI_FETCH';
export const LOW_PRI_FETCH = 'LOW_PRI_FETCH';
// Param: true = force now, false = only if stale
export const RELOAD_SONG_LIST = 'RELOAD_SONG_LIST';

// This is using Redux Toolkit & Immer - it is not actually mutating the state
// See https://redux.js.org/usage/structuring-reducers/immutable-update-patterns/
const rootReducer = createReducer(initialState, (builder) => {
    builder
        .addCase(updateSongs, (state, action) => {
            const updatedSongs = action.payload;
            const updatedSongMap = {} as { [id: string]: Song };
            updatedSongs.forEach(s => updatedSongMap[s.init.name] = s);

            state.songs = state.songs.map(
                oldSong => {
                    if (oldSong.init.name in updatedSongMap) {
                        const updatedSong = updatedSongMap[oldSong.init.name];
                        // Save these old params after updating everything else
                        updatedSong.local = {
                            ...oldSong.local
                        };
                        return updatedSong;
                    }
                    return oldSong;
                }
            );
        })
        .addCase(transposeSong, (state, action) => {
            const song = action.payload.song;
            const amount = action.payload.amount
            state.songs = state.songs.map(
                s => {
                    if (s.init.name !== song.init.name) {
                        return s;
                    }
                    const newSong = new Song(
                        song.init,
                        song.populated,
                        {
                            ...song.local,
                            transposition: amount,
                        },
                    );
                    return newSong;
                }
            );
        })
        .addCase(updateColumns, (state, action) => {
            const song = action.payload.song;
            const columns = action.payload.columns
            state.songs = state.songs.map(
                s => {
                    if (s.init.name !== song.init.name) {
                        return s;
                    }
                    const newSong = new Song(
                        song.init,
                        song.populated,
                        {
                            ...song.local,
                            columns,
                        },
                    );
                    return newSong;
                }
            );
        })
        .addCase(updateSongList, (state, action) => {
            // Remove songs which are not in the source
            const latestSongs = action.payload.songs;
            const latestSongMap = {} as { [id: string]: Song };
            latestSongs.forEach(s => latestSongMap[s.init.name] = s);
            state.songs = state.songs.filter(
                oldSong => oldSong.init.name in latestSongMap
            );
            // Add songs which are not in the existing
            const existingSongTitles = new Set<string>(
                state.songs.map(s => s.init.name)
            );
            const newSongs = latestSongs.filter(
                ns => !existingSongTitles.has(ns.init.name)
            );
            state.songs.push(...newSongs);
            // Update the list of redirects and init time
            state.songs = state.songs.map(os => {
                os.init.alternateNames = latestSongMap[os.init.name]?.init.alternateNames ?? [];
                return os;
            });
            // Update display categories
            state.displayCategories = action.payload.categories;
        })
        .addCase(clearSongList, (state, action) => {
            state.songs = [];
        })
        .addCase(updateZoom, (state, action) => {
            state.zoomScale = action.payload;
        })
        .addCase(updateSearchText, (state, action) => {
            state.transient.searchText = action.payload;
        })
        .addCase(updateDarkMode, (state, action) => {
            state.darkMode = action.payload;
        })
        .addCase(updateChordMode, (state, action) => {
            state.chordsMode = action.payload;
        })
        .addCase(updatePhoneticMode, (state, action) => {
            state.phoneticMode = action.payload;
        })
        .addCase(resetApp, (state, action) => {
            for (var key in initialState) {
                (state as any)[key] = (initialState as any)[key];
            }
        })
        .addCase(updateSongListTriggered, (state, action) => {
            state.lastUpdateTrigger = action.payload;
        })
        .addCase(updateError, (state, action) => {
            state.transient.error = action.payload;
            state.transient.errorTime = Date.now();
        })
        .addCase(updateShowTransposition, (state, action) => {
            state.transposition = action.payload;
        })
        .addDefaultCase((state, action) => {
            return state
        })
});

async function fetchDisplayCategories(): Promise<string[]> {
    const apiOptions = { apiUrl: 'https://www.wikispiv.com/api.php' };

    return await wiki(apiOptions)
        .page('List:App categories')
        .then(async (page: any) => {
            const raw = await page.rawContent();
            const result = raw.split('\n')
                .filter((result: any) => result.trim().length > 0);
            return result;
        }).catch((error: any) => { throw error });

}

async function fetchSongAndCategoryLists(): Promise<{
    songs: Song[],
    categories: string[],
}> {
    const apiOptions = { apiUrl: 'https://www.wikispiv.com/api.php' };

    const [excludeSongs, allSongs, displayCategories] = await Promise.all([
        wiki(apiOptions).pagesInCategory('Category:App_exclude'),
        wiki(apiOptions).pagesInCategory('Category:Пісні'),
        fetchDisplayCategories(),
    ])
        .catch((error) => { throw error });

    const allRedirects = await aggregatePagination(
        pagination(
            apiOptions,
            {
                generator: 'allredirects',
                redirects: 1,
            },
            (res: any) => Object.values(res.query.redirects || []) || [],
        )
    );

    const filteredSongs = allSongs.filter((song: any) => !excludeSongs.includes(song));

    const redirectsMap = {} as { [id: string]: Set<string> };
    allRedirects.forEach((r: { from: string, to: string }) => {
        redirectsMap[r.to] = redirectsMap[r.to] || new Set();
        redirectsMap[r.to].add(r.from);
    });


    const songs = filteredSongs.map((pagename: any) => {
        // console.log(redirectsMap[pagename]);
        return new Song(
            {
                name: pagename,
                alternateNames: redirectsMap[pagename]
                    ? Array.from(redirectsMap[pagename])
                    : []
            },
            null,  // populated
            null,  // local
        );
    });
    return {
        songs: songs,
        categories: displayCategories,
    }
}

type FetchResult = {
    batchcomplete: string,
    continue: {
        clcontinue: string,
        continue: string,
    }
    query: {
        pages: {
            [id: string]: {
                categories: {
                    ns: number,
                    title: string,
                }[],
                ns: number,
                pageid: number,
                revisions: {
                    slots: {
                        main: {
                            '*': string,
                            contentformat: string,
                            contentmodel: string,
                        }
                    },
                }[],
                title: string,
            }
        }
    }
};

async function fetchSongs(songs: Song[]): Promise<Song[]> {
    const apiOptions = { apiUrl: 'https://www.wikispiv.com/api.php' };

    const songMap = {} as { [id: string]: Song };
    songs.forEach(s => songMap[s.init.name] = s);

    // console.log('Fetching '+song.name+"...");

    return await aggregatePagination(
        pagination(
            apiOptions,
            {
                prop: 'revisions|categories',
                rvprop: 'content',
                rvslots: 'main',
                rvsection: 0,
                titles: songs.map(s => s.init.name).join('|'),
                cllimit: 'max',  // max number of categories to return (500)
            },
            (result: FetchResult) => {
                return Object.values(result.query.pages).map(page => {
                    const oldSong = songMap[page.title];
                    return new Song(
                        oldSong.init,
                        {
                            populatedTime: Date.now(),
                            categories: page.categories.map(c => c.title),
                            wikitext: page.revisions[0].slots.main['*'],
                        },
                        null,  // local
                    );
                });
            },
        )
    );
}

async function fetchSong(song: Song): Promise<Song | null> {
    return fetchSongs([song]).then(s => s ? s[0] : null);
}

// Number of songs to request at a time
//   - Too large = Make the API angery because request too large
//   - Too smol  = Takes longer to populate the app
const FETCH_BATCH_SIZE = 50;
// Number of songs to save+render at a time
//   - Too large = Infrequent updates causing cached song to not be used even when it is available
//   - Too smol  = Slower app + clicks unresponsive
const RENDER_BATCH_SIZE = 200;

function* handleLowPriRequests(channel: any, buffer: PriorityBuffer<any>) {
    while (true) {
        const updatedSongs = [] as Song[];
        while (
            updatedSongs.length < RENDER_BATCH_SIZE
            && (!buffer.isEmpty() || updatedSongs.length === 0)
        ) {
            const taken = (yield take(channel)) as SimpleEffect<'TAKE', Song[]>;
            const batch = taken.payload;
            let attempts = 1;
            while (true) {
                try {
                    const fetchedSongs: Song[] = yield fetchSongs(batch);
                    updatedSongs.push(
                        ...fetchedSongs
                    );
                    break;
                } catch (error) {
                    attempts++;
                    yield put({
                        type: UPDATE_ERROR, payload:
                            'Failed to fetch batch of songs'
                            + '\nPlease check your internet'
                            + '\nTrying again (Attempt ' + attempts + ')'
                    })
                    yield delay(5000);
                }
            }
        }
        yield put({ type: UPDATE_SONGS, payload: updatedSongs })
    }
}


function* handleHighPriRequests(channel: any, _buffer: PriorityBuffer<any>) {
    while (true) {
        const taken = (yield take(channel)) as SimpleEffect<'TAKE', Song>;
        const song = taken.payload;
        // console.log('Putting '+song.name);

        let attempts = 1;
        while (true) {
            try {
                const fetched: Song | null = yield fetchSong(song);
                if (fetched) {
                    yield put({ type: UPDATE_SONGS, payload: [fetched] });
                }
                break;
            } catch (error) {
                attempts++;
                if (attempts > 5) {
                    yield put({
                        type: UPDATE_ERROR, payload:
                            'Failed to fetch song [' + song.init.name + ']'
                            + '\nPlease check your internet and restart the app'
                    });
                    break;
                }
                yield put({
                    type: UPDATE_ERROR, payload:
                        'Failed to fetch song [' + song.init.name + ']'
                        + '\nPlease check your internet'
                        + '\nTrying again (Attempt ' + attempts + ')'
                })
                yield delay(5000);
            }
        }
    }
}

function* handleReloadRequests(channel: any) {
    while (true) {
        // console.log('Waiting for request...')
        const taken = (yield take(channel)) as SimpleEffect<'TAKE', boolean>;
        // console.log('Got request!!')

        const force = taken.payload;

        const lastUpdate = store.getState().lastUpdateTrigger;
        const staleTime = Math.max(Date.now() - REFRESH_TIME_MS, lastUpdate);

        const oldSongs = store.getState().songs;
        const stale = oldSongs.filter(s => !s.populated || s.populated.populatedTime < staleTime).length;

        const shouldUpdate = force || oldSongs.length === 0 || stale > 0;
        if (!shouldUpdate) {
            continue;
        }

        // console.log('Updating trigger');
        yield put({ type: UPDATE_SONG_LIST_TRIGGERED, payload: Date.now() });

        // Update the song list every time
        let attempts = 1;
        while (true) {
            try {
                const songList: Song[] = yield call(fetchSongAndCategoryLists);
                if (songList === null) {
                    throw new Error();
                }
                // console.log('Updating song list');
                yield put({ type: UPDATE_SONG_LIST, payload: songList });
                break;
            } catch (error) {
                attempts++;
                yield put({
                    type: UPDATE_ERROR, payload:
                        'Failed to download song and category lists'
                        + '\nPlease check your internet'
                        + '\nTrying again (Attempt ' + attempts + ')'
                })
                yield delay(5000);
            }
        }

        // Prioritize songs which were last populated longer ago
        const sortedSongs = [...store.getState().songs]
            .sort(
                (a, b) => (a.populated?.populatedTime ?? 0)
                    - (b.populated?.populatedTime ?? 0)
            );

        yield all(
            chunks(sortedSongs, FETCH_BATCH_SIZE).map(chunk => (
                put({ type: LOW_PRI_FETCH, payload: chunk })
            ))
        )
    }
}

function* pollSongs(): any {
    // create a channel to queue incoming requests
    const lowPriBuffer = new PriorityBuffer(8, LOW_PRI_FETCH);
    const lowPriChannel: Buffer<Action<any>> = yield actionChannel([LOW_PRI_FETCH], lowPriBuffer);
    const highPriBuffer = new PriorityBuffer(8, HIGH_PRI_FETCH);
    const highPriChannel: Buffer<Action<any>> = yield actionChannel([HIGH_PRI_FETCH], highPriBuffer);

    const reloadSongListChannel: Buffer<Action<any>> = yield actionChannel([RELOAD_SONG_LIST])

    // Wait for persist store to be ready
    // This is a gross solution but seems to be a limitation of redux-persist...
    // See https://github.com/rt2zz/redux-persist/issues/794
    yield take(REHYDRATE);
    while (!persistor.getState().bootstrapped) {
        yield delay(1);;
    }

    // == Begin handling requests == //

    yield fork(handleLowPriRequests, lowPriChannel, lowPriBuffer);
    yield fork(handleHighPriRequests, highPriChannel, highPriBuffer);
    yield fork(handleReloadRequests, reloadSongListChannel);

    yield put({ type: RELOAD_SONG_LIST, payload: false })
}

const persistConfig: PersistConfig<any> = {
    key: 'root',
    storage: AsyncStorage,
    stateReconciler: autoMergeLevel2,
    blacklist: ['transient'],
    migrate: (state: any) => {
        return new Promise(function (resolve, reject) {
            if (!state || state.version !== DATA_MAJOR_VERSION) {
                return initialState;
            }
            resolve(state);
        });
    },
};

export type RootState = typeof initialState
export type AppDispatch = typeof store.dispatch


const pReducer = persistReducer<RootState>(persistConfig, rootReducer as any);

const sagaMiddleware = createSagaMiddleware()

export const store = createStore(
    pReducer,
    applyMiddleware(sagaMiddleware)
);
export const persistor = persistStore(store);

sagaMiddleware.run(pollSongs);
