const styles = ["headline", "column", "editorial", "sidebar", "quote"];
const bannedWords = ["fuck", "shit", "bitch"];

function sanitize(text) {
  bannedWords.forEach(w => {
    const r = new RegExp(w, "gi");
    text = text.replace(r, "***");
  });
  return text;
}

// Create Page
function createPage() {
  const username = document.getElementById("username").value.trim().toLowerCase();
  if (!username || username.includes(" ")) return alert("Invalid username");

  db.collection("pages").doc(username).set({ createdAt: Date.now() })
    .then(() => location.href = `page.html?u=${username}`);
}

// Public Page
if (location.pathname.includes("page.html")) {
  const u = new URLSearchParams(location.search).get("u");
  document.getElementById("pageTitle").innerText = u;

  db.collection("messages")
    .where("page", "==", u)
    .where("approved", "==", true)
    .onSnapshot(snap => {
      const box = document.getElementById("messages");
      box.innerHTML = "";
      snap.forEach(doc => {
        const d = doc.data();
        const div = document.createElement("div");
        div.className = `message ${styles[Math.floor(Math.random()*styles.length)]}`;
        div.innerText = d.text;

        if (d.reply) {
          const r = document.createElement("div");
          r.className = "reply";
          r.innerText = d.reply;
          div.appendChild(r);
        }

        box.appendChild(div);
      });
    });
}

// Send Message (Rate-limited)
function sendMessage() {
  const last = localStorage.getItem("lastMsg");
  if (last && Date.now() - last < 60000) {
    return alert("Wait 1 minute before posting again.");
  }

  const u = new URLSearchParams(location.search).get("u");
  let text = document.getElementById("messageInput").value.trim();
  if (!text) return;

  text = sanitize(text);

  db.collection("messages").add({
    page: u,
    text,
    approved: false,
    createdAt: Date.now()
  });

  localStorage.setItem("lastMsg", Date.now());
  document.getElementById("messageInput").value = "";
}

// Dashboard
if (location.pathname.includes("dashboard.html")) {
  const u = prompt("Enter your username");

  db.collection("messages")
    .where("page", "==", u)
    .onSnapshot(snap => {
      const dash = document.getElementById("dashboard");
      dash.innerHTML = "";
      snap.forEach(doc => {
        const d = doc.data();
        const div = document.createElement("div");
        div.className = "dash-card";

        div.innerHTML = `
          <p>${d.text}</p>
          <textarea placeholder="Reply">${d.reply || ""}</textarea>
          <button onclick="reply('${doc.id}', this)">Save Reply</button>
          <button onclick="approve('${doc.id}')">Approve</button>
          <button onclick="removeMsg('${doc.id}')">Delete</button>
        `;
        dash.appendChild(div);
      });
    });
}

function reply(id, btn) {
  const text = btn.previousElementSibling.value;
  db.collection("messages").doc(id).update({ reply: text });
}

function approve(id) {
  db.collection("messages").doc(id).update({ approved: true });
}

function removeMsg(id) {
  db.collection("messages").doc(id).delete();
    }
