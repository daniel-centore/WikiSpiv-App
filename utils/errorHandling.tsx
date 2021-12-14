import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState, store } from "../store/store";

export function useError(): string | null {
    // Stop showing a particular error after 30 seconds
    const MAX_TIME = 30 * 1000;
    let [_time, setTime] = React.useState(0);
    const error = useSelector((state: RootState) => state.transient.error);
    const errorTime = useSelector((state: RootState) => state.transient.errorTime);

    useEffect(() => {
        // Periodically recheck if it's time to stop showing the error
        const interval = setInterval(() => setTime(Date.now()), 1000);
        return () => { clearInterval(interval); }
    }, []);
    if (error && errorTime > Date.now() - MAX_TIME) {
        return error;
    }
    return null;
}