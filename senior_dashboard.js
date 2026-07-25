document.addEventListener("DOMContentLoaded", () => {

    // Show senior name in navbar
    const seniorName =
        localStorage.getItem("seniorName") || "Senior";

    document.getElementById("userName").textContent =
        seniorName;

    // Inbox
    document.getElementById("inboxCard")
        .addEventListener("click", () => {

            window.location.href = "inbox.html";

        });

    // Notifications
    document.getElementById("notificationCard")
        .addEventListener("click", () => {

            window.location.href = "notification.html";

        });

    // Mentor List
    document.getElementById("mentorListCard")
        .addEventListener("click", () => {

            window.location.href = "mentor_list.html";

        });

    // My Profile
    document.getElementById("profileCard")
        .addEventListener("click", () => {

            const seniorId =
                localStorage.getItem("seniorId");

            if (!seniorId) {
                alert("Senior ID not found");
                return;
            }

            window.location.href =
                `mentor_profile.html?id=${seniorId}`;

        });

    // Settings
    document.getElementById("settingsCard")
        .addEventListener("click", () => {

            window.location.href = "settings.html";

        });

    // Logout
    document.getElementById("logoutCard")
        .addEventListener("click", () => {

            localStorage.clear();

            window.location.href = "index.html";

        });

});

document.getElementById("postUpdateBtn")
.addEventListener("click", async () => {

    const content =
        document.getElementById("updateContent").value;

    const seniorId =
        localStorage.getItem("seniorId");

    if(!content.trim()){

        alert("Enter an update");

        return;
    }

    try{

        const res = await fetch(
            "https://placement-app-58d1.onrender.com/updates",
            {
                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({
                    seniorId,
                    content
                })
            }
        );

        const data = await res.json();

        alert(data.message);

        document.getElementById(
            "updateContent"
        ).value = "";

    }
    catch(err){

        console.error(err);

    }

});