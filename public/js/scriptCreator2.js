// Meal Creator with Updated Backend Integration
let meals = [];
let mealCounter = 1;
let currentMealId = null;
let tempIngredients = [];

// Fetch meals from the server
async function fetchMeals() {
    try {
        const response = await fetch('/api/meals');
        meals = await response.json();
        updateMealDisplay();
    } catch (err) {
        console.error('Error fetching meals:', err);
    }
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
            const mealToEdit = meals.find(meal => meal.id === mealId);
            mealNameInput.value = mealToEdit.name;
            tempIngredients = [...mealToEdit.ingredients];
            tempIngredients.forEach(ingredient => {
                const inputContainer = document.createElement('div');
                const nameSpan = document.createElement('span');
                nameSpan.textContent = `${ingredient.name}: `;
                const weightInput = document.createElement('input');
                weightInput.setAttribute('type', 'number');
                weightInput.setAttribute('placeholder', 'Weight in grams');
                weightInput.className = 'ingredient-weight-input';
                weightInput.value = ingredient.weight;
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.className = 'delete-btn';
                deleteBtn.dataset.ingredientId = ingredient.id;
                inputContainer.appendChild(nameSpan);
                inputContainer.appendChild(weightInput);
                inputContainer.appendChild(deleteBtn);
                ingredientsContainer.appendChild(inputContainer);
            });
        } else {
            mealNameInput.value = '';
            tempIngredients = [];
        }

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

// Close the meal popup
function closeMealPopup() {
    const mealPopup = document.getElementById("mealPopUp");
    if (mealPopup) {
        mealPopup.style.display = "none";
    }
}

// Save meal
async function saveMeal() {
    const mealNameInput = document.getElementById("mealName");
    const mealName = mealNameInput.value.trim();
    if (mealName === "") {
        alert("Please enter a meal name.");
        return;
    }

    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
    tempIngredients.forEach(ingredient => {
        totalCalories += ingredient.nutritionalContent.calories;
        totalProtein += ingredient.nutritionalContent.protein;
        totalCarbs += ingredient.nutritionalContent.carbs;
        totalFat += ingredient.nutritionalContent.fat;
    });

    const newMeal = {
        id: mealCounter++,
        name: mealName,
        ingredients: [...tempIngredients],
        calories: totalCalories.toFixed(2),
        protein: totalProtein.toFixed(2),
        carbs: totalCarbs.toFixed(2),
        fat: totalFat.toFixed(2),
        creationDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    };

    try {
        const response = await fetch(`/api/meals/${currentMealId || ''}`, {
            method: currentMealId !== null ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMeal)
        });
        const result = await response.json();
        if (response.ok) {
            if (currentMealId === null) {
                newMeal.id = result.mealID;
                meals.push(newMeal);
            } else {
                const mealIndex = meals.findIndex(meal => meal.id === currentMealId);
                meals[mealIndex] = newMeal;
            }
            updateMealDisplay();
            closeMealPopup();
        } else {
            console.error('Error saving meal:', result.error);
        }
    } catch (err) {
        console.error('Error saving meal:', err);
    }

    tempIngredients = [];
    mealNameInput.value = '';
}

// Delete meal
async function deleteMeal(mealId) {
    try {
        const response = await fetch(`/api/meals/${mealId}`, { method: 'DELETE' });
        if (response.ok) {
            meals = meals.filter(meal => meal.id !== parseInt(mealId));
            updateMealDisplay();
        } else {
            console.error('Error deleting meal:', response.statusText);
        }
    } catch (err) {
        console.error('Error deleting meal:', err);
    }
}

// Get food items by search
async function getFoodItemsBySearch(query) {
    const response = await fetch(`/api/fooditems/search?query=${query}`);
    return response.json();
}

// Update search results
function updateSearchResults(data) {
    const container = document.getElementById("searchResultsContainer");
    container.innerHTML = '';
    data.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.textContent = item.FoodName;
        resultItem.className = 'search-result-item';
        resultItem.addEventListener('click', () => addIngredientToMeal(item.FoodID, item.FoodName));
        container.appendChild(resultItem);
    });
}

// Add ingredient to meal
async function addIngredientToMeal(foodID, foodName) {
    const nutritionalData = await fetchNutritionData(foodID);
    const inputContainer = document.createElement('div');
    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${foodName}: `;
    const weightInput = document.createElement('input');
    weightInput.setAttribute('type', 'number');
    weightInput.setAttribute('placeholder', 'Weight in grams');
    weightInput.className = 'ingredient-weight-input';
    weightInput.addEventListener('input', () => updateIngredientWeight(currentMealId, foodID, weightInput.value));
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.dataset.ingredientId = foodID;
    deleteBtn.addEventListener('click', () => deleteIngredient(currentMealId, foodID));
    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add';
    addBtn.onclick = () => {
        const weight = parseFloat(weightInput.value);
        if (!weight || weight <= 0) {
            alert('Please enter a valid weight in grams.');
            return;
        }
        const multiplier = weight / 100;
        const ingredient = {
            id: foodID,
            name: foodName,
            weight: weight,
            nutritionalContent: {
                calories: nutritionalData['Calories'] * multiplier,
                protein: nutritionalData['Protein'] * multiplier,
                carbs: nutritionalData['Carbs'] * multiplier,
                fat: nutritionalData['Fat'] * multiplier,
            }
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
}

// Fetch nutrition data
async function fetchNutritionData(foodID) {
    const response = await fetch(`/api/nutrition?foodID=${foodID}`);
    const data = await response.json();
    return {
        Calories: data.find(n => n.SortKey === '1030')?.ResVal || 0,
        Protein: data.find(n => n.SortKey === '1110')?.ResVal || 0,
        Carbs: data.find(n => n.SortKey === '1320')?.ResVal || 0,
        Fat: data.find(n => n.SortKey === '1240')?.ResVal || 0
    };
}

// Update temporary ingredients display
function updateTempIngredientsDisplay() {
    const container = document.getElementById("selectedIngredientsList");
    container.innerHTML = '';
    tempIngredients.forEach(ingredient => {
        const li = document.createElement('li');
        const ingredientNameSpan = document.createElement('span');
        ingredientNameSpan.textContent = `${ingredient.name} - ${ingredient.weight}g`;
        li.appendChild(ingredientNameSpan);
        container.appendChild(li);
    });
}

// Update meal display
function updateMealDisplay() {
    const mealsContainer = document.querySelector('.meals-container');
    if (mealsContainer) {
        mealsContainer.innerHTML = '';
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
            totalKcalPer100GramsSpan.textContent = ` ${meal.calories} `;
            flexContainer.appendChild(totalKcalPer100GramsSpan);
            const creationDateSpan = document.createElement('span');
            creationDateSpan.className = 'creation-date';
            const formattedDate = meal.creationDate.split('/').join('-');
            creationDateSpan.textContent = ` ${formattedDate}`;
            flexContainer.appendChild(creationDateSpan);
            const numberInput = document.createElement('input');
            numberInput.type = 'number';
            numberInput.className = 'meal-number-input';
            numberInput.style.width = '20px';
            numberInput.value = meal.number || 1;
            flexContainer.appendChild(numberInput);
            numberInput.addEventListener('input', function () {
                const inputValue = parseInt(this.value);
                if (!isNaN(inputValue)) {
                    updateMealNumber(parseInt(this.closest('.meal').id.split('-')[1]), inputValue);
                }
            });
            const ingredientCountSpan = document.createElement('span');
            ingredientCountSpan.className = 'ingredient-count';
            ingredientCountSpan.textContent = `Ingredients: ${meal.ingredients.length}`;
            flexContainer.appendChild(ingredientCountSpan);
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

// Show nutritional data
function showNutritionalData(mealId) {
    const meal = meals.find(m => m.id === parseInt(mealId, 10));
    if (meal) {
        const totalNutritionalContent = meal.ingredients.reduce((totals, ingredient) => {
            const multiplier = ingredient.weight / 100;
            totals.energy += ingredient.nutritionalContent.calories * multiplier;
            totals.protein += ingredient.nutritionalContent.protein * multiplier;
            totals.fat += ingredient.nutritionalContent.fat * multiplier;
            totals.carbs += ingredient.nutritionalContent.carbs * multiplier;
            return totals;
        }, { energy: 0, protein: 0, fat: 0, carbs: 0 });

        const nutritionalData = {
            energy: totalNutritionalContent.energy.toFixed(2),
            protein: totalNutritionalContent.protein.toFixed(2),
            fat: totalNutritionalContent.fat.toFixed(2),
            carbs: totalNutritionalContent.carbs.toFixed(2)
        };
        const nutritionalInfoContent = document.getElementById('nutritionalInfoContent');
        if (nutritionalInfoContent) {
            nutritionalInfoContent.innerHTML = `
                <p class="ingredients-count">Ingredients Count: ${meal.ingredients.length}</p>
                <ul>
                    ${meal.ingredients.map(ingredient => `
                        <li class="ingredient-details">${ingredient.name} - ${ingredient.weight}g - Energy: ${(ingredient.nutritionalContent.calories * (ingredient.weight / 100)).toFixed(2)} kcal, Protein: ${(ingredient.nutritionalContent.protein * (ingredient.weight / 100)).toFixed(2)}g, Fat: ${(ingredient.nutritionalContent.fat * (ingredient.weight / 100)).toFixed(2)}g, Carbs: ${(ingredient.nutritionalContent.carbs * (ingredient.weight / 100)).toFixed(2)}g
                    `).join('')}
                </ul>
                <p class="nutritional-text">Total Nutritional Content: Energy: ${nutritionalData.energy} kcal, Protein: ${nutritionalData.protein}g, Fat: ${nutritionalData.fat}g, Carbs: ${nutritionalData.carbs}g</p>
            `;
        }

        document.getElementById('nutritionalDetailsModal').style.display = 'block';
    }
}

window.openMealPopup = openMealPopup;
window.saveMeal = saveMeal;
window.closeMealPopup = closeMealPopup;

document.addEventListener('DOMContentLoaded', fetchMeals);

// Close nutritional details modal
const closeNutritionalDetailsBtn = document.querySelector('.closeNutritionalDetails');
if (closeNutritionalDetailsBtn) {
    closeNutritionalDetailsBtn.addEventListener('click', function () {
        document.getElementById('nutritionalDetailsModal').style.display = "none";
    });
}

// Function to update meal number
function updateMealNumber(mealId, number) {
    const meal = meals.find(meal => meal.id === mealId);
    if (meal) {
        meal.number = number;
    }
}
