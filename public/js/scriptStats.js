document.addEventListener('DOMContentLoaded', async () => {
    const userID = getUserIdFromQueryString(); // Extract userID from URL

    try {
        const response = await fetch(`/getUserData?userID=${userID}`);
        if (response.ok) {
            const userData = await response.json();
            displayUserData(userData); // Display user data in the HTML elements
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

    // Populate input fields for editing
    document.getElementById('editEmail').value = userData.Email;
    document.getElementById('editHeight').value = userData.Height;
    document.getElementById('editWeight').value = userData.Weight;
}

async function submitUserData() {
    const userID = getUserIdFromQueryString();
    const email = document.getElementById('editEmail').value;
    const height = document.getElementById('editHeight').value;
    const weight = document.getElementById('editWeight').value;

    try {
        const response = await fetch('/updateUserData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userID, email, height, weight })
        });

        if (response.ok) {
            alert('User data updated successfully');
            // Optionally redirect or refresh the page after successful update
        } else {
            throw new Error('Failed to update user data');
        }
    } catch (err) {
        console.error('Error updating user data:', err);
        alert('Failed to update user data. Please try again.');
    }
}
