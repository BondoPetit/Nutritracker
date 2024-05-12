document.addEventListener('DOMContentLoaded', function() {
    fetchUserData(); // Call this function to load user data initially

    const deleteUserBtn = document.querySelector('.deleteUserBtn');
    deleteUserBtn.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent the form from submitting
        const confirmed = confirm('Are you sure you want to delete your account?');
        if (confirmed) {
            deleteUser();
        }
    });
});

// Function to extract the userID from the query string
function getUserIdFromQueryString() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('userID');
}

// Function to display user data in the UI
function displayUserData(userData) {
    if (userData) {
        document.getElementById('email').innerText = userData.Email || '';
        document.getElementById('height').innerText = userData.Height || '';
        document.getElementById('weight').innerText = userData.Weight || '';
        document.getElementById('age').innerText = userData.Age || '';
        document.getElementById('gender').innerText = userData.Gender || '';

        // Add event listeners for inline editing
        const editableFields = document.querySelectorAll('[contenteditable="true"]');
        editableFields.forEach(field => {
            field.addEventListener('blur', () => {
                submitUserData();
            });
        });
    }
}

// Function to fetch user data from the server
async function fetchUserData() {
    const userID = getUserIdFromQueryString();
    if (!userID) {
        console.error('No userID provided for fetching data');
        alert('No userID provided');
        return;
    }
    try {
        const response = await fetch(`/api/getUserData?userID=${userID}`);
        if (response.ok) {
            const userData = await response.json();
            displayUserData(userData);
        } else {
            console.error('Failed to fetch user data');
            alert('Failed to fetch user data');
        }
    } catch (err) {
        console.error('Error fetching user data:', err);
        alert('Error while fetching user data. Please check console for details.');
    }
}

// Function to submit updated user data to the server
async function submitUserData() {
    const userID = getUserIdFromQueryString();
    const email = document.getElementById('email').innerText;
    const height = document.getElementById('height').innerText;
    const weight = document.getElementById('weight').innerText;
    const age = document.getElementById('age').innerText;
    const gender = document.getElementById('gender').innerText;

    try {
        const response = await fetch('/api/updateUserData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userID, email, height, weight, age, gender })
        });

        if (response.ok) {
            console.log('User data updated successfully');
        } else {
            console.error('Failed to update user data');
        }
    } catch (err) {
        console.error('Error updating user data:', err);
    }
}

// Function to delete user account
async function deleteUser() {
    const userID = getUserIdFromQueryString();
    if (!userID) {
        console.error('No userID provided for deletion');
        alert('No userID provided');
        return;
    }
    try {
        const response = await fetch(`/api/deleteUser?userID=${userID}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            console.log('User deleted successfully');
            window.location.href = '/Login.html'; // Redirect to Login.html after successful deletion
        } else {
            console.error('Failed to delete user');
            alert('Failed to delete user. Please try again.');
        }
    } catch (err) {
        console.error('Error deleting user:', err);
        alert('Error while deleting user. Please check console for details.');
    }
}
