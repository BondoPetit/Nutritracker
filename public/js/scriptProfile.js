// Extract the userID from the query string
const urlParams = new URLSearchParams(window.location.search);
const userID = urlParams.get('userID');

// Populate the userID input field with the extracted userID
document.getElementById('userIDInput').value = userID;
