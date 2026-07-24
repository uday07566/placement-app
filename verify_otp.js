const form = document.getElementById("otpForm");
const errorBox = document.getElementById("errorBox");
const message = document.getElementById("message");
const sendOtpBtn = document.getElementById("sendOtpBtn");

// 🔥 FIX: Get type from URL OR localStorage
const params = new URLSearchParams(window.location.search);
let type = params.get("type") || localStorage.getItem("type");

// ❌ If still missing → stop
if (!type) {
  errorBox.textContent = "Please go back and select Senior/Junior again.";
}

// ✅ Save type (VERY IMPORTANT)
localStorage.setItem("type", type);

console.log("TYPE (OTP PAGE):", type);


// 🔹 Send OTP
sendOtpBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();

  errorBox.textContent = "";
  message.textContent = "";

  if (!email) {
    errorBox.textContent = "Enter email first";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    message.textContent = data.message;
    message.style.color = res.ok ? "green" : "red";

  } catch (err) {
    message.textContent = "Error sending OTP";
    message.style.color = "red";
  }
});


// 🔹 Verify OTP
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const otp = document.getElementById("otp").value.trim();

  errorBox.textContent = "";
  message.textContent = "";

  if (!email || !otp) {
    errorBox.textContent = "All fields are required";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, otp })
    });

    const data = await res.json();

    if (res.ok) {
      message.style.color = "green";
      message.textContent = "OTP Verified! Redirecting...";

      // 🔥 FINAL FIX: no need to pass type in URL
      setTimeout(() => {
        window.location.href =
          `new_password.html?email=${encodeURIComponent(email)}`;
      }, 1000);

    } else {
      message.style.color = "red";
      message.textContent = data.message;
    }

  } catch (err) {
    message.style.color = "red";
    message.textContent = "Server error";
  }
});