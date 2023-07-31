const express = require('express');
const app = express();
const fs = require('fs');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io')
const sqlite3 = require('sqlite3').verbose();
const server = http.createServer(app);
const port = 3098;

const dbPath = path.join(__dirname, 'database.db');
const exists = fs.existsSync(dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if(err){
    console.log('Error opening database:', err.message);
  } else {
    console.log('Database connected');
    server.listen(port, () => {
      console.log(`http://localhost:${port}`);
    });
  }
})

if (!exists) {
  db.run('CREATE TABLE contacts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT)');
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

const io = new Server(server);

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('getContacts', () => {
    db.all("SELECT * FROM contacts", (err, rows) => {
      if(!err){
        io.emit('resultContacts', rows)
      }
    })
  })

  socket.on('addContact', (data) => {
    let dataName = data.name;
    let dataPhone = data.phone;
    db.run(`INSERT INTO contacts (name, phone) VALUES ("${dataName}", "${dataPhone}")`);
    let info = 'Berhasil disimpan!';
    io.emit('info', info)
  })

})

app.get('/', (req, res) => {
  res.send('Socket Server')
})