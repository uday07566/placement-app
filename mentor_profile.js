// ======================
// GET MENTOR ID
// ======================
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
    alert("Invalid profile ID");
    throw new Error("No ID provided");
}

// ======================
// LOAD PROFILE
// ======================
async function loadProfile() {

    try {

        const res = await fetch(
            `http://localhost:5000/senior-profile/${id}`
        );

        if (!res.ok) {
            throw new Error("Failed to fetch profile");
        }

        const data = await res.json();

        console.log("Mentor Data:", data);

        renderProfile(data);

    } catch (err) {

        console.error("Profile Load Error:", err);
        alert("Failed to load profile");
    }
}

// ======================
// SAFE LINKS
// ======================
function setLink(id, url) {

    const el = document.getElementById(id);

    if (!el) return;

    if (url && url.trim() !== "") {

        el.href = url.startsWith("http")
            ? url
            : `https://${url}`;

        el.style.pointerEvents = "auto";
        el.style.opacity = "1";

    } else {

        el.href = "#";
        el.style.pointerEvents = "none";
        el.style.opacity = "0.5";
    }
}

// ======================
// RENDER PROFILE
// ======================
function renderProfile(data) {

    // Profile Image
    const profilePic = document.getElementById("profilePic");

    profilePic.src = data.profilepic
        ? data.profilepic
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}`;

    // Basic Info
    document.getElementById("name").innerText =
        data.name || "N/A";

    document.getElementById("roleCompany").innerText =
        `${data.role || "Mentor"} ${data.company ? "@ " + data.company : ""}`;

    document.getElementById("branchDomain").innerText =
        `${data.branch || "N/A"} | ${data.domain || "N/A"}`;

    document.getElementById("type").innerText =
        data.type || "N/A";

    // About
    document.getElementById("experience").innerText =
        data.experience || "No details available";

    // Highlight
    document.getElementById("majorSkill").innerText =
        data.major_skill || "No highlights added";

    // Resources
    document.getElementById("resources").innerText =
        data.resources || "No resources shared";

    // Skills
    const skillsContainer =
        document.getElementById("skills");

    skillsContainer.innerHTML = "";

    if (data.skills && data.skills.trim() !== "") {

        data.skills.split(",").forEach(skill => {

            const span = document.createElement("span");

            span.classList.add("skill-tag");
            span.innerText = skill.trim();

            skillsContainer.appendChild(span);

        });

    } else {

        skillsContainer.innerHTML = "<p>No skills listed</p>";
    }

    // Links
    setLink("linkedin", data.linkedin);
    setLink("github", data.github);

    // Quick Info
    document.getElementById("domain").innerText =
        data.domain || "N/A";

    document.getElementById("branch").innerText =
        data.branch || "N/A";

    document.getElementById("type2").innerText =
        data.type || "N/A";
}

// ======================
// PRIVATE CHAT
// ======================
function startPrivateChat() {

    window.location.href =
        `private_chat.html?seniorId=${id}`;
}

// ======================
// COMMUNITY
// ======================
function goToCommunity() {

    window.location.href =
        `community.html?mentor=${id}`;
}

// ======================
// INIT
// ======================
loadProfile();