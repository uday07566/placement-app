const fileInput = document.getElementById("profilePic");
const preview = document.getElementById("preview");

// 🔹 Preview
fileInput.addEventListener("change", function () {
  const file = this.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
});

// 🔹 Upload
async function uploadPic() {
  const file = fileInput.files[0];

  // ✅ Get seniorId safely
  const seniorId = localStorage.getItem("seniorId");

  // 🚨 FIX: stop if not logged in properly
  if (!seniorId || seniorId === "null") {
    alert("Session expired or login issue. Please login again.");
    window.location.href = "senior_login.html";
    return;
  }

  // Allow skip (no file)
  if (!file) {
    window.location.href = "profile_details.html";
    return;
  }

  const formData = new FormData();
  formData.append("profilePic", file);
  formData.append("senior_id", seniorId);

  try {
    const res = await fetch("http://localhost:5000/profile_pic", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      console.log("✅ Upload success:", data);
      window.location.href = "profile_details.html";
    } else {
      alert(data.message || "Upload failed");
    }

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

// 🔹 Skip
function skipPic() {
  window.location.href = "profile_details.html";
}