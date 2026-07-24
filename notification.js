const container =
document.getElementById(
  "notificationsList"
);

async function loadNotifications() {

  try {

    const res =
    await fetch(
      "http://localhost:5000/notifications"
    );

    const data =
    await res.json();

    container.innerHTML = "";

    if (data.length === 0) {

      container.innerHTML = `
        <p>No recent activity</p>
      `;

      return;
    }

    data.forEach(item => {

      const card =
      document.createElement("div");

      card.className =
      "notification-card";

      card.style.cursor =
      "pointer";

      card.innerHTML = `
        <h3>
          ${
            item.type === "post"
            ? "📢 New Community Post"
            : "💬 New Community Reply"
          }
        </h3>

        <p>${item.content}</p>

        <small>
          ${new Date(
            item.created_at
          ).toLocaleString()}
        </small>
      `;

      card.addEventListener(
        "click",
        () => {

          window.location.href =
          `discussion.html?id=${item.post_id}`;

        }
      );

      container.appendChild(card);

    });

  } catch (err) {

    console.error(
      "Error loading notifications:",
      err
    );

  }
}

loadNotifications();