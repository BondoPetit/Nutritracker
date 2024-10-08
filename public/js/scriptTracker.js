// Wait for the DOM content to be fully loaded before executing the code
document.addEventListener("DOMContentLoaded", function () {
    // Get the user ID from the URL query parameter
    const userID = getUserIDFromURL();
    // Initialize arrays to store meal intakes and meals
    let mealIntakes = [];
    let meals = [];

    // Function to extract the user ID from the URL query parameter
    function getUserIDFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('userID'), 10);
    }

    // Asynchronous function to fetch meals from the server
    async function fetchMeals() {
        try {
            const response = await fetch(`/api/getMeals?userID=${userID}`);
            meals = await response.json();
        } catch (error) {
            console.error("Error fetching meals:", error);
            alert("An error occurred while fetching meals. Please try again.");
        }
    }

    // Function to fetch meal intakes from the server
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

    // Function to display the meal intake popup
    window.trackerPopup = async function (editMode = false, recordId = null) {
        document.getElementById('mealPopUp').style.display = 'block';
        await populateTrackerModal(editMode, recordId);
        fillCurrentDateTime();
        fetchCurrentLocation();
    };

    // Function to close the meal intake popup
    window.closeTrackerPopup = function () {
        document.getElementById('mealPopUp').style.display = 'none';
    };

    // Function to close the nutritional info modal
    window.closeNutritionalInfoModal = function () {
        document.getElementById('nutritionalDetailsModal').style.display = 'none';
    };

    // Function to save a meal intake
    window.saveTracker = function () {
        // Retrieve input values
        const mealID = parseInt(document.getElementById('mealName').value, 10);
        const mealName = document.getElementById('mealName').selectedOptions[0].textContent;
        const mealWeight = parseFloat(document.getElementById('mealWeight').value);
        const intakeDate = document.getElementById('intakeDate').value;
        let intakeTime = document.getElementById('intakeTime').value;
        const location = document.getElementById('location').value;
        const userID = getUserIDFromURL();
        const editMode = document.getElementById('mealIntakeForm').getAttribute('data-edit-mode') === 'true';

        // Create a new record object
        const newRecord = {
            userID: userID,
            mealID: mealID,
            name: mealName,
            weight: mealWeight,
            date: intakeDate,
            time: intakeTime,
            location: location,
        };

        // Add record ID if in edit mode
        if (editMode) {
            newRecord.id = parseInt(document.getElementById('mealIntakeForm').getAttribute('data-record-id'), 10);
        }

        // Send a POST request to save the meal intake
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

    // Function to fill current date and time in the form
    function fillCurrentDateTime() {
        const now = new Date();
        const dateInput = document.getElementById('intakeDate');
        const timeInput = document.getElementById('intakeTime');
        const formattedTime = now.toTimeString().split(' ')[0];

        if (dateInput && timeInput) {
            dateInput.value = now.toISOString().split('T')[0];
            timeInput.value = formattedTime;
        }
    }

    // Function to fetch current location and display it in the form
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

    // Asynchronous function to populate the meal intake modal
    async function populateTrackerModal(editMode, recordId = null) {
        try {
            // Fetch meals
            await fetchMeals();
            // Generate HTML for meal selector
            const mealSelectorHTML = meals.map(meal => `<option value="${meal.MealID}">${meal.Name}</option>`).join('');
            // Get the modal content element
            const modalContent = document.querySelector('#mealPopUp .modal-content');
            // Populate modal content
            modalContent.innerHTML = `<span class="close" onclick="closeTrackerPopup()">&times;</span>
            <h2>${editMode ? 'Edit' : 'Add'} Meal Intake</h2>
            <form id="mealIntakeForm" data-edit-mode="${editMode}" data-record-id="${recordId}">
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
                <div id="nutritionalDisplay"></div>
                <button type="button" onclick="saveTracker()">Save Meal Intake</button>
            </form>`;

            // Pre-fill form fields for editing existing meal intakes
            if (editMode && recordId !== null) {
                const response = await fetch(`/api/getMealIntake?id=${recordId}`);
                const record = await response.json();

                const mealNameElem = document.getElementById('mealName');
                const mealWeightElem = document.getElementById('mealWeight');
                const intakeDateElem = document.getElementById('intakeDate');
                const intakeTimeElem = document.getElementById('intakeTime');
                const locationElem = document.getElementById('location');

                const dateValue = record.IntakeDate ? record.IntakeDate.split('T')[0] : '';
                let timeValue = '';  // Initialize with an empty string

                if (record.IntakeTime && record.IntakeTime.match(/^\d{2}:\d{2}/)) {
                    timeValue = record.IntakeTime.substring(0, 5);
                }

                if (mealNameElem) mealNameElem.value = record.MealID || '';
                if (mealWeightElem) mealWeightElem.value = record.Weight || '';
                if (intakeDateElem) intakeDateElem.value = dateValue;
                if (intakeTimeElem) intakeTimeElem.value = timeValue;  // This ensures only valid times are set
                if (locationElem) locationElem.value = record.Location || '';
            }
        } catch (error) {
            console.error('Error fetching meals:', error);
        }
    }

    // Function to display meal intake records
    function displayMeals() {
        const recordsContainer = document.getElementById('recordsContainer');
        recordsContainer.innerHTML = '';

        mealIntakes.forEach(record => {
            const recordElement = document.createElement('div');
            recordElement.classList.add('mealRecord');
            recordElement.dataset.recordId = record.MealIntakeID;

            const intakeDate = new Date(record.IntakeDate).toLocaleDateString();
            const intakeTime = new Date(record.IntakeTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

            const textElement = document.createElement('p');
            textElement.textContent = `${record.MealName}  ${record.Weight}g  ${intakeDate}  ${intakeTime} Location: ${record.Location}`;
            recordElement.appendChild(textElement);

            const buttonsContainer = document.createElement('div');
            buttonsContainer.classList.add('buttons-container');

            // Edit button
            const editButton = document.createElement('button');
            editButton.classList.add('edit-button');
            editButton.innerHTML = '<i class="fas fa-pencil-alt edit-icon"></i>';
            editButton.addEventListener('click', function () {
                trackerPopup(true, record.MealIntakeID);
            });
            buttonsContainer.appendChild(editButton);

            // Delete button
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-button');
            deleteButton.innerHTML = '<i class="fas fa-trash-alt delete-icon"></i>';
            deleteButton.addEventListener('click', function () {
                deleteMealRecord(record.MealIntakeID);
            });
            buttonsContainer.appendChild(deleteButton);

            // Nutritional data button
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
    }

    // Function to show nutritional data for a meal intake
    function showNutritionalData(recordId) {
        const record = mealIntakes.find(record => record.MealIntakeID === recordId);

        if (record && record.Calories !== undefined) {
            const nutritionalData = {
                energy: record.Calories || 0,
                protein: record.Protein || 0,
                fat: record.Fat || 0,
                fiber: record.Fiber || 0
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

    // Function to delete a meal intake record
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

    // Fetch meal intakes when the page loads
    fetchMealIntakes();

    // Initialize array to store selected ingredients
    window.selectedIngredients = [];

    // Function to close the ingredient modal
    window.closeIngredientOnlyModal = function () {
        document.getElementById('ingredientOnly').style.display = 'none';
    };

    // Function to save selected ingredients
    window.saveIngredient = function (event) {
        if (event) {
            event.preventDefault(); // Prevent the default behavior of form submission
        }

        if (window.selectedIngredients.length === 0) {
            alert('Please select at least one ingredient.');
            return;
        }

        const userID = getUserIDFromURL();
        const intakeDate = document.getElementById('intakeDate').value;
        const weight = parseFloat(document.getElementById('ingredientWeight').value);
        const location = document.getElementById('location').value;


        // Iterate through each selected ingredient and save the intake
        window.selectedIngredients.forEach(ingredient => {
            const payload = {
                userID: userID, // Include userID in the payload
                ingredientName: ingredient.ingredientName,
                weight: weight,
                intakeDate: intakeDate,
                location: location,
                nutritionalData: {
                    energy: ingredient.nutrition ? ingredient.nutrition.energy : 0,
                    protein: ingredient.nutrition ? ingredient.nutrition.protein : 0,
                    fat: ingredient.nutrition ? ingredient.nutrition.fat : 0,
                    fiber: ingredient.nutrition ? ingredient.nutrition.fiber : 0
                }
            };

            fetch('/api/saveIngredientIntake', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log("Ingredient saved successfully.");
                        alert('Ingredient saved successfully.');
                    } else {
                        throw new Error('Failed to save the ingredient intake');
                    }
                })
                .catch(error => {
                    console.error('Error saving the ingredient intake:', error);
                    alert('Error saving the ingredient intake. Please check the console for more details.');
                });
        });

        // Reset selected ingredients array after saving
        window.selectedIngredients = [];
    };





    //IngredientIntakes



    // Function to search for ingredient name
    function getFoodItemsBySearch(query) {
        const url = `https://nutrimonapi.azurewebsites.net/api/FoodItems/BySearch/${query}`;
        return fetchWithApiKey(url);
    }

    // Helper function for API requests with apiKey
    async function fetchWithApiKey(url, options = {}) {
        const apiKey = '150493';
        const defaultOptions = {
            method: 'GET',
            headers: { 'X-API-Key': apiKey }
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            throw new Error(`Error fetching data: ${error.message}`);
        }
    }

    window.fetchAndDisplayNutrition = async function () {
        try {
            const userID = getUserIDFromURL();
            const response = await fetch(`/api/getNutritionData?userID=${userID}`);
            if (!response.ok) {
                throw new Error('Failed to fetch nutrition data');
            }
            const data = await response.json();
            console.log('Fetched Nutrition Data:', data);
            const form = document.getElementById('ingredientIntakeForm');
            form.dataset.nutrition = JSON.stringify(data);
        } catch (error) {
            console.error('Failed to fetch nutrition data:', error);
        }
    }

    // Update search results
    function updateSearchResults(data) {
        const container = document.getElementById("searchResultsContainer");
        container.innerHTML = '';

        data.forEach(item => {
            const resultItem = document.createElement('div');
            resultItem.textContent = item.foodName;
            resultItem.className = 'search-result-item';
            resultItem.onclick = () => selectIngredient(item);  // Add click handler
            container.appendChild(resultItem);
        });
    }




    // Call the function to add time input field to the ingredient-only modal form
    window.openIngredientOnlyModal = function () {
        document.getElementById('ingredientOnly').style.display = 'block';
        fetchCurrentLocation(); // Fetch location when modal is opened
    };


    function selectIngredient(item) {
        fetchNutritionData(item.foodID).then(nutrition => {
            window.selectedIngredients.push({
                ingredientName: item.foodName,
                weight: item.weight,  // Assuming weight is provided elsewhere
                nutrition: nutrition
            });

            // Dynamically create the weight input field
            const weightInput = document.createElement('input');
            weightInput.type = 'number';
            weightInput.placeholder = 'Enter weight';
            weightInput.required = true;
            weightInput.setAttribute('name', 'weight'); // Set the name attribute for form submission
            weightInput.setAttribute('id', 'ingredientWeight'); // Set a unique id for accessing later
            weightInput.setAttribute('min', '0'); // Optionally, set minimum value if needed

            // Get the ingredient intake form
            const form = document.getElementById('ingredientIntakeForm');
            if (form) {
                // Add the weight input field to the form
                form.insertBefore(weightInput, form.querySelector('[name="location"]').nextSibling); // Adjust selector as needed
            } else {
                console.error('Ingredient intake form not found.');
            }

            console.log("Selected Ingredients:", window.selectedIngredients);
        });
    }





    // Function to handle the search action
    function handleSearch() {
        const query = document.getElementById('ingredientName').value;
        getFoodItemsBySearch(query)
            .then(data => {
                updateSearchResults(data);
            })
            .catch(error => {
                console.error('Error searching for ingredient:', error);
                alert('An error occurred while searching for the ingredient. Please try again.');
            });
    }

    // Function to fetch nutrition data based on FoodID
    window.fetchNutritionData = async function (foodID) {
        const sortKeys = {
            '1030': 'energy',
            '1110': 'protein',
            '1240': 'fat',
            '1310': 'fiber'
        };

        const promises = Object.keys(sortKeys).map(sortKey => {
            const url = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/${sortKey}`;
            return fetchWithApiKey(url).then(data => {
                const value = parseFloat(data[0]?.resVal.replace(',', '.')) || 0;
                return { [sortKeys[sortKey]]: value };
            });
        });

        return Promise.all(promises).then(results => results.reduce((acc, result) => Object.assign(acc, result), {}));
    }



    document.getElementById('searchButton').addEventListener('click', handleSearch);





    // Function to fetch and display ingredient intakes
    async function fetchAndDisplayIngredientIntakes() {
        try {
            const response = await fetch(`/api/getIngredientIntakes?userID=${userID}`);
            const ingredientIntakes = await response.json();
            displayIngredientIntakes(ingredientIntakes);
        } catch (error) {
            console.error("Error fetching ingredient intakes:", error);
            alert("An error occurred while fetching ingredient intakes. Please try again.");
        }
    }


    // Function to display ingredient intakes
    function displayIngredientIntakes(ingredientIntakes) {
        const recordsContainer = document.getElementById('ingredientRecordsContainer');
        recordsContainer.innerHTML = '';

        ingredientIntakes.forEach(record => {
            const recordElement = document.createElement('div');
            recordElement.classList.add('ingredientRecord');
            recordElement.dataset.recordId = record.IngredientIntakeID;

            const intakeDate = new Date(record.IntakeDate).toLocaleDateString();

            const textElement = document.createElement('p');
            textElement.textContent = `${record.IngredientName}  ${record.Weight}g  ${intakeDate}  Location: ${record.Location}`;
            recordElement.appendChild(textElement);

            const buttonsContainer = document.createElement('div');
            buttonsContainer.classList.add('buttons-container');

            const editButton = document.createElement('button');
            editButton.classList.add('edit-button');
            editButton.innerHTML = '<i class="fas fa-pencil-alt edit-icon"></i>';
            editButton.addEventListener('click', function () {
                // Handle edit functionality here
                trackerPopup(true, record.IngredientIntakeID);
            });
            buttonsContainer.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-button');
            deleteButton.innerHTML = '<i class="fas fa-trash-alt delete-icon"></i>';
            deleteButton.addEventListener('click', function (event) {
                const recordId = event.target.closest('.ingredientRecord').dataset.recordId;
                deleteIngredientRecord(recordId);
            });
            buttonsContainer.appendChild(deleteButton);

            recordElement.appendChild(buttonsContainer);
            recordsContainer.appendChild(recordElement);
        });
    }

    // Define the function to delete an ingredient record
    const deleteIngredientRecord = async (ingredientIntakeID) => {
        try {
            const userID = getUserIDFromURL(); // Get the UserID from the URL
            const response = await fetch(`/api/deleteIngredientIntake?userID=${userID}&id=${ingredientIntakeID}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // If deletion is successful, remove the deleted record from the UI
                const deletedRecordElement = document.querySelector(`.ingredientRecord[data-record-id="${ingredientIntakeID}"]`);
                if (deletedRecordElement) {
                    deletedRecordElement.remove();
                }
                console.log('Ingredient intake deleted successfully.');
            } else {
                // Handle error response
                const errorData = await response.json();
                console.error('Error deleting ingredient intake:', errorData.error);
                // Display error message to the user or handle the error appropriately
            }
        } catch (error) {
            // Handle network errors or other exceptions
            console.error('Error deleting ingredient intake:', error);
            // Display error message to the user or handle the error appropriately
        }
    };







    // Call the function to fetch and display ingredient intakes
    fetchAndDisplayIngredientIntakes();






});
