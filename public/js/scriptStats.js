document.addEventListener('DOMContentLoaded', async () => {
    const userID = getUserIdFromQueryString();

    try {
        const response = await fetch(`/getUserData?userID=${userID}`);
        if (response.ok) {
            const userData = await response.json();
            displayUserData(userData);

            // Add event listeners for inline editing
            const editableFields = document.querySelectorAll('[contenteditable="true"]');
            editableFields.forEach(field => {
                field.addEventListener('blur', () => {
                    submitUserData(userID); // Submit data on blur (when editing is finished)
                });
            });
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

async function submitUserData(userID) {
    const email = document.getElementById('email').innerText;
    const height = document.getElementById('height').innerText;
    const weight = document.getElementById('weight').innerText;

    try {
        const response = await fetch('/updateUserData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userID, email, height, weight })
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
