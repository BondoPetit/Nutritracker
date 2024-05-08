describe('scriptCreator', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="mealPopUp" style="display: none;">
                <input id="mealName" />
                <div id="selectedIngredientsList"></div>
                <input id="searchInput" />
                <button id="searchButton"></button>
            </div>
        `;

        // Initialize global variables from scriptCreator.js
        global.meals = [];  // Start with no meals for the creation test

        jest.resetModules();
        require('../../public/js/scriptCreator');
    });

    test('openMealPopup initializes a new meal creation', () => {
        const { openMealPopup } = require('../../public/js/scriptCreator');
        openMealPopup(); // Called without an ID to simulate new meal creation
        const mealPopup = document.getElementById('mealPopUp');
        const mealName = document.getElementById('mealName');
        
        expect(mealPopup.style.display).toBe('block');
        expect(mealName.value).toBe(''); // Expecting empty since it's a new meal
    });
});
