// scriptStats.js

document.addEventListener('DOMContentLoaded', async () => {
    const userID = getUserIdFromQueryString(); // Extract userID from the URL query string
    if (userID) {
        try {
            const userData = await fetchUserData(userID); // Fetch user data using userID
            displayUserData(userData); // Display fetched user data on the page
        } catch (err) {
            console.error('Error fetching user data:', err);
        }
    } else {
        console.error('UserID not found in the query string');
    }
});

function getUserIdFromQueryString() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('userID');
}

async function fetchUserData(userID) {
    const response = await fetch(`/getUserData?userID=${userID}`);
    if (!response.ok) {
        throw new Error('Failed to fetch user data');
    }
    return response.json(); // Return parsed JSON response containing user data
}

function displayUserData(userData) {
    document.getElementById('email').innerText = userData.Email;
    document.getElementById('height').innerText = userData.Height;
    document.getElementById('weight').innerText = userData.Weight;
}
