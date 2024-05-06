document.addEventListener("DOMContentLoaded", function () {
    const userID = getUserIDFromURL();
    let mealIntakes = [];
    let meals = [];

    function getUserIDFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('userID'), 10);
    }

    // Fetch all meals for the current user
    async function fetchMeals() {
        try {
            const response = await fetch(`/api/getMeals?userID=${userID}`);
            meals = await response.json();
        } catch (error) {
            console.error("Error fetching meals:", error);
            alert("An error occurred while fetching meals. Please try again.");
        }
    }

    // Fetch all meal intakes for the current user
    function fetchMealIntakes() {
        fetch(`/api/getMealIntakes?userID=${userID}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch meal intakes');
                }
                return response.json();
            })
            .then(data => {
                mealIntakes = data;
                displayMeals();
            })
            .catch(error => {
                console.error("Error fetching meal intakes:", error);
                alert("An error occurred while fetching meal intakes. Please try again.");
            });
    }

    // Open the tracker modal
    window.trackerPopup = async function (editMode = false, recordId = null) {
        document.getElementById('mealPopUp').style.display = 'block';
        await populateTrackerModal(editMode, recordId);
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
        const mealID = parseInt(document.getElementById('mealName').value, 10);
        const mealName = document.getElementById('mealName').selectedOptions[0].textContent;
        const mealWeight = parseFloat(document.getElementById('mealWeight').value);
        const intakeDate = document.getElementById('intakeDate').value;
        // Format time to "HH:mm:ss"
        let intakeTime = document.getElementById('intakeTime').value;
        intakeTime = intakeTime.length === 5 ? `${intakeTime}:00` : intakeTime;
        const location = document.getElementById('location').value;



        // Calculate nutritional data based on the selected meal and its weight
        const selectedMeal = meals.find(meal => meal.MealID === mealID);
        const nutritionalData = calculateNutritionalData(selectedMeal, mealWeight);

        // Check if nutritional data is available
        if (!nutritionalData || !nutritionalData.energy) {
            alert("Missing nutritional information for selected meal.");
            console.error("Missing nutritional information for selected meal:", selectedMeal);
            return;
        }

        // Construct the new record object including nutritional data
        const newRecord = {
            id: selectedMeal ? selectedMeal.MealIntakeID : null,
            userID: selectedMeal.UserID,
            mealID: selectedMeal.MealID,
            name: selectedMeal.Name,
            weight: mealWeight,
            date: intakeDate,
            time: intakeTime,
            location: location,
            nutritionalData: nutritionalData
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
                    fetchMealIntakes();
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

        if (dateInput && timeInput) {
            dateInput.value = now.toISOString().split('T')[0];
            timeInput.value = now.toTimeString().slice(0, 5);
        }
    }

    // Fetch the current location
    function fetchCurrentLocation() {
        const locationInput = document.getElementById('location');
        if (locationInput && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                locationInput.value = `Lat: ${position.coords.latitude}, Long: ${position.coords.longitude}`;
            }, function (error) {
                console.error(error);
                alert("Error fetching location. Please allow location access and try again.");
            }, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        } else {
            if (locationInput) {
                locationInput.value = 'Geolocation not supported';
            }
            alert("Geolocation is not supported by this browser.");
        }
    }

    // Populate the tracker modal with form inputs for intake tracking
    async function populateTrackerModal(editMode, recordId = null) {
        try {
            // Fetch meals
            await fetchMeals();

            // Create options for the meal selector
            const mealSelectorHTML = meals.map(meal => `<option value="${meal.MealID}">${meal.Name}</option>`).join('');

            // Construct the tracker modal
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
                <button type="button" onclick="saveTracker(${recordId})">Save Meal Intake</button>
            </form>`;

            // If in edit mode, populate fields with existing data
            if (editMode && recordId !== null) {
                const response = await fetch(`/api/getMealIntake?id=${recordId}`);
                const record = await response.json();

                const mealNameElem = document.getElementById('mealName');
                const mealWeightElem = document.getElementById('mealWeight');
                const intakeDateElem = document.getElementById('intakeDate');
                const intakeTimeElem = document.getElementById('intakeTime');
                const locationElem = document.getElementById('location');

                if (mealNameElem) mealNameElem.value = record.MealID || '';
                if (mealWeightElem) mealWeightElem.value = record.Weight || '';
                if (intakeDateElem) intakeDateElem.value = record.IntakeDate.split('T')[0] || '';
                if (intakeTimeElem) intakeTimeElem.value = record.IntakeTime.split('T')[1].substring(0, 5) || '';
                if (locationElem) locationElem.value = record.Location || '';
            }

            setupMealSelectionChange();
        } catch (error) {
            console.error('Error fetching meals:', error);
        }
    }

    // Display the meals from database
    function displayMeals() {
        const recordsContainer = document.getElementById('recordsContainer');

        // Clear existing records to prevent duplication
        recordsContainer.innerHTML = '';

        // Iterate over records and append them to the container
        mealIntakes.forEach(record => {
            const recordElement = document.createElement('div');
            recordElement.classList.add('mealRecord');
            recordElement.dataset.recordId = record.MealIntakeID;

            const textElement = document.createElement('p');
            textElement.textContent = `${record.MealName}  ${record.Weight}g  ${record.IntakeDate}  ${record.IntakeTime} Location: ${record.Location}`;
            recordElement.appendChild(textElement);

            const buttonsContainer = document.createElement('div');
            buttonsContainer.classList.add('buttons-container');

            const editButton = document.createElement('button');
            editButton.classList.add('edit-button');
            editButton.innerHTML = '<i class="fas fa-pencil-alt edit-icon"></i>';
            editButton.addEventListener('click', function () {
                editMealRecord(record.MealIntakeID);
            });
            buttonsContainer.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-button');
            deleteButton.innerHTML = '<i class="fas fa-trash-alt delete-icon"></i>';
            deleteButton.addEventListener('click', function () {
                deleteMealRecord(record.MealIntakeID);
            });
            buttonsContainer.appendChild(deleteButton);

            const nutritionalDataButton = document.createElement('button');
            nutritionalDataButton.classList.add('show-nutritional-data-button');
            nutritionalDataButton.innerHTML = '<i class="fas fa-book book-icon"></i>';
            nutritionalDataButton.dataset.recordId = record.MealIntakeID;
            nutritionalDataButton.addEventListener('click', function () {
                showNutritionalData(record.MealIntakeID);
            });
            buttonsContainer.appendChild(nutritionalDataButton);

            recordElement.appendChild(buttonsContainer);
            recordsContainer.appendChild(recordElement);
        });

        recordsContainer.addEventListener('click', function (event) {
            if (event.target.classList.contains('edit-icon')) {
                const recordId = parseInt(event.target.closest('.mealRecord').dataset.recordId);
                editMealRecord(recordId);
            }
        });
    }

    function setupMealSelectionChange() {
        const mealSelector = document.getElementById('mealName');
        const mealWeightInput = document.getElementById('mealWeight');
        if (mealSelector && mealWeightInput) {
            mealSelector.addEventListener('change', function () {
                const selectedMealID = parseInt(this.value, 10);
                const selectedMeal = meals.find(meal => meal.MealID === selectedMealID);

                if (selectedMeal) {
                    if (mealWeightInput.value.trim() !== '') {
                        displayNutritionalData(selectedMeal.MealIntakeID, parseFloat(mealWeightInput.value));
                    }
                }
            });

            mealWeightInput.addEventListener('input', function () {
                const selectedMealID = parseInt(mealSelector.value, 10);
                const selectedMeal = meals.find(meal => meal.MealID === selectedMealID);

                if (selectedMeal) {
                    if (this.value.trim() !== '') {
                        displayNutritionalData(selectedMeal.MealIntakeID, parseFloat(this.value));
                    }
                }
            });
        } else {
            console.error('Meal selector element or meal weight input not found.');
        }
    }

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
            const validMealWeight = parsefloat(mealWeight);
            if (isnan(validMealWeight) || validMealWeight <= 0) {
                document.getElementByid('nutritionaldisplay').innerhtml = 'Invalid meal weight.';
                return;
            }

            // calculate nutritional values
            const nutritionaldata = calculatenutritionaldata(selectedmeal, validmealweight);

            // display the calculated nutritional data
            document.getElementByid('nutritionaldisplay').innerhtml = `
                <p class="nutritional-text">Nutritional Data for: ${selectedMeal.MealName}</p>
                <p class="nutritional-text">Energy: ${nutritionaldata.energy.tofixed(2)} kcal, Protein: ${nutritionaldata.protein.tofixed(2)}g, Fat: ${nutritionaldata.fat.tofixed(2)}g, Fiber: ${nutritionaldata.fiber.tofixed(2)}g</p>
            `;
        } catch (error) {
            console.error('Error displaying nutritional data:', error);
            document.getElementByid('nutritionaldisplay').innerhtml = 'Error loading nutritional data.';
        }
    }

    // Improved calculateNutritionalData function with error handling
    function calculateNutritionalData(selectedMeal, mealWeight) {
        if (!selectedMeal || !mealWeight) {
            return null;
        }

        // Ensure the selectedMeal contains the necessary nutritional info
        if (selectedMeal.Calories === undefined || selectedMeal.Protein === undefined || selectedMeal.Fat === undefined || selectedMeal.Fiber === undefined) {
            console.error("Invalid meal selected:", selectedMeal);
            return null;
        }

        const calculatedValues = {};

        // Calculate nutritional values based on meal weight
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

    window.editMealRecord = function (mealIntakeID) {
        trackerPopup(true, mealIntakeID);
    };

    fetchMealIntakes();
});
