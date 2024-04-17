document.addEventListener("DOMContentLoaded", function() {
    const activities = {
        "everyday": {
            "Almindelig gang": 215,
            "Gang ned af trapper": 414,
            "Gang op af trapper": 1079,
            "Slå græs med manuel græsslåmaskine": 281,
            "Lave mad og redde senge": 236,
            "Luge ukrudt": 362,
            "Rydde sne": 481,
            "Læse eller se TV": 74,
            "Stå oprejst": 89,
            "Cykling i roligt tempo": 310,
            "Tørre støv af": 163,
            "Vaske gulv": 281,
            "Pudse vinduer": 259
        },
        "sports": {
            "Cardio": 814,
            "Hård styrketræning": 348,
            "Badminton": 318,
            "Volleyball": 318,
            "Bordtennis": 236,
            "Dans i højt tempo": 355,
            "Dans i moderat tempo": 259,
            "Fodbold": 510,
            "Rask gang": 384,
            "Golf": 244,
            "Håndbold": 466,
            "Squash": 466,
            "Jogging": 666,
            "Langrend": 405,
            "Løb i moderat tempo": 872,
            "Løb i hurtigt tempo": 1213,
            "Ridning": 414,
            "Skøjteløb": 273,
            "Svømning": 296,
            "Cykling i højt tempo": 658
        },
        "work": {
            "Bilreparation": 259,
            "Gravearbejde": 414,
            "Landbrugsarbejde": 236,
            "Let kontorarbejde": 185,
            "Male hus": 215,
            "Murerarbejde": 207,
            "Hugge og slæbe på brænde": 1168
        }
    };

    const categorySelect = document.getElementById("category");
    const activitySelect = document.getElementById("activity");
    const durationInput = document.getElementById("duration");
    const caloriesInfo = document.getElementById("caloriesInfo");

    // Populate activity options based on the selected category
    function populateActivities(category) {
        const activitySelect = document.getElementById("activity");
        activitySelect.innerHTML = "<option value='' disabled selected>Select an activity...</option>";
        for (const activity in activities[category]) {
            const option = document.createElement("option");
            option.value = activities[category][activity];
            option.textContent = `${activity} (${activities[category][activity]} kcal/h)`;
            activitySelect.appendChild(option);
        }
    }

    // Calculate calories based on selected activity and duration
    function calculateCalories(event) {
        event.preventDefault();
        const selectedActivity = parseFloat(activitySelect.value); // Get selected activity's kcal/h value
        const duration = parseFloat(durationInput.value); // Get duration in minutes
        const caloriesBurned = (selectedActivity / 60) * duration; // Calculate calories burned

        if (!isNaN(caloriesBurned)) {
            caloriesInfo.textContent = `Calories burned: ${caloriesBurned.toFixed(2)} kcal`;
        } else {
            caloriesInfo.textContent = "Please select an activity and enter a valid duration.";
        }
    }

    // Update activity options when category changes
    categorySelect.addEventListener("change", function() {
        const selectedCategory = this.value;
        populateActivities(selectedCategory);
    });

    // Attach event listener to the form for calorie calculation
    const form = document.querySelector(".form-box");
    form.addEventListener("submit", calculateCalories);
});
