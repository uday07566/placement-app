const modal = document.getElementById("postModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModal");
const submitPostBtn = document.getElementById("submitPost");

const postsContainer =
document.getElementById("postsContainer");

openModalBtn.addEventListener("click", () => {
    modal.style.display = "flex";
});

closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

async function loadPosts() {

    try {

        const res = await fetch(
            "http://localhost:5000/community/posts"
        );

        const posts = await res.json();

        postsContainer.innerHTML = "";

        posts.forEach(post => {

            const card =
            document.createElement("div");

            card.className = "post-card";

            card.innerHTML = `
                <div class="post-title">
                    ${post.title}
                </div>

                <div class="post-meta">
                    Asked by
                    ${post.user_name}
                    (${post.user_type})
                </div>
            `;

            card.addEventListener("click", () => {

                window.location.href =
                `discussion.html?id=${post.id}`;

            });

            postsContainer.appendChild(card);

        });

    } catch(err){

        console.error(err);

    }

}

submitPostBtn.addEventListener(
"click",
async () => {

    const title =
    document.getElementById("title").value.trim();

    const description =
    document.getElementById("description")
    .value
    .trim();

    if(!title || !description){
        alert("Fill all fields");
        return;
    }

    const userId =
  localStorage.getItem("type") === "junior"
    ? localStorage.getItem("juniorId")
    : localStorage.getItem("seniorId");

    const userName =
        localStorage.getItem("name");

    const userType =
        localStorage.getItem("type");

    try {

        await fetch(
            "http://localhost:5000/community/post",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    user_id:userId,
                    user_name:userName,
                    user_type:userType,
                    title,
                    description
                })
            }
        );

        modal.style.display = "none";

        document.getElementById("title").value = "";
        document.getElementById("description").value = "";

        loadPosts();

    } catch(err){

        console.error(err);

    }

});

loadPosts();