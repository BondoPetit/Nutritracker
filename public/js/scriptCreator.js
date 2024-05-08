const apiKey = '154093';
let meals = [];
let mealCounter = 1;
let currentMealId = null;
let tempIngredients = [];

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
        ingredientsContainer.innerHTML = '';

        if (mealId !== null) {
            // If editing an existing meal, populate the meal popup with the existing meal information
            const mealToEdit = meals.find(meal => meal.MealID === mealId);
            mealNameInput.value = mealToEdit.Name;

            // Clear existing ingredients
            tempIngredients = [...mealToEdit.ingredients]; // Ensure tempIngredients is initialized with existing ingredients

            // Populate ingredients
            tempIngredients.forEach(ingredient => {
                const inputContainer = document.createElement('div');
                inputContainer.className = 'ingredient-entry';

                const nameSpan = document.createElement('span');
                nameSpan.textContent = `${ingredient.Name}: `;

                const weightInput = document.createElement('input');
                weightInput.setAttribute('type', 'number');
                weightInput.setAttribute('placeholder', 'Weight in grams');
                weightInput.className = 'ingredient-weight-input';
                weightInput.value = ingredient.Weight;
                weightInput.addEventListener('input', () => updateIngredientWeight(mealId, ingredient.IngredientID, weightInput.value)); // Add event listener to update weight

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.className = 'delete-btn';
                deleteBtn.dataset.ingredientId = ingredient.IngredientID;
                deleteBtn.addEventListener('click', () => deleteIngredient(mealId, ingredient.IngredientID));

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
    } else {
        console.error("Failed to find elements for opening meal popup");
    }
}


function closeMealPopup() {
    document.getElementById("mealPopUp").style.display = "none";
    clearMealCreatorSearchResults(); // Clear search results for meal creator
    clearDisplayedResults();
}


function updateIngredientWeight(mealId, ingredientId, newWeight) {
    const mealToEdit = meals.find(meal => meal.MealID === mealId);
    if (mealToEdit) {
        const ingredientToEdit = mealToEdit.ingredients.find(ingredient => ingredient.IngredientID === ingredientId);
        if (ingredientToEdit) {
            ingredientToEdit.Weight = parseFloat(newWeight);
        }
    }
}

function clearMealCreatorSearchResults() {
    const container = document.getElementById("searchResultsContainer");
    container.innerHTML = ''; // Clear search results
}

function clearDisplayedResults() {
    const resultsContainer = document.getElementById("searchResultsContainerAll");
    resultsContainer.innerHTML = ''; // Clear displayed results
}

function getUserIDFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('userID'), 10);
}

// Saves meal and calculates nutrition
function saveMeal() {
    const userID = getUserIDFromURL();
    const mealNameInput = document.getElementById("mealName");
    const mealName = mealNameInput.value.trim();
    if (mealName === "") {
        alert("Please enter a meal name.");
        return;
    }

    // Start of nutritional data and total weight calculation
    let totalCalories = 0, totalProtein = 0, totalFat = 0, totalFiber = 0, totalWeight = 0;

    tempIngredients.forEach(ingredient => {
        totalCalories += ingredient.nutritionalContent.energy * (ingredient.weight / 100);
        totalProtein += ingredient.nutritionalContent.protein * (ingredient.weight / 100);
        totalFat += ingredient.nutritionalContent.fat * (ingredient.weight / 100);
        totalFiber += ingredient.nutritionalContent.fiber * (ingredient.weight / 100);
        totalWeight += ingredient.weight;
    });

    // Create the nutritional data object
    const nutritionalData = {
        calories: parseFloat(totalCalories.toFixed(2)),
        protein: parseFloat(totalProtein.toFixed(2)),
        fat: parseFloat(totalFat.toFixed(2)),
        fiber: parseFloat(totalFiber.toFixed(2)),
        totalWeight: parseFloat(totalWeight.toFixed(2))
    };

    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];

    const mealData = {
        mealID: currentMealId,
        userID: userID,
        mealName: mealName,
        creationDate: formattedDate,
        ingredients: tempIngredients,
        nutritionalData: nutritionalData
    };

    fetch('/api/saveMeal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(mealData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateMealDisplay();
                mealNameInput.value = '';
                closeMealPopup();
            } else {
                throw new Error('Failed to save the meal');
            }
        })
        .catch(error => {
            console.error('Error saving the meal:', error);
            alert('An error occurred while saving the meal. Please try again.');
        });
}



function deleteMeal(mealId) {
    if (confirm("Are you sure you want to delete this meal?")) {
        fetch(`/api/deleteMeal?mealID=${mealId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                alert("Meal deleted successfully.");
                meals = meals.filter(meal => meal.MealID !== mealId);
                updateMealDisplay();
            } else {
                throw new Error('Failed to delete the meal');
            }
        })
        .catch(error => {
            console.error('Error deleting the meal:', error);
            alert('An error occurred while deleting the meal. Please try again.');
        });
    }
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
            deleteBtn.style.marginLeft = '10px';
            deleteBtn.onclick = () => {
                inputContainer.remove();
                const ingredientIndex = tempIngredients.findIndex(ingredient => ingredient.name === foodName);
                if (ingredientIndex !== -1) {
                    tempIngredients.splice(ingredientIndex, 1);
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

                const nutritionalContent = {
                    energy: parseFloat(nutritionData['energy']),
                    protein: parseFloat(nutritionData['protein']),
                    fat: parseFloat(nutritionData['fat']),
                    fiber: parseFloat(nutritionData['fiber'])
                };

                const ingredient = {
                    id: foodID,
                    name: foodName,
                    weight: weight,
                    nutritionalContent: nutritionalContent
                };
                tempIngredients.push(ingredient);
                updateTempIngredientsDisplay();
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

function updateTempIngredientsDisplay() {
    const container = document.getElementById("selectedIngredientsList");
    container.innerHTML = ''; // Clear existing entries
    tempIngredients.forEach(ingredient => {
        const li = document.createElement('li');
        const ingredientNameSpan = document.createElement('span');
        ingredientNameSpan.textContent = `${ingredient.name} - ${ingredient.weight}g`;
        li.appendChild(ingredientNameSpan);
        container.appendChild(li);
    });
}

// Function to fetch API data
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

function updateMealDisplay() {
    const userID = getUserIDFromURL();

    fetch(`/api/getMeals?userID=${userID}`)
        .then(response => response.json())
        .then(fetchedMeals => {
            const mealsContainer = document.querySelector('.meals-container');
            if (mealsContainer) {
                mealsContainer.innerHTML = '';
                meals = fetchedMeals;

                fetchedMeals.forEach((meal, index) => {
                    const mealDiv = document.createElement('div');
                    mealDiv.className = 'meal';
                    mealDiv.id = `meal-${meal.MealID}`;

                    const flexContainer = document.createElement('div');
                    flexContainer.className = 'meal-flex-container';

                    const mealNumberSpan = document.createElement('span');
                    mealNumberSpan.className = 'meal-number';
                    mealNumberSpan.textContent = `${index + 1}.`;
                    flexContainer.appendChild(mealNumberSpan);

                    const mealNameSpan = document.createElement('span');
                    mealNameSpan.className = 'meal-name';
                    mealNameSpan.textContent = `${meal.Name}`;
                    flexContainer.appendChild(mealNameSpan);

                    const totalKcalPer100GramsSpan = document.createElement('span');
                    totalKcalPer100GramsSpan.className = 'total-kcal-per-100-grams';
                    const totalKcalPer100Grams = calculateTotalKcalPer100Grams(meal.ingredients);
                    totalKcalPer100GramsSpan.textContent = ` ${totalKcalPer100Grams.toFixed(2)} `;
                    flexContainer.appendChild(totalKcalPer100GramsSpan);

                    const creationDateSpan = document.createElement('span');
                    creationDateSpan.className = 'creation-date';
                    creationDateSpan.textContent = ` ${meal.CreationDate.split('T')[0]}`;
                    flexContainer.appendChild(creationDateSpan);

                    // Total number of ingredients
                    const ingredientCountSpan = document.createElement('span');
                    ingredientCountSpan.className = 'ingredient-count';
                    ingredientCountSpan.textContent = `Ingredients: ${meal.ingredients.length}`;
                    flexContainer.appendChild(ingredientCountSpan);

                    // Pen icon button for editing the meal
                    const editButton = document.createElement('button');
                    editButton.className = 'edit-button';
                    editButton.innerHTML = '<i class="fas fa-pencil-alt"></i>';
                    editButton.addEventListener('click', () => openMealPopup(meal.MealID));
                    flexContainer.appendChild(editButton);

                    // Delete button
                    const deleteButton = document.createElement('button');
                    deleteButton.className = 'delete-button';
                    deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
                    deleteButton.addEventListener('click', () => deleteMeal(meal.MealID));
                    flexContainer.appendChild(deleteButton);

                    // Book icon button for showing nutritional data
                    const bookIcon = document.createElement('button');
                    bookIcon.className = 'book-icon';
                    bookIcon.innerHTML = '<i class="fas fa-book"></i>';
                    bookIcon.addEventListener('click', () => showNutritionalData(meal.MealID));
                    flexContainer.appendChild(bookIcon);

                    mealDiv.appendChild(flexContainer);
                    mealsContainer.appendChild(mealDiv);
                });
            } else {
                console.error("Failed to find meals container for updating meal display");
            }
        })
        .catch(error => {
            console.error("Failed to fetch meals:", error);
        });
}

function showNutritionalData(mealId) {
    fetch(`/api/getMeal?id=${mealId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch meal data');
            }
            return response.json();
        })
        .then(meal => {
            if (meal) {
                // Existing logic for showing nutritional data
                const totalNutritionalContent = meal.ingredients.reduce((totals, ingredient) => {
                    const multiplier = ingredient.Weight / 100;
                    totals.energy += ingredient.Energy * multiplier;
                    totals.protein += ingredient.Protein * multiplier;
                    totals.fat += ingredient.Fat * multiplier;
                    totals.fiber += ingredient.Fiber * multiplier;
                    return totals;
                }, { energy: 0, protein: 0, fat: 0, fiber: 0 });

                const nutritionalData = {
                    energy: totalNutritionalContent.energy.toFixed(2),
                    protein: totalNutritionalContent.protein.toFixed(2),
                    fat: totalNutritionalContent.fat.toFixed(2),
                    fiber: totalNutritionalContent.fiber.toFixed(2)
                };

                const nutritionalInfoContent = document.getElementById('nutritionalInfoContent');
                if (nutritionalInfoContent) {
                    nutritionalInfoContent.innerHTML = `
                        <p class="ingredients-count">Ingredients Count: ${meal.ingredients.length}</p>
                        <ul>
                            ${meal.ingredients.map(ingredient => `
                                <li class="ingredient-details">${ingredient.Name} - ${ingredient.Weight}g - Energy: ${(ingredient.Energy * (ingredient.Weight / 100)).toFixed(2)} kcal, Protein: ${(ingredient.Protein * (ingredient.Weight / 100)).toFixed(2)}g, Fat: ${(ingredient.Fat * (ingredient.Weight / 100)).toFixed(2)}g, Fiber: ${(ingredient.Fiber * (ingredient.Weight / 100)).toFixed(2)}g
                            `).join('')}
                        </ul>
                        <p class="nutritional-text">Total Nutritional Content: Energy: ${nutritionalData.energy} kcal, Protein: ${nutritionalData.protein}g, Fat: ${nutritionalData.fat}g, Fiber: ${nutritionalData.fiber}g</p>
                    `;
                }

                // Show the modal
                const modal = document.getElementById('nutritionalDetailsModal');
                if (modal) {
                    modal.style.display = 'block';
                }
            } else {
                console.error("Meal not found for ID:", mealId);
            }
        })
        .catch(error => {
            console.error("Error fetching meal data:", error);
        });
}

// Function to calculate total kcal per 100 grams
function calculateTotalKcalPer100Grams(ingredients) {
    const totalWeight = ingredients.reduce((total, ingredient) => total + ingredient.Weight, 0);
    const totalKcal = ingredients.reduce((total, ingredient) => {
        const weightMultiplier = ingredient.Weight / totalWeight;
        return total + ingredient.Energy * weightMultiplier;
    }, 0);
    return totalKcal;
}

// Initialize page and events
document.addEventListener('DOMContentLoaded', function () {
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
                                        <p><strong>Energy:</strong> ${nutritionalData['energy']} kcal</p>
                                        <p><strong>Protein:</strong> ${nutritionalData['protein']} g</p>
                                        <p><strong>Fat:</strong> ${nutritionalData['fat']} g</p>
                                        <p><strong>Fiber:</strong> ${nutritionalData['fiber']} g</p>
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
});

// Close nutritional details modal
const closeNutritionalDetailsBtn = document.querySelector('.closeNutritionalDetails');
if (closeNutritionalDetailsBtn) {
    closeNutritionalDetailsBtn.addEventListener('click', function () {
        document.getElementById('nutritionalDetailsModal').style.display = "none";
    });
}

window.openMealPopup = openMealPopup;
window.saveMeal = saveMeal;
window.closeMealPopup = closeMealPopup;
window.deleteMeal = deleteMeal;
window.showNutritionalData = showNutritionalData;


module.exports = {
    openMealPopup,
    saveMeal,
    deleteMeal,
    // any other functions you need to export
};