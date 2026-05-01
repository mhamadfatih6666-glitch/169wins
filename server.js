const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
const fs = require('fs');

const DATA_FILE = './users.json';

function loadUsers() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE);
            return JSON.parse(data);
        }
    } catch(e) {}
    return [
        { username: "admin", password: "admin123", balance: 0, isAdmin: true },
        { username: "player1", password: "1234", balance: 50000 },
        { username: "test", password: "test", balance: 100000 }
    ];
}

function saveUsers(users) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

let users = loadUsers();

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ error: "ناو یان تێپەڕەوشە هەڵەیە" });
    res.json({ username: user.username, balance: user.balance, isAdmin: user.isAdmin || false });
});

app.get('/api/users', (req, res) => {
    const adminKey = req.headers.adminkey;
    if (adminKey !== "169WINS_ADMIN_SECRET_2024") {
        return res.status(403).json({ error: "Access denied" });
    }
    const usersWithoutPassword = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPassword);
});

app.post('/api/admin/update-balance', (req, res) => {
    const { adminKey, username, amount, action } = req.body;
    if (adminKey !== "169WINS_ADMIN_SECRET_2024") {
        return res.status(403).json({ error: "Access denied" });
    }
    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (action === "add") user.balance += amount;
    if (action === "remove") user.balance = Math.max(0, user.balance - amount);
    saveUsers(users);
    res.json({ success: true, newBalance: user.balance });
});

app.post('/api/update-balance', (req, res) => {
    const { username, newBalance } = req.body;
    const user = users.find(u => u.username === username);
    if (user) {
        user.balance = newBalance;
        saveUsers(users);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "User not found" });
    }
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || username.length < 3) {
        return res.status(400).json({ error: "ناو دەبێت لانی کەم 3 پیت بێت" });
    }
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: "ئەم ناوە هەیە" });
    }
    users.push({ username, password, balance: 0, isAdmin: false });
    saveUsers(users);
    res.json({ success: true, balance: 0 });
});

app.use(express.static(__dirname));

const PORT = 3000;
app.listen(PORT, () => {
    console.log('✅ Server running on http://localhost:3000');
    console.log('🔐 Admin Key: 169WINS_ADMIN_SECRET_2024');
});