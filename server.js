const express = require("express");
const connectDB = require("./config/db");
const app = express();

// Connect Database

connectDB();
// Init middle ware
app.use(express.json({ extended: false }));

app.get("/", (req, res) => res.send("API Running"));

// Define Routes

app.use("/api/users", require("./routes/api/user"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/posts", require("./routes/api/post"));
app.use("/api/auth", require("./routes/api/auth"));

// Useful for heroku in future for now 5000 will be used when PORT is called
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on Port : ${PORT}`));
