const socket = io(
  "http://localhost:5000"
);
const params = new URLSearchParams(window.location.search);

const type = localStorage.getItem("type");

let conversationId = null;

const chatBox =
document.getElementById("chatMessages");


// ======================
// PAGE LOAD
// ======================

window.onload = async () => {

  if(type === "junior"){

    await juniorFlow();

  }else{

    await seniorFlow();

  }

};


// ======================
// JUNIOR FLOW
// ======================

async function juniorFlow(){

  const seniorId =
  params.get("seniorId");

  const juniorId =
  localStorage.getItem("juniorId");

  // Load senior name

  const seniorRes = await fetch(
    `http://localhost:5000/chat/senior/${seniorId}`
  );

  const senior =
  await seniorRes.json();

  document.getElementById(
    "chatName"
  ).textContent = senior.name;

  // Create/Get conversation

  const convoRes = await fetch(
    "http://localhost:5000/chat/conversation",
    {
      method:"POST",

      headers:{
        "Content-Type":"application/json"
      },

      body:JSON.stringify({
        juniorId,
        seniorId
      })
    }
  );

  const convo =
await convoRes.json();

conversationId =
convo.conversationId;

// 🔥 ADD THIS
socket.emit(
  "joinConversation",
  conversationId
);

await loadMessages();

}


// ======================
// SENIOR FLOW
// ======================

async function seniorFlow(){

  conversationId =
  params.get("conversationId");

  socket.emit(
  "joinConversation",
  conversationId
);

  const juniorId =
  params.get("juniorId");

  // Load junior name

  const juniorRes = await fetch(
    `http://localhost:5000/chat/junior/${juniorId}`
  );

  const junior =
  await juniorRes.json();

  document.getElementById(
    "chatName"
  ).textContent = junior.name;

  await loadMessages();

}


// ======================
// LOAD MESSAGES
// ======================

async function loadMessages(){

  const res = await fetch(
    `http://localhost:5000/chat/messages/${conversationId}`
  );

  const messages =
  await res.json();

  chatBox.innerHTML = "";

  messages.forEach(msg => {

    const div =
    document.createElement("div");

    div.classList.add("message");

    if(
      msg.sender_type === type
    ){
      div.classList.add("sent");
    }
    else{
      div.classList.add("received");
    }

    div.textContent =
    msg.message;

    chatBox.appendChild(div);

  });

  chatBox.scrollTop =
  chatBox.scrollHeight;

}


// ======================
// SEND MESSAGE
// ======================

async function sendMessage(){

  const input =
  document.getElementById(
    "messageInput"
  );

  const text =
  input.value.trim();

  if(!text) return;

  const senderId =
    type === "junior"
      ? localStorage.getItem("juniorId")
      : localStorage.getItem("seniorId");

  await fetch(
    "http://localhost:5000/chat/send",
    {
      method:"POST",

      headers:{
        "Content-Type":"application/json"
      },

      body:JSON.stringify({

        conversationId,

        senderId,

        senderType:type,

        message:text

      })

    }
  );

  socket.emit(
  "sendMessage",
  {
    conversationId,
    senderType:type,
    message:text
  }
);

  input.value = "";

  await loadMessages();

}

socket.on(
  "receiveMessage",
  async () => {

    await loadMessages();

  }
);