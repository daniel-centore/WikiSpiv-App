import Song from "../interfaces/Song";

// Used to specify a song with a specific title for that song
// For #REDIRECTs the title will not match the song name
export type SongEntry = {
    title: string,
    searchTitle: string,
    song: Song,
    isRedirect: boolean,
};