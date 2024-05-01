document.addEventListener('DOMContentLoaded', async () => {
    const userID = getUserIdFromQueryString(); // Implement this function to extract userID from query string

    try {
        const response = await fetch(`/getUserData?userID=${userID}`);
        if (response.ok) {
            const userData = await response.json();
            displayUserData(userData);
        } else {
            console.error('Failed to fetch user data');
        }
    } catch (err) {
        console.error('Error fetching user data:', err);
    }
});

function getUserIdFromQueryString() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('userID');
}

function displayUserData(userData) {
    document.getElementById('email').innerText = userData.Email;
    document.getElementById('height').innerText = userData.Height;
    document.getElementById('weight').innerText = userData.Weight;
}
