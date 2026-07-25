function getInitials(name){
    if(!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

const container = document.getElementById("mentorContainer");
const searchInput = document.getElementById("searchInput");
const domainFilter = document.getElementById("domainFilter");
const emptyMessage = document.getElementById("emptyMessage");
const updatesList = document.getElementById("updatesList");

let allMentors = [];

/* UPDATES */
async function loadUpdates(){
    const res = await fetch("https://placement-app-58d1.onrender.com/updates");
    const updates = await res.json();

    updatesList.innerHTML = "";

    updates.forEach(u=>{
        updatesList.innerHTML += `
            <div class="update-card">
                <strong>${u.name}</strong>
                <small>${new Date(u.created_at).toLocaleString()}</small>
                <p>${u.content}</p>
            </div>
        `;
    });
}

const darkModeBtn = document.getElementById("themeToggle");
// Restore saved theme
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    darkModeBtn.textContent = "☀️";
} else {
    darkModeBtn.textContent = "🌙";
}

darkModeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
        darkModeBtn.textContent = "☀️";
    } else {
        localStorage.setItem("theme", "light");
        darkModeBtn.textContent = "🌙";
    }
});

/* MENTORS */
async function loadMentors(){
    const res = await fetch("https://placement-app-58d1.onrender.com/mentors");
    allMentors = await res.json();
    renderMentors(allMentors);
}

/* RENDER */
function renderMentors(mentors){

    container.innerHTML = "";

    if(!mentors.length){
        emptyMessage.style.display = "block";
        emptyMessage.innerText = "No mentors found";
        return;
    }

    emptyMessage.style.display = "none";

    mentors.forEach((m,i)=>{

        const name = m.name || "Unknown";
        const company = m.company || "Not specified";

        const card = document.createElement("div");
        card.className = "card fade-in";

        card.innerHTML = `
            <div class="card-left">

                <div class="avatar-wrapper">
                    <div class="avatar">
                        ${getInitials(name)}
                    </div>
                    <span class="status-dot"></span>
                </div>

                <div>
                    <div style="display:flex;justify-content:space-between;">
                        <h3>${name}</h3>
                        <span class="bookmark">☆</span>
                    </div>

                    <p class="company">@ ${company}</p>

                    <div class="skills">
                        <span>${m.domain}</span>
                        <span>${m.branch}</span>
                    </div>
                </div>

            </div>

            <div class="card-right">
                <span>View →</span>
            </div>
        `;

        /* BOOKMARK */
        const star = card.querySelector(".bookmark");

        star.onclick = (e)=>{
            e.stopPropagation();
            star.classList.toggle("active");
            star.textContent = star.classList.contains("active") ? "★" : "☆";
        };

        /* OPEN PROFILE */
        card.onclick = ()=>{
            localStorage.setItem("selectedMentor", JSON.stringify(m));
            window.location.href = `mentor_profile.html?id=${m.id}`;
        };

        container.appendChild(card);
    });
}

function openSettings() {
    window.location.href = "settings.html";
}

/* FILTER */
function applyFilters(){
    const search = searchInput.value.toLowerCase();
    const domain = domainFilter.value.toLowerCase();

    const filtered = allMentors.filter(m=>{
        return (
            (!domain || (m.domain||"").toLowerCase().includes(domain))
            &&
            (
                (m.name||"").toLowerCase().includes(search) ||
                (m.branch||"").toLowerCase().includes(search) ||
                (m.company||"").toLowerCase().includes(search)
            )
        );
    });

    renderMentors(filtered);
}

/* EVENTS */
searchInput.addEventListener("input", applyFilters);
domainFilter.addEventListener("change", applyFilters);

document.getElementById("notificationsBtn")
.addEventListener("click", ()=>{
    window.location.href = "notification.html";
});

/* INIT */
loadUpdates();
loadMentors();