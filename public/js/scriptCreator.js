// Meal Creator with Improved Handling
const apiKey = '154093';
let meals = JSON.parse(localStorage.getItem('meals')) || [];
let mealCounter = meals.length > 0 ? Math.max(...meals.map(meal => meal.id)) + 1 : 1;
let currentMealId = null;
let tempIngredients = []; // Temporary storage for ingredients before a meal is saved

// Helper function for API requests with apiKey
function fetchWithApiKey(url, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: { 'X-API-Key': apiKey }
    };
    return fetch(url, { ...defaultOptions, ...options })
        .then(response => response.ok ? response.json() : Promise.reject(`Error: ${response.status}`));
}

// Open Meal Popup for adding or editing a meal
function openMealPopup(mealId = null) {
    currentMealId = mealId;
    const mealPopup = document.getElementById("mealPopUp");
    const mealNameInput = document.getElementById("mealName");
    const ingredientsContainer = document.getElementById("selectedIngredientsList");

    if (mealPopup && mealNameInput && ingredientsContainer) {
        mealPopup.style.display = "block";
        if (ingredientsContainer) {
            ingredientsContainer.innerHTML = '';
        }

        if (mealId !== null) {
            // If editing an existing meal, populate the meal popup with the existing meal information
            const mealToEdit = meals.find(meal => meal.id === mealId);
            mealNameInput.value = mealToEdit.name;

            // Clear existing ingredients
            tempIngredients = [...mealToEdit.ingredients]; // Ensure tempIngredients is initialized with existing ingredients

            // Populate ingredients
            tempIngredients.forEach(ingredient => {
                const inputContainer = document.createElement('div');
                const nameSpan = document.createElement('span');
                nameSpan.textContent = `${ingredient.name}: `;
                const weightInput = document.createElement('input');
                weightInput.setAttribute('type', 'number');
                weightInput.setAttribute('placeholder', 'Weight in grams');
                weightInput.className = 'ingredient-weight-input';
                weightInput.value = ingredient.weight;
                weightInput.addEventListener('input', () => updateIngredientWeight(mealId, ingredient.id, weightInput.value)); // Add event listener to update weight
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.className = 'delete-btn'; // Add a class name for event delegation
                deleteBtn.dataset.ingredientId = ingredient.id; // Set data attribute for ingredient ID
                deleteBtn.addEventListener('click', () => deleteIngredient(mealId, ingredient.id)); // Add event listener to delete ingredient
                inputContainer.appendChild(nameSpan);
                inputContainer.appendChild(weightInput);
                inputContainer.appendChild(deleteBtn);
                ingredientsContainer.appendChild(inputContainer);
            });
        } else {
            // Clear the meal popup fields for adding a new meal
            mealNameInput.value = '';
            tempIngredients = []; // Clear temporary ingredients when adding a new meal
        }

        // Set up event listener for the search button in the meal modal
        const searchButton = document.getElementById('searchButton');
        if (searchButton) {
            searchButton.addEventListener('click', function () {
                const query = document.getElementById("searchInput").value.trim();
                if (query) {
                    getFoodItemsBySearch(query)
                        .then(data => updateSearchResults(data))
                        .catch(error => console.error("Failed to fetch search results:", error));
                }
            });
        }

        // Attach event listener for delete buttons using event delegation
        ingredientsContainer.addEventListener('click', function (event) {
            if (event.target.classList.contains('delete-btn')) {
                const ingredientId = event.target.dataset.ingredientId;
                deleteIngredient(mealId, ingredientId);
            }
        });
    } else {
        console.error("Failed to find elements for opening meal popup");
    }
}

// Set up event listeners for opening the meal popup when clicking the pen icon
const editMealIcons = document.querySelectorAll('.edit-button');
editMealIcons.forEach(icon => {
    const mealId = parseInt(icon.closest('.meal').id.split('-')[1]);
    if (icon) {
        icon.addEventListener('click', () => {
            openMealPopup(mealId);
        });
    } else {
        console.error("Failed to find edit icon for setting up event listener");
    }
});

function closeMealPopup() {
    document.getElementById("mealPopUp").style.display = "none";
    clearMealCreatorSearchResults(); // Clear search results for meal creator
    clearDisplayedResults()
}

function clearMealCreatorSearchResults() {
    const container = document.getElementById("searchResultsContainer");
    container.innerHTML = ''; // Clear search results
}

function clearDisplayedResults() {
    const resultsContainer = document.getElementById("searchResultsContainerAll");
    resultsContainer.innerHTML = ''; // Clear displayed results
}

// saves meal and calculates nutrition
function saveMeal() {
    const mealNameInput = document.getElementById("mealName");
    const mealName = mealNameInput.value.trim();
    if (mealName === "") {
        alert("Please enter a meal name.");
        return;
    }

    // Start of nutritional data and total weight calculation
    let totalCalories = 0, totalProtein = 0, totalFats = 0, totalFiber = 0, totalWeight = 0;

    tempIngredients.forEach(ingredient => {
        totalCalories += ingredient.nutritionalContent.calories * (ingredient.weight / 100);
        totalProtein += ingredient.nutritionalContent.protein * (ingredient.weight / 100);
        totalFats += ingredient.nutritionalContent.fats * (ingredient.weight / 100);
        totalFiber += ingredient.nutritionalContent.fiber * (ingredient.weight / 100);
        totalWeight += ingredient.weight; // Add the weight of each ingredient to the total weight
    });

    const nutritionalData = {
        calories: totalCalories.toFixed(2),
        protein: totalProtein.toFixed(2),
        fats: totalFats.toFixed(2),
        fiber: totalFiber.toFixed(2),
        totalWeight: totalWeight.toFixed(2) // Include the total weight of the meal
    };

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (currentMealId !== null) {
        const mealIndex = meals.findIndex(meal => meal.id === currentMealId);
        if (mealIndex !== -1) {
            meals[mealIndex].name = mealName;
            meals[mealIndex].ingredients = [...tempIngredients];
            meals[mealIndex].creationDate = formattedDate;
            meals[mealIndex].nutritionalData = nutritionalData;
        }
    } else {
        const newMeal = {
            id: mealCounter++,
            name: mealName,
            ingredients: [...tempIngredients],
            creationDate: formattedDate,
            nutritionalData: nutritionalData
        };
        meals.push(newMeal);
    }

    // Resetting temporary states
    tempIngredients = [];
    localStorage.setItem("meals", JSON.stringify(meals));

    // Clearing form fields and closing the popup
    mealNameInput.value = '';
    document.getElementById("mealPopUp").style.display = "none";
    updateMealDisplay();
    clearMealCreatorSearchResults();
    clearDisplayedResults();
}




function deleteMeal(mealId) {
    meals = meals.filter(meal => meal.id !== parseInt(mealId)); // Ensure mealId is compared correctly
    localStorage.setItem("meals", JSON.stringify(meals));
    updateMealDisplay();
}



function getFoodItemsBySearch(query) {
    const url = `https://nutrimonapi.azurewebsites.net/api/FoodItems/BySearch/${query}`;
    return fetchWithApiKey(url);
}

// Update search results
function updateSearchResults(data) {
    const container = document.getElementById("searchResultsContainer");
    container.innerHTML = '';

    data.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.textContent = item.foodName;
        resultItem.className = 'search-result-item';

        resultItem.addEventListener('click', () => addIngredientToMeal(item.foodID, item.foodName));

        container.appendChild(resultItem);
    });
}

























// Updated to handle ingredient addition properly
function addIngredientToMeal(foodID, foodName) {
    fetchNutritionData(foodID)
        .then(nutritionData => {
            const inputContainer = document.createElement('div');
            const nameSpan = document.createElement('span');
            nameSpan.textContent = `${foodName}: `;

            const weightInput = document.createElement('input');
            weightInput.setAttribute('type', 'number');
            weightInput.setAttribute('placeholder', 'Weight in grams');
            weightInput.className = 'ingredient-weight-input';

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'delete-btn';
            deleteBtn.style.marginLeft = '10px'; // Add some spacing between the input and the delete button
            deleteBtn.onclick = () => {
                inputContainer.remove(); // Remove the ingredient from the DOM
                const ingredientIndex = tempIngredients.findIndex(ingredient => ingredient.name === foodName);
                if (ingredientIndex !== -1) {
                    tempIngredients.splice(ingredientIndex, 1); // Remove the ingredient from the tempIngredients array
                }
            };

            const addBtn = document.createElement('button');
            addBtn.textContent = 'Add';
            addBtn.onclick = () => {
                const weight = parseFloat(weightInput.value);
                if (!weight || weight <= 0) {
                    alert('Please enter a valid weight in grams.');
                    return;
                }
                let multiplier = 1;
                const nutritionalContent = {
                    energy: nutritionData['1030'] * multiplier,
                    protein: nutritionData['1110'] * multiplier,
                    fat: nutritionData['1240'] * multiplier,
                    fiber: nutritionData['1310'] * multiplier,
                };
                const ingredient = {
                    id: foodID,
                    name: foodName,
                    weight: weight,
                    nutritionalContent: nutritionalContent
                };
                tempIngredients.push(ingredient);
                updateTempIngredientsDisplay();
                // Clear the input fields after adding the ingredient
                weightInput.value = '';
            };

            inputContainer.appendChild(nameSpan);
            inputContainer.appendChild(weightInput);
            inputContainer.appendChild(deleteBtn);
            inputContainer.appendChild(addBtn);
            document.getElementById("selectedIngredientsList").appendChild(inputContainer);
        })
        .catch(error => console.error("Failed to fetch nutrition data for foodID:", foodID, error));
}

//Update ingrediens display
function updateTempIngredientsDisplay() {
    const container = document.getElementById("selectedIngredientsList");
    container.innerHTML = ''; // Clear existing entries
    tempIngredients.forEach(ingredient => {
        const li = document.createElement('li');
        const ingredientNameSpan = document.createElement('span');
        ingredientNameSpan.textContent = `${ingredient.name} - ${ingredient.weight}g`; // Displaying calculated weight
        li.appendChild(ingredientNameSpan);
        container.appendChild(li);
    });
}

// Function to fetch API data
function fetchNutritionData(foodID) {
    const sortKeys = ['1030', '1110', '1310', '1240'];
    const promises = sortKeys.map(sortKey => {
        const url = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/${sortKey}`;
        return fetchWithApiKey(url).then(data => ({ sortKey, value: parseFloat(data[0]?.resVal.replace(',', '.')) || 0 }));
    });
    return Promise.all(promises).then(results => results.reduce((acc, { sortKey, value }) => ({ ...acc, [sortKey]: value }), {}));
}


document.addEventListener('DOMContentLoaded', function () {
    // Initialization logic to load meals and display them
    updateMealDisplay();

    // Set up the search functionality for ingredients in the main UI
    const searchButtonAll = document.getElementById('searchButtonAll');
    if (searchButtonAll) {
        searchButtonAll.addEventListener('click', function () {
            const query = document.getElementById("searchInputAll").value.trim();
            if (query) {
                getFoodItemsBySearch(query)
                    .then(data => {
                        if (data.length > 0) {
                            // Display the nutritional data in the main UI
                            updateSearchResults(data);

                            // Display the nutritional data modal
                            const modal = document.getElementById("ingredientModal");
                            modal.style.display = "block";

                            // Fetch nutritional data for the first matching ingredient
                            const foodID = data[0].foodID;
                            fetchNutritionData(foodID)
                                .then(nutritionalData => {
                                    // Display the nutritional data in the modal
                                    const nutritionalDataContent = document.getElementById("nutritionalDataContent");
                                    nutritionalDataContent.innerHTML = `
                                        <p><strong>Food Name:</strong> ${data[0].foodName}</p>
                                        <p><strong>Energy:</strong> ${nutritionalData['1030']} kcal</p>
                                        <p><strong>Protein:</strong> ${nutritionalData['1110']} g</p>
                                        <p><strong>Fat:</strong> ${nutritionalData['1240']} g</p>
                                        <p><strong>Fiber:</strong> ${nutritionalData['1310']} g</p>
                                    `;
                                })
                                .catch(error => console.error("Failed to fetch nutritional data:", error));

                            // Close the modal when the 'x' button is clicked
                            const closeBtn = modal.querySelector(".close");
                            closeBtn.addEventListener("click", () => {
                                modal.style.display = "none";
                            });
                        } else {
                            alert("No matching ingredient found.");
                        }
                    })
                    .catch(error => console.error("Failed to fetch search results:", error));
            }
        });
    }

    // Set up event listeners for opening and closing the meal popup
    const addMealButton = document.getElementById('addMealButton');
    if (addMealButton) {
        addMealButton.addEventListener('click', () => openMealPopup(null));
    }

    const closePopupButton = document.querySelector('.close');
    if (closePopupButton) {
        closePopupButton.addEventListener('click', closeMealPopup);
    }

    // Set up event listener for the save meal button within the popup
    const saveMealButton = document.getElementById('saveMealButton');
    if (saveMealButton) {
        saveMealButton.addEventListener('click', function () {
            saveMeal();
            closeMealPopup();
        });
    }

    // Set up the search functionality for ingredients when adding/editing a meal
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', function () {
            const query = document.getElementById("searchInput").value.trim();
            if (query) {
                getFoodItemsBySearch(query)
                    .then(data => updateSearchResults(data))
                    .catch(error => console.error("Failed to fetch search results:", error));
            }
        });
    }

    // Function to fetch nutrition data for a given foodID
    function fetchNutritionData(foodID) {
        const sortKeys = ['1030', '1110', '1310', '1240'];
        const promises = sortKeys.map(sortKey => {
            const url = `https://nutrimonapi.azurewebsites.net/api/FoodCompSpecs/ByItem/${foodID}/BySortKey/${sortKey}`;
            return fetchWithApiKey(url).then(data => ({ sortKey, value: parseFloat(data[0]?.resVal.replace(',', '.')) || 0 }));
        });
        return Promise.all(promises).then(results => results.reduce((acc, { sortKey, value }) => ({ ...acc, [sortKey]: value }), {}));
    }
});




//Search button for all ingredients
function setupSearchButtonAll() {
    const searchButtonAll = document.getElementById('searchButtonAll');
    if (searchButtonAll) {
        searchButtonAll.addEventListener('click', function () {
            const query = document.getElementById("searchInputAll").value.trim();
            if (query) {
                getFoodItemsBySearch(query)
                    .then(data => {
                        if (data.length > 0) {
                            const modal = document.getElementById("ingredientModal");
                            modal.style.display = "block";

                            const nutritionalDataContent = document.getElementById("nutritionalDataContent");
                            nutritionalDataContent.innerHTML = `
                                <p><strong>Food Name:</strong> ${data[0].foodName}</p>
                                <p><strong>Energy:</strong> ${data[0]['1030']} kcal</p>
                                <p><strong>Protein:</strong> ${data[0]['1110']} g</p>
                                <p><strong>Fat:</strong> ${data[0]['1240']} g</p>
                                <p><strong>Fiber:</strong> ${data[0]['1310']} g</p>
                            `;

                            const closeBtn = modal.querySelector(".close");
                            closeBtn.addEventListener("click", () => {
                                modal.style.display = "none";
                            });
                        } else {
                            alert("No matching ingredient found.");
                        }
                    })
                    .catch(error => console.error("Failed to fetch search results:", error));
            }
        });
    }
}

setupSearchButtonAll();






// Function to calculate total kcal per 100 grams
function calculateTotalKcalPer100Grams(ingredients) {
    const totalWeight = ingredients.reduce((total, ingredient) => total + ingredient.weight, 0);
    const totalKcal = ingredients.reduce((total, ingredient) => {
        const weightMultiplier = ingredient.weight / totalWeight;
        return total + (ingredient.nutritionalContent.energy * weightMultiplier);
    }, 0);
    return totalKcal;
}


//delete ingredient
function updateIngredientWeight(mealId, ingredientId, newWeight) {
    const mealIndex = meals.findIndex(meal => meal.id === mealId);
    if (mealIndex !== -1) {
        const ingredientIndex = tempIngredients.findIndex(ingredient => ingredient.id === ingredientId);
        if (ingredientIndex !== -1) {
            tempIngredients[ingredientIndex].weight = parseFloat(newWeight);
        }
    }
}

// delete ingredient
function deleteIngredient(mealId, ingredientId) {
    const mealIndex = meals.findIndex(meal => meal.id === mealId);
    if (mealIndex !== -1) {
        meals[mealIndex].ingredients = meals[mealIndex].ingredients.filter(ingredient => ingredient.id !== ingredientId);
        localStorage.setItem("meals", JSON.stringify(meals));
        openMealPopup(mealId); // Refresh the meal popup to reflect the updated ingredients
    }
}


// Function to update the meal display
function updateMealDisplay() {
    const mealsContainer = document.querySelector('.meals-container');
    if (mealsContainer) {
        mealsContainer.innerHTML = ''; // Clear the container

        meals.forEach((meal, index) => {
            const mealDiv = document.createElement('div');
            mealDiv.className = 'meal';
            mealDiv.id = `meal-${meal.id}`;

            const flexContainer = document.createElement('div');
            flexContainer.className = 'meal-flex-container';

            const mealNumberSpan = document.createElement('span');
            mealNumberSpan.className = 'meal-number';
            mealNumberSpan.textContent = `${index + 1}.`;
            flexContainer.appendChild(mealNumberSpan);

            const mealNameSpan = document.createElement('span');
            mealNameSpan.className = 'meal-name';
            mealNameSpan.textContent = `${meal.name}`;
            flexContainer.appendChild(mealNameSpan);

            const totalKcalPer100GramsSpan = document.createElement('span');
            totalKcalPer100GramsSpan.className = 'total-kcal-per-100-grams';
            const totalKcalPer100Grams = calculateTotalKcalPer100Grams(meal.ingredients);
            totalKcalPer100GramsSpan.textContent = ` ${totalKcalPer100Grams.toFixed(2)} `;
            flexContainer.appendChild(totalKcalPer100GramsSpan);

            const creationDateSpan = document.createElement('span');
            creationDateSpan.className = 'creation-date';
            const formattedDate = meal.creationDate.split('/').join('-'); // Change slashes to dashes
            creationDateSpan.textContent = ` ${formattedDate}`;
            flexContainer.appendChild(creationDateSpan);

            // Input field for the number
            const numberInput = document.createElement('input');
            numberInput.type = 'number';
            numberInput.className = 'meal-number-input'; // You can style this as needed
            numberInput.style.width = '20px'; // Set the width to accommodate only a single digit
            numberInput.value = meal.number || 1; // Set the initial value to the saved number or default to 1
            flexContainer.appendChild(numberInput);

            // Event listener to update the meal object with the typed number
            numberInput.addEventListener('input', function () {
                const inputValue = parseInt(this.value);
                if (!isNaN(inputValue)) {
                    const mealId = parseInt(this.closest('.meal').id.split('-')[1]);
                    updateMealNumber(mealId, inputValue); // Call the function to update the meal number
                }
            });

            // Total number of ingredients
            const ingredientCountSpan = document.createElement('span');
            ingredientCountSpan.className = 'ingredient-count';
            ingredientCountSpan.textContent = `Ingredients: ${meal.ingredients.length}`;
            flexContainer.appendChild(ingredientCountSpan);

            // Pen icon button for editing the meal
            const editButton = document.createElement('button');
            editButton.className = 'edit-button';
            editButton.innerHTML = '<i class="fas fa-pencil-alt"></i>';
            editButton.addEventListener('click', () => openMealPopup(meal.id));
            flexContainer.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button';
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteButton.addEventListener('click', () => deleteMeal(meal.id));
            flexContainer.appendChild(deleteButton);

            const bookIcon = document.createElement('button');
            bookIcon.className = 'book-icon';
            bookIcon.innerHTML = '<i class="fas fa-book"></i>';
            bookIcon.addEventListener('click', () => showNutritionalData(meal.id));
            flexContainer.appendChild(bookIcon);

            mealDiv.appendChild(flexContainer);
            mealsContainer.appendChild(mealDiv);
        });
    } else {
        console.error("Failed to find meals container for updating meal display");
    }
}



// Function to show nutritional data in a modal
function showNutritionalData(mealId) {
    const meal = meals.find(m => m.id === parseInt(mealId, 10)); // Ensure mealId is an integer
    if (meal) {
        const totalNutritionalContent = meal.ingredients.reduce((totals, ingredient) => {
            const multiplier = ingredient.weight / 100;
            totals.energy += ingredient.nutritionalContent.energy * multiplier;
            totals.protein += ingredient.nutritionalContent.protein * multiplier;
            totals.fat += ingredient.nutritionalContent.fat * multiplier;
            totals.fiber += ingredient.nutritionalContent.fiber * multiplier;
            return totals;
        }, { energy: 0, protein: 0, fat: 0, fiber: 0 });

        const nutritionalData = {
            energy: totalNutritionalContent.energy.toFixed(2),
            protein: totalNutritionalContent.protein.toFixed(2),
            fat: totalNutritionalContent.fat.toFixed(2),
            fiber: totalNutritionalContent.fiber.toFixed(2)
        };
        localStorage.setItem(`nutritionalData_${mealId}`, JSON.stringify(nutritionalData));

        const nutritionalInfoContent = document.getElementById('nutritionalInfoContent');
        if (nutritionalInfoContent) {
            nutritionalInfoContent.innerHTML = `
                <p class="ingredients-count">Ingredients Count: ${meal.ingredients.length}</p>
                <ul>
                    ${meal.ingredients.map(ingredient => `
                        <li class="ingredient-details">${ingredient.name} - ${ingredient.weight}g - Energy: ${(ingredient.nutritionalContent.energy * (ingredient.weight / 100)).toFixed(2)} kcal, Protein: ${(ingredient.nutritionalContent.protein * (ingredient.weight / 100)).toFixed(2)}g, Fat: ${(ingredient.nutritionalContent.fat * (ingredient.weight / 100)).toFixed(2)}g, Fiber: ${(ingredient.nutritionalContent.fiber * (ingredient.weight / 100)).toFixed(2)}g
                    `).join('')}
                </ul>
                <p class="nutritional-text">Total Nutritional Content: Energy: ${nutritionalData.energy} kcal, Protein: ${nutritionalData.protein}g, Fat: ${nutritionalData.fat}g, Fiber: ${nutritionalData.fiber}g</p>
            `;
        }

        document.getElementById('nutritionalDetailsModal').style.display = 'block';
    }
}




// Select the close button within the nutritional details modal
const closeNutritionalDetailsBtn = document.querySelector('.closeNutritionalDetails');

// Add an event listener to the close button
closeNutritionalDetailsBtn.addEventListener('click', function () {
    // Hide the nutritional details modal when the close button is clicked
    document.getElementById('nutritionalDetailsModal').style.display = "none";
});

window.openMealPopup = openMealPopup;
window.saveMeal = saveMeal;
window.closeMealPopup = closeMealPopup;






