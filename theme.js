// Apply saved theme when page loads
document.addEventListener("DOMContentLoaded", () => {

    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }

    const toggleBtn = document.getElementById("darkModeToggle");

    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {

            document.body.classList.toggle("dark-mode");

            if (document.body.classList.contains("dark-mode")) {
                localStorage.setItem("theme", "dark");
            } else {
                localStorage.setItem("theme", "light");
            }

        });
    }

});