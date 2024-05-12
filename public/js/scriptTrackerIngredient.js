document.addEventListener('DOMContentLoaded', function () {
    // Your JavaScript code here


    // Function to open the ingredient intake modal
    window.openIngredientOnlyModal = function () {
        document.getElementById('ingredientOnly').style.display = 'block';
    };

    window.closeIngredientOnlyModal = function () {
        document.getElementById('ingredientOnly').style.display = 'none';
    };

    window.saveIngredient = function () {
        const ingredientName = document.getElementById('ingredientName').value;
        const ingredientWeightInput = document.getElementById('ingredientWeight');
        const ingredientWeight = parseFloat(ingredientWeightInput.value);
    
        // Check if the parsed weight is a valid number
        if (isNaN(ingredientWeight)) {
            alert('Please enter a valid weight.');
            ingredientWeightInput.focus(); // Set focus back to the weight input field
            return; // Exit the function early
        }
    
        const intakeDate = document.getElementById('intakeDate').value;
        const intakeTime = document.getElementById('intakeTime').value;
        const userID = getUserIDFromURL();
    
        const newIngredient = {
            userID: userID,
            name: ingredientName,
            weight: ingredientWeight,
            date: intakeDate,
            time: intakeTime
        };
    
        fetch('/api/saveIngredientIntake', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newIngredient)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    closeIngredientOnlyModal();
                    // Add any additional logic here after successful save
                } else {
                    throw new Error('Failed to save the ingredient intake');
                }
            })
            .catch(error => {
                console.error('Error saving the ingredient intake:', error);
                alert('An error occurred while saving the ingredient intake. Please try again.');
            });
    };


    // Function to search for ingredient name
    function getFoodItemsBySearch(query) {
        const url = `https://nutrimonapi.azurewebsites.net/api/FoodItems/BySearch/${query}`;
        return fetchWithApiKey(url);
    }

    // Helper function for API requests with apiKey
    async function fetchWithApiKey(url, options = {}) {
        const apiKey = '150493'; // Add your API key here
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


    // Update search results
    function updateSearchResults(data) {
        const container = document.getElementById("searchResultsContainer");
        container.innerHTML = ''; // Clear existing search results

        data.forEach(item => {
            const resultItem = document.createElement('div');
            resultItem.textContent = item.foodName; // Adjust this based on your data structure
            resultItem.className = 'search-result-item';

            // Add click event listener to handle selecting the search result
            resultItem.addEventListener('click', () => addIngredientToMeal(item.foodID, item.foodName)); // Adjust this based on your data structure

            container.appendChild(resultItem);
        });
    }


    // Function to handle the search action
    function handleSearch() {
        const query = document.getElementById('ingredientName').value; // Get the user's search query from the ingredientName input field
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
    function fetchNutritionData(foodID) {
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

    // Function to handle adding an ingredient to meal
    function addIngredientToMeal(foodID, foodName) {
        // Fetch nutrition data for the selected ingredient
        fetchNutritionData(foodID)
            .then(nutritionData => {
                // Check if nutrition data is available
                if (nutritionData) {
                    // Now you have the nutrition data for the selected ingredient
                    // You can use this data to populate your ingredient intake form or perform any other actions
                    console.log('Nutrition Data:', nutritionData);

                    // Example: Populate input fields with nutrition data
                    document.getElementById('energyInput').value = nutritionData.energy;
                    document.getElementById('proteinInput').value = nutritionData.protein;
                    document.getElementById('fatInput').value = nutritionData.fat;
                    document.getElementById('fiberInput').value = nutritionData.fiber;
                } else {
                    // Handle case where nutrition data is not available
                    console.error('Nutrition data not available');
                    alert('Nutrition data for this ingredient is not available. Please try again later.');
                }
            })
            .catch(error => {
                // Handle error when fetching nutrition data
                console.error('Error fetching nutrition data:', error);
                alert('An error occurred while fetching nutrition data. Please try again.');
            });
    }




    // Assuming you have a search button with an ID 'searchButton'
    document.getElementById('searchButton').addEventListener('click', handleSearch);

});