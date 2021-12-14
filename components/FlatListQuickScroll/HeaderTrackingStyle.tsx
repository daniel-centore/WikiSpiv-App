export enum HeaderTrackingStyle {
    // The header preview shown is the header for the position at
    // the top of the visible scrollview.
    TOP,
    // The header preview shown is the header for the position at exactly that
    // percent of scrolling. When scrolled to 50%, it is the header for the
    // MIDDLE item on the viewport. When scrolled to 100%, it is the very
    // bottom header. This allows all headers to be shown while scrolling.
    PROPORTIONAL,
    // DEFAULT. The header preview shown is the header for the position at the
    // bottom of the viewport. This makes it such that while scrolling down, as
    // soon as a new header becomes visible we show that one.
    BOTTOM,
}