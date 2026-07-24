document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById('juniorForm');
  const message = document.getElementById('message');

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    // Get all values
    const name = document.getElementById('name').value.trim();
    const userid = document.getElementById('userid').value.trim();
    const email = document.getElementById('email').value.trim();
    const department = document.getElementById('department').value;
    const year = document.getElementById('year').value;
    const domain = document.getElementById('domain').value;
    const password = document.getElementById('password').value.trim();
    const confirm = document.getElementById('confirm').value.trim();

    let errors = [];

    // Validation
    if (!name) errors.push('Name is required');
    if (!userid) errors.push('User ID is required');

    const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
    if (!email) errors.push('Email is required');
    else if (!emailPattern.test(email)) errors.push('Enter a valid email');

    if (!department) errors.push('Select a department');
    if (!year) errors.push('Select your year');

    if (!password) errors.push('Password is required');
    else if (password.length < 6) errors.push('Password must be at least 6 characters');

    if (!confirm) errors.push('Confirm your password');
    else if (password !== confirm) errors.push('Passwords do not match');

    // Show errors
    message.innerHTML = '';
    message.style.color = 'red';

    if (errors.length > 0) {
      errors.forEach(err => {
        const p = document.createElement('p');
        p.textContent = err;
        message.appendChild(p);
      });
      return;
    }

    // 🔥 CALL BACKEND
    try {
      const res = await fetch("http://localhost:5000/junior/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          userid,
          email,
          department,
          year,
          domain,
          password
        })
      });

      const data = await res.json();

      if (res.ok) {
        message.style.color = "green";
        message.textContent = data.message;

        // ✅ CLEAR FORM
        form.reset();

        // ✅ REDIRECT AFTER SUCCESS
        setTimeout(() => {
          window.location.href = "junior_login.html";
        }, 1500);

      } else {
        message.style.color = "red";
        message.textContent = data.message;
      }

    } catch (err) {
      console.error(err);
      message.style.color = "red";
      message.textContent = "Server error";
    }

  });

});