document.addEventListener("DOMContentLoaded", function () {
    // Function to display daily nutritional intake
    function displayDailyNutritionalIntake() {
        const currentDateTime = new Date();
        const currentHour = currentDateTime.getHours();
        const endDateTime = new Date(currentDateTime); // Set the end time to the current hour
        const startDateTime = new Date(currentDateTime);
        startDateTime.setHours(currentDateTime.getHours() - 24); // Set the start time to 24 hours ago

        const records = JSON.parse(localStorage.getItem('mealIntakeRecords')) || [];
        const dailyIntake = {};

        // Initialize hourly intake data
        for (let i = 0; i <= 23; i++) { // Iterate over the last 24 hours
            const hour = (currentHour - 23 + i + 24) % 24; // Calculate the hour dynamically
            const timeOfDay = (hour < 10 ? '0' : '') + hour + ':00'; // Represent the time of day in 24-hour format
            dailyIntake[timeOfDay] = { energy: 0, fluid: 0 };
        }

        // Iterate over records and calculate hourly intake within the last 24 hours
        records.forEach(record => {
            const recordDateTime = new Date(`${record.date}T${record.time}`);
            if (recordDateTime >= startDateTime && recordDateTime <= endDateTime) {
                const hour = recordDateTime.getHours();
                const timeOfDay = (hour < 10 ? '0' : '') + hour + ':00'; // Represent the time of day in 24-hour format
                dailyIntake[timeOfDay].energy += record.nutritionalData.energy || 0;
                dailyIntake[timeOfDay].fluid += record.nutritionalData.fluid || 0;
            }
        });

        // Display hourly intake data
        const dailyNutriContainer = document.getElementById('dailyNutriContainer');
        dailyNutriContainer.innerHTML = ''; // Clear existing content

        for (const hour in dailyIntake) {
            if (dailyIntake.hasOwnProperty(hour)) {
                const intakeData = dailyIntake[hour];
                const listItem = document.createElement('li');
                listItem.textContent = `${hour}, Energy: ${intakeData.energy.toFixed(2)} kcal, Fluid: ${intakeData.fluid.toFixed(2)} ml`;
                listItem.classList.add('daily-intake-item'); // Add a class for styling
                dailyNutriContainer.appendChild(listItem);
            }
        }
    }

    // Call function to display daily nutritional intake upon DOM content load
    displayDailyNutritionalIntake();
});

