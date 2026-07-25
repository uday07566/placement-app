const seniorId =
localStorage.getItem("seniorId");

async function loadProfile() {

  try {

    const res = await fetch(
      `https://placement-app-58d1.onrender.com/senior/profile/${seniorId}`
    );

    const data = await res.json();

    document.getElementById("name").value =
      data.name || "";

    document.getElementById("email").value =
      data.email || "";

    document.getElementById("domain").value =
      data.domain || "";

    document.getElementById("branch").value =
      data.branch || "";

    document.getElementById("type").value =
      data.type || "";

    document.getElementById("company").value =
      data.company || "";

    document.getElementById("role").value =
      data.role || "";

    document.getElementById("skills").value =
      data.skills || "";

    document.getElementById("experience").value =
      data.experience || "";

    document.getElementById("resources").value =
      data.resources || "";

    document.getElementById("linkedin").value =
      data.linkedin || "";

    document.getElementById("github").value =
      data.github || "";

    document.getElementById("major_skill").value =
      data.major_skill || "";

  }
  catch(err) {

    console.error(err);

  }

}

loadProfile();

document
.getElementById("profileForm")
.addEventListener("submit", async (e) => {

  e.preventDefault();

  const profileData = {

    name:
      document.getElementById("name").value,

    domain:
      document.getElementById("domain").value,

    branch:
      document.getElementById("branch").value,

    type:
      document.getElementById("type").value,

    company:
      document.getElementById("company").value,

    role:
      document.getElementById("role").value,

    skills:
      document.getElementById("skills").value,

    experience:
      document.getElementById("experience").value,

    resources:
      document.getElementById("resources").value,

    linkedin:
      document.getElementById("linkedin").value,

    github:
      document.getElementById("github").value,

    

    major_skill:
      document.getElementById("major_skill").value

  };

  try {

    const res = await fetch(
      `https://placement-app-58d1.onrender.com/senior/profile/${seniorId}`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(profileData)
      }
    );

    const data = await res.json();

    if (res.ok) {

      alert("Profile updated successfully");

    } else {

      alert(data.message);

    }

  } catch (err) {

    console.error(err);

    alert("Update failed");

  }

});