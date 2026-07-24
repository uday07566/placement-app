document.addEventListener("DOMContentLoaded", function () {

  // Store role
  localStorage.setItem("type", "junior");

  const form = document.getElementById("loginForm");
  const message = document.getElementById("loginMessage");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    message.textContent = "";

    if (!email || !password) {
      message.style.color = "red";
      message.textContent = "All fields are required";
      return;
    }

    try {

      const res = await fetch("http://localhost:5000/junior/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {

        // Save logged-in user info
        localStorage.setItem("juniorId", data.juniorId);
        localStorage.setItem("name", data.name);
        localStorage.setItem("type", "junior");

        message.style.color = "green";
        message.textContent = data.message;

        setTimeout(() => {
          window.location.href = "mentor_list.html";
        }, 1000);

      } else {

        message.style.color = "red";
        message.textContent = data.message || "Login failed";

      }

    } catch (err) {

      console.error(err);

      message.style.color = "red";
      message.textContent = "Server error";

    }

  });

});