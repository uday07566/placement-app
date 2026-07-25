const chatList =
document.getElementById("chatList");

const seniorId =
localStorage.getItem("seniorId");

async function loadInbox(){

  try{

    const res = await fetch(
      `https://placement-app-58d1.onrender.com/chat/inbox/${seniorId}`
    );

    const chats =
    await res.json();

    chatList.innerHTML = "";

    chats.forEach(chat => {

      const div =
      document.createElement("div");

      div.className =
      "chat-card";

      div.innerHTML = `
        <h3>${chat.junior_name}</h3>
      `;

      div.onclick = () => {

        window.location.href =
        `private_chat.html?conversationId=${chat.conversation_id}&juniorId=${chat.junior_id}`;

      };

      chatList.appendChild(div);

    });

  }
  catch(err){
    console.error(err);
  }

}

loadInbox();