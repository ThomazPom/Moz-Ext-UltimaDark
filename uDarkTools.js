const redirectMarker = "?redirect=";
const markerIndex = document.location.href.indexOf(redirectMarker);
const action = markerIndex === -1
    ? ""
    : document.location.href.slice(markerIndex + redirectMarker.length);

if (action) {
    document.location.replace(action);
}
