document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = document.getElementById("registerMessage");

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  const type = document.querySelector('input[name="type"]:checked')?.value;

  const domain = document.getElementById("domain").value;
  const branch = document.getElementById("branch").value;

  const company = document.getElementById("company").value.trim();
  const role = document.getElementById("role").value.trim();
  const skills = document.getElementById("skills").value.trim();

  // 🔥 Validation
  if (!type) {
    message.style.color = "red";
    message.innerText = "Please select Placement or Internship";
    return;
  }

  if (!domain) {
    message.style.color = "red";
    message.innerText = "Please select a domain";
    return;
  }

  if (!branch) {
    message.style.color = "red";
    message.innerText = "Please select your branch";
    return;
  }

  if (password !== confirmPassword) {
    message.style.color = "red";
    message.innerText = "Passwords do not match";
    return;
  }

  try {
    const res = await fetch("https://placement-app-58d1.onrender.com/senior/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password,
        confirmPassword,
        type,
        domain,
        branch,
        company,
        role,
        skills
      })
    });

    const data = await res.json();

    if (res.ok) {
      message.style.color = "green";
      message.innerText = data.message;

      // 🔥 MOST IMPORTANT FIX
      // Store seniorId for next pages
      localStorage.setItem("seniorId", data.seniorId);

      // 🔥 Redirect to profile pic page
      setTimeout(() => {
        window.location.href = "profile_pic.html";
      }, 1000);

    } else {
      message.style.color = "red";
      message.innerText = data.message || "Registration failed";
    }

  } catch (err) {
    message.style.color = "red";
    message.innerText = "Server error";
    console.error(err);
  }
});