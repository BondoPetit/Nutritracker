// Populate the userID input field with the userID value from the query string
const urlParams = new URLSearchParams(window.location.search);
const userID = urlParams.get('userID');
document.getElementById('userIDInput').value = userID;


