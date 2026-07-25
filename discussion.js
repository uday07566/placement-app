const params =
new URLSearchParams(window.location.search);

const postId = params.get("id");

const titleEl =
document.getElementById("questionTitle");

const userEl =
document.getElementById("questionUser");

const descEl =
document.getElementById("questionDescription");

const repliesContainer =
document.getElementById("repliesContainer");

const replyBtn =
document.getElementById("replyBtn");

async function loadDiscussion() {

  try {

    const res = await fetch(
      `https://placement-app-58d1.onrender.com/community/post/${postId}`
    );

    const post = await res.json();

    titleEl.textContent = post.title;

    userEl.textContent =
      `${post.user_name} (${post.user_type})`;

    descEl.textContent =
      post.description;

  } catch(err){

    console.error(err);

  }

}

async function loadReplies() {

  try {

    const res = await fetch(
      `https://placement-app-58d1.onrender.com/community/replies/${postId}`
    );

    const replies =
    await res.json();

    repliesContainer.innerHTML = "";

    replies.forEach(reply => {

      const div =
      document.createElement("div");

      div.className = "reply-card";

      div.innerHTML = `
        <div class="reply-user">
          ${reply.user_name}
        </div>

        <div class="reply-role">
          ${reply.user_type}
        </div>

        <div class="reply-text">
          ${reply.reply}
        </div>
      `;

      repliesContainer.appendChild(div);

    });

  } catch(err){

    console.error(err);

  }

}

replyBtn.addEventListener(
"click",
async () => {

  const text =
  document.getElementById("replyText")
  .value
  .trim();

  if(!text){
    alert("Reply cannot be empty");
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
      "https://placement-app-58d1.onrender.com/community/reply",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          post_id:postId,
          user_id:userId,
          user_name:userName,
          user_type:userType,
          reply:text
        })
      }
    );

    document.getElementById(
      "replyText"
    ).value = "";

    loadReplies();

  } catch(err){

    console.error(err);

  }

});

loadDiscussion();
loadReplies();