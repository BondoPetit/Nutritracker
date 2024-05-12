document.addEventListener("DOMContentLoaded", function () {
    const userID = getUserIDFromURL();
    let mealIntakes = [];
    let meals = [];

    function getUserIDFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('userID'), 10);
    }

    async function fetchMeals() {
        try {
            const response = await fetch(`/api/getMeals?userID=${userID}`);
            meals = await response.json();
        } catch (error) {
            console.error("Error fetching meals:", error);
            alert("An error occurred while fetching meals. Please try again.");
        }
    }

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

    window.trackerPopup = async function (editMode = false, recordId = null) {
        document.getElementById('mealPopUp').style.display = 'block';
        await populateTrackerModal(editMode, recordId);
        fillCurrentDateTime();
        fetchCurrentLocation();
    };

    window.closeTrackerPopup = function () {
        document.getElementById('mealPopUp').style.display = 'none';
    };

    window.closeNutritionalInfoModal = function () {
        document.getElementById('nutritionalDetailsModal').style.display = 'none';
    };

    window.saveTracker = function () {
        const mealID = parseInt(document.getElementById('mealName').value, 10);
        const mealName = document.getElementById('mealName').selectedOptions[0].textContent;
        const mealWeight = parseFloat(document.getElementById('mealWeight').value);
        const intakeDate = document.getElementById('intakeDate').value;
        let intakeTime = document.getElementById('intakeTime').value;
        const location = document.getElementById('location').value;
        const userID = getUserIDFromURL();
        const editMode = document.getElementById('mealIntakeForm').getAttribute('data-edit-mode') === 'true';

        const newRecord = {
            userID: userID,
            mealID: mealID,
            name: mealName,
            weight: mealWeight,
            date: intakeDate,
            time: intakeTime,
            location: location,
        };

        if (editMode) {
            newRecord.id = parseInt(document.getElementById('mealIntakeForm').getAttribute('data-record-id'), 10);
        }

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


    async function populateTrackerModal(editMode, recordId = null) {
        try {
            await fetchMeals();
            const mealSelectorHTML = meals.map(meal => `<option value="${meal.MealID}">${meal.Name}</option>`).join('');
            const modalContent = document.querySelector('#mealPopUp .modal-content');
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

            const editButton = document.createElement('button');
            editButton.classList.add('edit-button');
            editButton.innerHTML = '<i class="fas fa-pencil-alt edit-icon"></i>';
            editButton.addEventListener('click', function () {
                trackerPopup(true, record.MealIntakeID);
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
    }

    function showNutritionalData(recordId) {
        const record = mealIntakes.find(record => record.MealIntakeID === recordId);

        if (record && record.Calories !== undefined) {
            const nutritionalData = {
                energy: record.Energy,
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

    fetchMealIntakes();


    window.selectedIngredients = [];


    // Function to open the ingredient intake modal
    window.openIngredientOnlyModal = function () {
        document.getElementById('ingredientOnly').style.display = 'block';
        fetchCurrentLocation();
    };

    window.closeIngredientOnlyModal = function () {
        document.getElementById('ingredientOnly').style.display = 'none';
    };


    window.saveIngredient = function () {
        event.preventDefault(); // Prevent the default behavior of changing the URL
        const userID = getUserIDFromURL();
        const intakeDate = document.getElementById('intakeDate').value;
    
        window.selectedIngredients.forEach(ingredient => {
            // Get weight from input field
            const weight = parseFloat(document.getElementById('ingredientWeight').value); // Updated ID to 'ingredientWeight'
    
            const payload = {
                userID: userID,
                ingredientName: ingredient.ingredientName,
                weight: weight, // Update with the value from the input field
                intakeDate: intakeDate,
                location: document.getElementById('location').value,
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
    
        window.selectedIngredients = [];
    };
    
    
    

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

    window.fetchAndDisplayNutrition = function (ingredientId) {
        fetch(`/api/getNutritionData?id=${ingredientId}`)
            .then(response => response.json())
            .then(data => {
                console.log('Fetched Nutrition Data:', data);
                const form = document.getElementById('ingredientIntakeForm');
                form.dataset.nutrition = JSON.stringify(data);
            })
            .catch(error => console.error('Failed to fetch nutrition data:', error));
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


});
