const express = require("express");
const path = require("path");

const app = express();
const http = require("http");
const cors = require("cors");
const connectDB = require("./db");
const moment = require("moment-timezone");

process.env.TZ = 'America/New_York';

console.log("Current time in America/New_York:", moment().format());

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

connectDB();

app.use(cors());
app.use(express.json()); // This line is crucial

const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: process.env.CORS_ORIGIN || "http://localhost:5173",
//     methods: ["GET", "POST"],
//   },
// });

app.use("/api/transaction", require("./api/transaction"));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../client/dist")));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});



const PORT = process.env.PORT || 3001; // Fallback to 3001 if the PORT env variable is not set

server.listen(PORT, () => {
  console.log("server is running");
});
