const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
app.use(express.static("public"));
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const USERS_FILE = "./users.json";

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.post("/auth", (req, res) => {
  const { id, username, avatar, ref } = req.body;
  if (!id || !username) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const users = loadUsers();
  let user = users.find(u => String(u.id) === String(id));

  if (!user) {
    user = { id: String(id), username, avatar, balance: 0, referrals: [] };
    users.push(user);

    if (ref && String(ref) !== String(id)) {
      const inviter = users.find(u => String(u.id) === String(ref));
      if (inviter && !inviter.referrals.includes(String(id))) {
        inviter.referrals.push(String(id));
      }
    }

    saveUsers(users);
    return res.json({ status: "registered" });
  }

  res.json({ status: "already exists" });
});

app.get("/user/:id", (req, res) => {
  const users = loadUsers();
  const user = users.find(u => String(u.id) === String(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.post("/update-balance", (req, res) => {
  const { id, delta } = req.body;
  const users = loadUsers();
  const user = users.find(u => String(u.id) === String(id));
  if (!user) return res.status(404).json({ error: "User not found" });

  user.balance += delta;
  saveUsers(users);
  res.json({ balance: user.balance });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
