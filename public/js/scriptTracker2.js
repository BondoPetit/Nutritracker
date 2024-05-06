document.addEventListener("DOMContentLoaded", function () {
    const userID = getUserIDFromURL(); // Add a function to extract userID from URL
    let mealIntakes = [];

    function getUserIDFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('userID'), 10);
    }

    // Fetch all meal intakes for the current user
    function fetchMealIntakes() {
        fetch(`/api/getMealIntakes?userID=${userID}`)
            .then(response => response.json())
            .then(data => {
                mealIntakes = data;
                displayMeals(); // Update the displayed meals
            })
            .catch(error => {
                console.error("Error fetching meal intakes:", error);
                alert("An error occurred while fetching meal intakes. Please try again.");
            });
    }

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
        const mealWeight = parseFloat(document.getElementById('mealWeight').value);
        const intakeDate = document.getElementById('intakeDate').value;
        const intakeTime = document.getElementById('intakeTime').value;
        const location = document.getElementById('location').value;

        // Calculate nutritional data based on the selected meal and its weight
        const selectedMeal = mealIntakes.find(meal => meal.MealName === mealName);
        const nutritionalData = calculateNutritionalData(selectedMeal, mealWeight);

        // Construct the new record object including nutritional data
        const newRecord = {
            id: selectedMeal ? selectedMeal.MealIntakeID : null,
            userID: userID,
            mealID: selectedMeal ? selectedMeal.MealID : null,
            name: mealName,
            weight: mealWeight,
            date: intakeDate,
            time: intakeTime,
            location: location,
            nutritionalData: nutritionalData // Include the calculated nutritional data
        };

        fetch('/api/saveMealIntake', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newRecord)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    closeTrackerPopup();
                    fetchMealIntakes(); // Refresh the list of meals
                } else {
                    throw new Error('Failed to save the meal intake');
                }
            })
            .catch(error => {
                console.error('Error saving the meal intake:', error);
                alert('An error occurred while saving the meal intake. Please try again.');
            });
    };

    // Fetch and fill the current date and time
    function fillCurrentDateTime() {
        const now = new Date();
        const dateInput = document.getElementById('intakeDate');
        const timeInput = document.getElementById('intakeTime');

        // Ensure the format is YYYY-MM-DD for the date input to recognize it
        dateInput.value = now.toISOString().split('T')[0]; // Set in YYYY-MM-DD format
        timeInput.value = now.toTimeString().slice(0, 5); // HH:MM
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
    function populateTrackerModal(editMode, recordId = null) {
        const modalContent = document.querySelector('#mealPopUp .modal-content');
        const savedMeals = mealIntakes;
        const mealSelectorHTML = savedMeals.map(meal => `<option value="${meal.MealName}">${meal.MealName}</option>`).join('');

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

        // Pre-fill the form for editing mode
        if (editMode && recordId !== null) {
            const record = savedMeals.find(record => record.MealIntakeID === recordId);
            if (record) {
                document.getElementById('mealName').value = record.MealName;
                document.getElementById('mealWeight').value = record.Weight;
                document.getElementById('intakeDate').value = record.IntakeDate;
                document.getElementById('intakeTime').value = record.IntakeTime;
                document.getElementById('location').value = record.Location;
            }
        }

        // Call the setupMealSelectionChange function to ensure the meal selection change listener is set up
        setupMealSelectionChange();
    }

    // Display the meals from localStorage
    function displayMeals() {
        const recordsContainer = document.getElementById('recordsContainer');

        // Clear existing records to prevent duplication
        recordsContainer.innerHTML = '';

        // Iterate over records and append them to the container
        mealIntakes.forEach(record => {
            const recordElement = document.createElement('div');
            recordElement.classList.add('mealRecord'); // Apply the styling class to each record
            recordElement.dataset.recordId = record.MealIntakeID; // Set dataset attribute

            // Create elements for the text and buttons separately
            const textElement = document.createElement('p');
            textElement.textContent = `${record.MealName}  ${record.Weight}g  ${record.IntakeDate}  ${record.IntakeTime} Location: ${record.Location}`;
            recordElement.appendChild(textElement); // Append text to record element

            // Create buttons container
            const buttonsContainer = document.createElement('div');
            buttonsContainer.classList.add('buttons-container');

            // Create edit button
            const editButton = document.createElement('button');
            editButton.classList.add('edit-button');
            editButton.innerHTML = '<i class="fas fa-pencil-alt edit-icon"></i>';
            editButton.addEventListener('click', function () {
                editMealRecord(record.MealIntakeID);
            });
            buttonsContainer.appendChild(editButton); // Append edit button to buttons container

            // Create delete button
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-button');
            deleteButton.innerHTML = '<i class="fas fa-trash-alt delete-icon"></i>';
            deleteButton.addEventListener('click', function () {
                deleteMealRecord(record.MealIntakeID);
            });
            buttonsContainer.appendChild(deleteButton); // Append delete button to buttons container

            // Create nutritional data button
            const nutritionalDataButton = document.createElement('button');
            nutritionalDataButton.classList.add('show-nutritional-data-button');
            nutritionalDataButton.innerHTML = '<i class="fas fa-book book-icon"></i>'; // Add "book-icon" class here
            nutritionalDataButton.dataset.recordId = record.MealIntakeID;
            nutritionalDataButton.addEventListener('click', function () {
                showNutritionalData(record.MealIntakeID);
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

    // Function to handle meal selection change and display nutritional data
    function setupMealSelectionChange() {
        const mealSelector = document.getElementById('mealName');
        const mealWeightInput = document.getElementById('mealWeight');
        if (mealSelector && mealWeightInput) {
            mealSelector.addEventListener('change', function () {
                const selectedMealName = this.value;
                const selectedMeal = mealIntakes.find(meal => meal.MealName === selectedMealName);

                if (selectedMeal) {
                    // Display nutritional data only if weight is provided
                    if (mealWeightInput.value.trim() !== '') {
                        displayNutritionalData(selectedMeal.MealIntakeID, parseFloat(mealWeightInput.value)); // Display nutritional data for the selected meal
                    }
                }
            });

            // Listen for changes in meal weight input
            mealWeightInput.addEventListener('input', function () {
                const selectedMealName = mealSelector.value;
                const selectedMeal = mealIntakes.find(meal => meal.MealName === selectedMealName);

                if (selectedMeal) {
                    // Display nutritional data only if weight is provided
                    if (this.value.trim() !== '') {
                        displayNutritionalData(selectedMeal.MealIntakeID, parseFloat(this.value)); // Display nutritional data for the selected meal
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
        const record = mealIntakes.find(record => record.MealIntakeID === recordId);

        if (record && record.Calories !== undefined) {
            const nutritionalData = {
                energy: record.Calories,
                protein: record.Protein,
                fat: record.Fat,
                fiber: record.Fiber
            };

            const nutritionalInfoContent = document.getElementById('nutritionalInfoContent');
            if (nutritionalInfoContent) {
                nutritionalInfoContent.innerHTML = `
                    <p class="nutritional-text">Nutritional Data for: ${record.MealName}</p>
                    <p class="nutritional-text">Energy: ${nutritionalData.energy.toFixed(2)} kcal, Protein: ${nutritionalData.protein.toFixed(2)}g, Fat: ${nutritionalData.fat.toFixed(2)}g, Fiber: ${nutritionalData.fiber.toFixed(2)}g</p>
                `;
            }

            document.getElementById('nutritionalDetailsModal').style.display = 'block';
        }
    }

    // Improved displayNutritionalData with error handling
    function displayNutritionalData(mealId, mealWeight) {
        try {
            const selectedMeal = mealIntakes.find(meal => meal.MealIntakeID === mealId);
            if (!selectedMeal) {
                document.getElementById('nutritionalDisplay').innerHTML = 'Nutritional data not available.';
                return;
            }

            // Validate mealWeight as a number
            const validMealWeight = parseFloat(mealWeight);
            if (isNaN(validMealWeight) || validMealWeight <= 0) {
                document.getElementById('nutritionalDisplay').innerHTML = 'Invalid meal weight.';
                return;
            }

            // Calculate nutritional values
            const nutritionalData = calculateNutritionalData(selectedMeal, validMealWeight);

            // Display the calculated nutritional data
            document.getElementById('nutritionalDisplay').innerHTML = `
                <p class="nutritional-text">Nutritional Data for: ${selectedMeal.MealName}</p>
                <p class="nutritional-text">Energy: ${nutritionalData.energy.toFixed(2)} kcal, Protein: ${nutritionalData.protein.toFixed(2)}g, Fat: ${nutritionalData.fat.toFixed(2)}g, Fiber: ${nutritionalData.fiber.toFixed(2)}g</p>
            `;
        } catch (error) {
            console.error('Error displaying nutritional data:', error);
            document.getElementById('nutritionalDisplay').innerHTML = 'Error loading nutritional data.';
        }
    }

    function calculateNutritionalData(selectedMeal, mealWeight) {
        const calculatedValues = {};

        // Calculate nutritional values based on meal weight in Meal Tracker and Meal Creator
        calculatedValues.energy = (selectedMeal.Calories / 100) * mealWeight;
        calculatedValues.protein = (selectedMeal.Protein / 100) * mealWeight;
        calculatedValues.fat = (selectedMeal.Fat / 100) * mealWeight;
        calculatedValues.fiber = (selectedMeal.Fiber / 100) * mealWeight;

        return calculatedValues;
    }

    window.showNutritionalData = showNutritionalData;
    window.deleteMealRecord = function (mealIntakeID) {
        fetch(`/api/deleteMealIntake?recordId=${mealIntakeID}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (response.ok) {
                    alert("Meal intake deleted successfully.");
                    mealIntakes = mealIntakes.filter(record => record.MealIntakeID !== mealIntakeID);
                    displayMeals();
                } else {
                    throw new Error('Failed to delete the meal intake');
                }
            })
            .catch(error => {
                console.error('Error deleting the meal intake:', error);
                alert('An error occurred while deleting the meal intake. Please try again.');
            });
    };

    // Define the editMealRecord function
    window.editMealRecord = function (mealIntakeID) {
        // Populate the tracker modal with the record details for editing
        trackerPopup(true, mealIntakeID); // Set editMode to true and pass mealIntakeID
    };

    // Fetch and display meal intakes on initial load
    fetchMealIntakes();
});
