import { useSelector } from "react-redux";
import Song from "../interfaces/Song";
import { RootState, store } from '../store/store';

// songs param is used for when we need to use a selector
export function getLatestSong(song: Song, songs?: Song[]) {
    return (songs ?? store.getState().songs)
        .find(ns => ns.init.name === song.init.name) || null;
}

export function useLatestSong(song: Song) {
    const songs = useSelector((state: RootState) => state.songs);
    return getLatestSong(song, songs) || song;
}
