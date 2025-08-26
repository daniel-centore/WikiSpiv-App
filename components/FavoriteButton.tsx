import Song from '@/interfaces/Song';
import { store, updateFavorite } from '@/store/store';
import { getLatestSong } from '@/utils/wikispivUtils';
import React, { useEffect, useState } from 'react';
import { IconButton } from 'react-native-paper';

export const FavoriteButton = ({ song }: { song: Song }) => {
    const [latestSong, setLatestSong] = useState(song);
    const [refresh, setRefresh] = useState(0);
    useEffect(() => {
        // This manual refreshing is needed to deal with the navigation bar usage
        // in App.tsx
        setLatestSong(getLatestSong(song) ?? song);
    });
    return (
        <IconButton
            icon={latestSong.local.favorite ? 'heart' : 'heart-outline'}
            onPress={() => {
                store.dispatch({
                    type: updateFavorite.toString(),
                    payload: {
                        song: latestSong,
                        favorite: !latestSong.local.favorite,
                    },
                });
                setRefresh(refresh + 1);
            }}
        />
    );
};
