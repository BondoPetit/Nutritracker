document.addEventListener("DOMContentLoaded", function () {
    // Open the tracker modal
    window.trackerPopup = function (editMode = false, recordId = null) {
        document.getElementById('mealPopUp').style.display = 'block';
        populateTrackerModal(editMode, recordId);
        fillCurrentDateTime();
        fetchCurrentLocation();
    };

    // Close the tracker modal
    window.closeTrackerPopup = function () {
        document.getElementById('mealPopUp').style.display = 'none';
    };

    // Close the nutritional info modal
    window.closeNutritionalInfoModal = function () {
        document.getElementById('nutritionalDetailsModal').style.display = 'none';
    };

    // Save the tracker data
    window.saveTracker = function () {
        const mealName = document.getElementById('mealName').value;
        const mealWeight = document.getElementById('mealWeight').value;
        const intakeDate = document.getElementById('intakeDate').value;
        const intakeTime = document.getElementById('intakeTime').value;
        const location = document.getElementById('location').value;

        // Calculate nutritional data based on the selected meal and its weight
        const selectedMeal = JSON.parse(localStorage.getItem('meals')).find(meal => meal.name === mealName);
        const nutritionalData = calculateNutritionalData(selectedMeal, mealWeight);

        // Generate a unique ID for the record
        const recordId = Date.now();

        // Construct the new record object including nutritional data
        const newRecord = {
            id: recordId,
            name: mealName,
            weight: mealWeight,
            date: intakeDate,
            time: intakeTime,
            location: location,
            nutritionalData: nutritionalData // Include the calculated nutritional data
        };

        // Fetch existing records, add the new one, and save back to localStorage
        let records = JSON.parse(localStorage.getItem('mealIntakeRecords')) || [];
        records.push(newRecord);
        localStorage.setItem('mealIntakeRecords', JSON.stringify(records));

        closeTrackerPopup(); // Close the modal after saving
        displayMeals(); // Refresh the list of meals
    };

    // Fetch and fill the current date and time
    function fillCurrentDateTime() {
        const now = new Date();
        let year = now.getFullYear(); // YYYY
        let month = (now.getMonth() + 1).toString().padStart(2, '0'); // MM (months are 0-indexed, so add 1)
        let day = now.getDate().toString().padStart(2, '0'); // DD

        const dateInput = document.getElementById('intakeDate');
        const timeInput = document.getElementById('intakeTime');

        // Ensure the format is YYYY-MM-DD for the date input to recognize it
        dateInput.value = `${year}-${month}-${day}`; // Set in YYYY-MM-DD format
        timeInput.value = now.toTimeString().slice(0, 5); // HH:MM, no change needed here
    }

    // Fetch the current location
    function fetchCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                const locationInput = document.getElementById('location');
                locationInput.value = `Lat: ${position.coords.latitude}, Long: ${position.coords.longitude}`;
            }, function (error) {
                console.error(error);
            });
        }
    }

    // Populate the tracker modal with form inputs for intake tracking
    function populateTrackerModal(editMode) {
        const savedMeals = JSON.parse(localStorage.getItem('meals')) || [];
        const mealSelectorHTML = savedMeals.map(meal => `<option value="${meal.name.replace('meal:', '')}">${meal.name.replace('meal:', '')}</option>`).join('');

        const modalContent = document.querySelector('#mealPopUp .modal-content');
        modalContent.innerHTML = `<span class="close" onclick="closeTrackerPopup()">&times;</span>
        <h2>${editMode ? 'Edit' : 'Add'} Meal Intake</h2>
        <form id="mealIntakeForm">
            <label for="mealName">Meal Name:</label>
            <select id="mealName" name="mealName">${mealSelectorHTML}</select>
            <label for="mealWeight">Weight (g):</label>
            <input type="number" id="mealWeight" name="mealWeight" placeholder="Enter weight" required>
            <label for="intakeDate">Date:</label>
            <input type="date" id="intakeDate" name="intakeDate" required>
            <label for="intakeTime">Time:</label>
            <input type="time" id="intakeTime" name="intakeTime" required>
            <label for="location">Location:</label>
            <input type="text" id="location" name="location" placeholder="Fetching location..." readonly>
            <div id="nutritionalDisplay"></div> <!-- Nutritional data display -->
            <button type="button" onclick="saveTracker()">Save Meal Intake</button>
        </form>`;

        // Call the setupMealSelectionChange function to ensure the meal selection change listener is set up
        setupMealSelectionChange();
    }

    // Display the meals from localStorage
    function displayMeals() {
        const records = JSON.parse(localStorage.getItem('mealIntakeRecords')) || [];
        const recordsContainer = document.getElementById('recordsContainer');

        // Clear existing records to prevent duplication
        recordsContainer.innerHTML = '';

        // Iterate over records and append them to the container
        records.forEach(record => {
            const recordElement = document.createElement('div');
            recordElement.classList.add('mealRecord'); // Apply the styling class to each record
            recordElement.dataset.recordId = record.id; // Set dataset attribute

            // Create elements for the text and buttons separately
            const textElement = document.createElement('p');
            textElement.textContent = `${record.name}  ${record.weight}g  ${record.date}  ${record.time} Location: ${record.location}`;
            recordElement.appendChild(textElement); // Append text to record element

            // Create buttons container
            const buttonsContainer = document.createElement('div');
            buttonsContainer.classList.add('buttons-container');

            // Create edit button
            const editButton = document.createElement('button');
            editButton.classList.add('edit-button');
            editButton.innerHTML = '<i class="fas fa-pencil-alt edit-icon"></i>';
            editButton.addEventListener('click', function () {
                editMealRecord(record.id);
            });
            buttonsContainer.appendChild(editButton); // Append edit button to buttons container

            // Create delete button
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-button');
            deleteButton.innerHTML = '<i class="fas fa-trash-alt delete-icon"></i>';
            deleteButton.addEventListener('click', function () {
                deleteMealRecord(event);
            });
            buttonsContainer.appendChild(deleteButton); // Append delete button to buttons container

            // Create nutritional data button
            const nutritionalDataButton = document.createElement('button');
            nutritionalDataButton.classList.add('show-nutritional-data-button');
            nutritionalDataButton.innerHTML = '<i class="fas fa-book book-icon"></i>'; // Tilføj "book-icon" klassen her
            nutritionalDataButton.dataset.recordId = record.id;
            nutritionalDataButton.addEventListener('click', function () {
                showNutritionalData(record.id);
            });
            buttonsContainer.appendChild(nutritionalDataButton); // Append nutritional data button to buttons container

            // Append buttons container to record element
            recordElement.appendChild(buttonsContainer);

            // Append record element to records container
            recordsContainer.appendChild(recordElement);
        });

        // Add event listener to handle edit button clicks
        recordsContainer.addEventListener('click', function (event) {
            if (event.target.classList.contains('edit-icon')) {
                const recordId = parseInt(event.target.closest('.mealRecord').dataset.recordId);
                editMealRecord(recordId);
            }
        });
    }

    // Ensure records are displayed upon initial load
    displayMeals();

    // Function to handle meal selection change and display nutritional data
    function setupMealSelectionChange() {
        const mealSelector = document.getElementById('mealName');
        const mealWeightInput = document.getElementById('mealWeight');
        if (mealSelector && mealWeightInput) {
            mealSelector.addEventListener('change', function () {
                const selectedMealName = this.value;
                const savedMeals = JSON.parse(localStorage.getItem('meals')) || [];
                const selectedMeal = savedMeals.find(meal => meal.name === selectedMealName);

                if (selectedMeal) {
                    // Display nutritional data only if weight is provided
                    if (mealWeightInput.value.trim() !== '') {
                        displayNutritionalData(selectedMeal.id, parseFloat(mealWeightInput.value)); // Display nutritional data for the selected meal
                    }
                }
            });

            // Listen for changes in meal weight input
            mealWeightInput.addEventListener('input', function () {
                const selectedMealName = mealSelector.value;
                const savedMeals = JSON.parse(localStorage.getItem('meals')) || [];
                const selectedMeal = savedMeals.find(meal => meal.name === selectedMealName);

                if (selectedMeal) {
                    // Display nutritional data only if weight is provided
                    if (this.value.trim() !== '') {
                        displayNutritionalData(selectedMeal.id, parseFloat(this.value)); // Display nutritional data for the selected meal
                    }
                }
            });
        } else {
            console.error('Meal selector element or meal weight input not found.');
        }
    }

    // Call to setup meal selection change listener
    setupMealSelectionChange();

    function showNutritionalData(recordId) {
        const records = JSON.parse(localStorage.getItem('mealIntakeRecords')) || [];
        const record = records.find(record => record.id === parseInt(recordId));

        if (record && record.nutritionalData && typeof record.nutritionalData.energy !== 'undefined') {
            const nutritionalData = record.nutritionalData;

            const nutritionalInfoContent = document.getElementById('nutritionalInfoContent');
            if (nutritionalInfoContent) {
                nutritionalInfoContent.innerHTML = `
                    <p class="nutritional-text">Nutritional Data for: ${record.name}</p>
                    <p class="nutritional-text">Energy: ${nutritionalData.energy.toFixed(2)} kcal, Protein: ${nutritionalData.protein.toFixed(2)}g, Fat: ${nutritionalData.fat.toFixed(2)}g, Fiber: ${nutritionalData.fiber.toFixed(2)}g</p>
                `;
            }

            document.getElementById('nutritionalDetailsModal').style.display = 'block';
        }
    }

    // Improved displayNutritionalData with error handling
    function displayNutritionalData(mealId, mealWeight) {
        try {
            const nutritionalDataString = localStorage.getItem(`nutritionalData_${mealId}`);
            if (!nutritionalDataString) {
                document.getElementById('nutritionalDisplay').innerHTML = 'Nutritional data not available.';
                return;
            }

            const nutritionalData = JSON.parse(nutritionalDataString);
            console.log(nutritionalData); // Diagnostic log

            // Validate mealWeight as a number
            const validMealWeight = parseFloat(mealWeight);
            if (isNaN(validMealWeight) || validMealWeight <= 0) {
                document.getElementById('nutritionalDisplay').innerHTML = 'Invalid meal weight.';
                return;
            }

            // Display the calculated nutritional data

        } catch (error) {
            console.error('Error displaying nutritional data:', error);
            document.getElementById('nutritionalDisplay').innerHTML = 'Error loading nutritional data.';
        }
    }

    function calculateNutritionalData(selectedMeal, mealWeight) {
        const nutritionalData = JSON.parse(localStorage.getItem(`nutritionalData_${selectedMeal.id}`));
        const calculatedValues = {};

        // Calculate nutritional values based on meal weight in Meal Tracker and Meal Creator
        for (const nutrient in nutritionalData) {
            if (nutritionalData.hasOwnProperty(nutrient)) {
                // Get nutritional value per 100g from Meal Creator data
                const valuePer100g = nutritionalData[nutrient];

                // Calculate nutritional value based on meal weight in Meal Tracker
                const calculatedValue = (parseFloat(valuePer100g) / 100) * parseFloat(mealWeight);

                calculatedValues[nutrient] = calculatedValue;
            }
        }

        return calculatedValues;
    }

    window.showNutritionalData = showNutritionalData;
    window.deleteMealRecord = function (event) {
        if (event.target.classList.contains('delete-icon')) {
            const mealRecord = event.target.closest('.mealRecord');
            const recordId = mealRecord.dataset.recordId;

            // Remove the meal record from localStorage
            let records = JSON.parse(localStorage.getItem('mealIntakeRecords')) || [];
            records = records.filter(record => record.id != recordId);
            localStorage.setItem('mealIntakeRecords', JSON.stringify(records));

            // Remove the meal record from the display
            mealRecord.remove();
        }
    };

    // Define the editMealRecord function
    window.editMealRecord = function (recordId) {
        // Retrieve the record from localStorage based on recordId
        const records = JSON.parse(localStorage.getItem('mealIntakeRecords')) || [];
        const record = records.find(record => record.id === recordId);

        // Populate the tracker modal with the record details for editing
        trackerPopup(true, recordId); // Set editMode to true and pass recordId
        document.getElementById('mealName').value = record.name;
        document.getElementById('mealWeight').value = record.weight;
        document.getElementById('intakeDate').value = record.date;
        document.getElementById('intakeTime').value = record.time;
        document.getElementById('location').value = record.location;
    };

});


const apiKey = '154093';

// Helper function for API requests with apiKey
function fetchWithApiKey(url, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: { 'X-API-Key': apiKey }
    };
    return fetch(url, { ...defaultOptions, ...options })
        .then(response => response.ok ? response.json() : Promise.reject(`Error: ${response.status}`));
}

// open
window.openIngredientOnlyModal = function () {
    document.getElementById('ingredientOnly').style.display = 'block';
};

// close module
window.closeIngredientOnlyModal = function () {
    document.getElementById('ingredientOnly').style.display = 'none';
};

// Call to setup search button in ingredient modal
function setupSearchButtonAll() {
    const searchButtonAll = document.getElementById('searchButtonAll');
    if (searchButtonAll) {
        searchButtonAll.addEventListener('click', function () {
            openIngredientOnlyModal(); // Åbn modalen til at tilføje ingredienser
        });
    }
}

// Call the function to set up the search button
setupSearchButtonAll();

function getFoodItemsBySearch(query) {
    const url = `https://nutrimonapi.azurewebsites.net/api/FoodItems/BySearch/${query}`;
    return fetchWithApiKey(url);
}

async function searchIngredients() {
    const ingredientName = document.getElementById('ingredientName').value;
    if (ingredientName.trim() === '') {
        alert('Please enter an ingredient name to search.');
        return;
    }

    try {
        // Perform search using API call
        const response = await getFoodItemsBySearch(ingredientName);
        const foodItems = response.data; // Assumption: The API returns an array of food item objects

        // Show search results in the existing modal
        const searchResultsContainer = document.getElementById('searchResultsContainer');
        searchResultsContainer.innerHTML = ''; // Clear previous search results

        foodItems.forEach(foodItem => {
            const resultElement = document.createElement('div');
            resultElement.textContent = foodItem.name; // Assumption: Food item object has a property "name"
            searchResultsContainer.appendChild(resultElement);
        });

        // Show the search results in the existing modal
        document.getElementById('searchResultsModal').style.display = 'block';
    } catch (error) {
        console.error('Error fetching food items:', error);
        alert('An error occurred while fetching food items. Please try again later.');
    }
}

// Add event listener to search button in the existing modal
const searchButtonIngredientModal = document.getElementById('searchButtonIngredientModal');
if (searchButtonIngredientModal) {
    searchButtonIngredientModal.addEventListener('click', searchIngredients);
}
