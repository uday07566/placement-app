const saveBtn = document.getElementById("saveBtn");

saveBtn.addEventListener("click", saveProfile);

async function saveProfile() {

    saveBtn.disabled = true;

    try {

        const seniorId = localStorage.getItem("seniorId");

        if (!seniorId) {

            alert("Please login again.");

            window.location.href = "senior_login.html";

            return;

        }

        const body = {

            senior_id: seniorId,

            skills: document.getElementById("skills").value.trim(),

            experience: document.getElementById("experience").value.trim(),

            resources: document.getElementById("resources").value.trim(),

            linkedin: document.getElementById("linkedin").value.trim(),

            github: document.getElementById("github").value.trim()

        };

        const response = await fetch(

            "http://localhost:5000/profile_details",

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(body)

            }

        );

        const data = await response.json();

        if (response.ok) {

            alert("Profile Saved Successfully.");

            window.location.href = "mentor_list.html";

        }

        else {

            alert(data.message);

            saveBtn.disabled = false;

        }

    }

    catch (err) {

        console.error(err);

        alert("Server Error");

        saveBtn.disabled = false;

    }

}