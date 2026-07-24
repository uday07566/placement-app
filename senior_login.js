document.addEventListener("DOMContentLoaded", function () {

  // 🔥 Store role
  localStorage.setItem("type", "senior");

  const form = document.getElementById("loginForm");
  const message = document.getElementById("loginMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    message.textContent = "";

    if (!email || !password) {
      message.style.color = "red";
      message.textContent = "All fields are required";
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/senior/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        message.style.color = "green";
        message.textContent = data.message;

        // ✅ Store user data
        localStorage.setItem("seniorId", data.seniorId);
        localStorage.setItem("email", email);
        localStorage.setItem("type", "senior");
        localStorage.setItem("name", data.name);
        // 🔥 Redirect to mentor list (FIXED)
        setTimeout(() => {
          window.location.href = "senior_dashboard.html";
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