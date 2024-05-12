// When the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    // Extract userID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const userID = parseInt(urlParams.get("userID"), 10);

    // Function to fetch nutritional intake data from the provided URL
    async function fetchNutritionalIntake(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error(`Unexpected response format: ${JSON.stringify(data)}`);
        }
        return data;
    }

    // Function to format date to DD-MM-YYYY format
    function formatDateToDMY(date) {
        const day = ("0" + date.getDate()).slice(-2);
        const month = ("0" + (date.getMonth() + 1)).slice(-2);
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    // Function to display nutritional intake data in the specified container
    function displayNutritionalIntake(data, containerId, viewType) {
        const dailyNutriContainer = document.getElementById(containerId);
        dailyNutriContainer.innerHTML = ''; // Clear existing content

        data.forEach(item => {
            let time;
            if (viewType === '24hours') {
                time = item.Hour !== undefined ? item.Hour + ':00' : item.Day;
            } else if (viewType === 'month') {
                const day = new Date(item.Day);
                time = formatDateToDMY(day);
            }

            const listItem = document.createElement('li');
            listItem.textContent = `${time}, Energy: ${item.EnergyIntake.toFixed(2)} kcal, Fluid: ${item.WaterIntake.toFixed(2)} ml, Burning: ${item.Burning.toFixed(2)} kcal, Net Calories: ${item.NetCalories.toFixed(2)} kcal`;
            listItem.classList.add('daily-intake-item'); // Add a class for styling
            dailyNutriContainer.appendChild(listItem);
        });
    }

    // Function to asynchronously display daily nutritional intake based on viewType
    async function displayDailyNutritionalIntake(viewType = '24hours') {
        let url;
        if (viewType === '24hours') {
            url = `/api/getDailyNutri24?userID=${userID}`;
        } else if (viewType === 'month') {
            url = `/api/getDailyNutriMonth?userID=${userID}`;
        }

        try {
            const data = await fetchNutritionalIntake(url);
            displayNutritionalIntake(data, 'dailyNutriContainer', viewType);
        } catch (error) {
            console.error("Error displaying nutritional intake:", error);
            document.getElementById('dailyNutriContainer').textContent = `Error: ${error.message}`;
        }
    }

    // Event listeners for the view type buttons
    document.getElementById("view24hours").addEventListener("click", () => displayDailyNutritionalIntake('24hours'));
    document.getElementById("viewMonth").addEventListener("click", () => displayDailyNutritionalIntake('month'));

    // Default view: Display daily nutritional intake for the past 24 hours
    displayDailyNutritionalIntake('24hours');
});
