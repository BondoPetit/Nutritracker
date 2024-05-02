document.addEventListener('DOMContentLoaded', () => {
    const userID = getUserIdFromQueryString(); // Extract userID from query string

    const links = document.querySelectorAll('.nav-field a');

    // Update href attributes of all navigation links
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
            const updatedHref = updateHrefWithUserID(href, userID);
            link.setAttribute('href', updatedHref);
        }
    });
});

function getUserIdFromQueryString() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('userID');
}

function updateHrefWithUserID(href, userID) {
    const url = new URL(href, window.location.origin);
    url.searchParams.set('userID', userID);
    return url.toString();
}
