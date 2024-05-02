document.addEventListener('DOMContentLoaded', async () => {
    const userID = getUserIdFromQueryString();

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
    if (userData) {
        document.getElementById('email').innerText = userData.Email || '';
        document.getElementById('height').innerText = userData.Height || '';
        document.getElementById('weight').innerText = userData.Weight || '';
        document.getElementById('age').innerText = userData.Age || '';
        
        // Add event listeners for inline editing
        const editableFields = document.querySelectorAll('[contenteditable="true"]');
        editableFields.forEach(field => {
            field.addEventListener('blur', () => {
                submitUserData();
            });
        });

        // Add event listener for Delete User button
        const deleteUserBtn = document.getElementById('deleteUserBtn');
        if (deleteUserBtn) {
            deleteUserBtn.addEventListener('click', async () => {
                const confirmed = confirm('Are you sure you want to delete your account?');
                if (confirmed) {
                    await deleteUser();
                }
            });
        }
    } else {
        console.error('User data is null or undefined');
    }
}


async function submitUserData() {
    const userID = getUserIdFromQueryString();
    const email = document.getElementById('email').innerText;
    const height = document.getElementById('height').innerText;
    const weight = document.getElementById('weight').innerText;
    const age = document.getElementById('age').innerText; // Get age

    try {
        const response = await fetch('/updateUserData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userID, email, height, weight, age })
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

async function deleteUser() {
    const userID = getUserIdFromQueryString();

    try {
        const response = await fetch(`/deleteUser?userID=${userID}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            console.log('User deleted successfully');
            window.location.href = '/'; // Redirect to login page
        } else {
            console.error('Failed to delete user');
        }
    } catch (err) {
        console.error('Error deleting user:', err);
    }
}
