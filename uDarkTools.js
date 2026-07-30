const action = new URLSearchParams(document.location.search).get("redirect");

if (action) {
    document.location.replace(action);
}
