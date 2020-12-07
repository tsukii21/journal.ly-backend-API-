require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();

app.use(cors());
app.use(express.json());

//database connection

mongoose.connect(process.env.DBURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const connection = mongoose.connection;
connection.once("open", () => {
  console.log("Connected to database successfully");
});

//database models

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

const entrySchema = new Schema(
  {
    title: { type: String, required: true },
    user_id: { type: String },
    content: { type: String, required: true },
    date: { type: Date, required: true },
    isSpecial: { type: Boolean, required: true },
  },
  {
    timestamps: true,
  }
);

const Entry = mongoose.model("Entry", entrySchema);

//routes

app.get("/", (req, res) => {
  res.json("Welcome to journal API!");
});

app.post("/users/add", async (req, res) => {
  try {
    let newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: md5(req.body.password),
    });
    return res.status(200).json(newUser);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json("email already taken");
    else return res.status(400).json("something went wrong");
  }
});

app.post("/users/verify", async (req, res) => {
  try {
    let user = await User.findOne({ email: req.body.email });
    if (user.password === md5(req.body.password)) {
      return res.status(200).json(user);
    } else {
      return res.status(401).json("incorrect email/password");
    }
  } catch (err) {
    return res.status(401).json("incorrect email/password");
  }
});

app.get("/entries", (req, res) => {
  Entry.find()
    .then((entries) => res.json(entries))
    .catch((err) => res.status(400).json("Error: " + err));
});

app.get("/:id/entries", (req, res) => {
  Entry.find({ user_id: req.params.id })
    .then((entries) => res.json(entries))
    .catch((err) => res.status(400).json("Error: " + err));
});

app.post("/entries/add", (req, res) => {
  const newEntry = new Entry({
    title: req.body.title,
    user_id: req.body.user_id,
    content: req.body.content,
    date: Date.parse(req.body.date),
    isSpecial: req.body.isSpecial,
  });
  newEntry
    .save()
    .then(() => res.json("Entry added!"))
    .catch((err) => res.status(400).json("Error: " + err));
});

app.get("/entries/:id", (req, res) => {
  Entry.findById(req.params.id)
    .then((entry) => res.json(entry))
    .catch((err) => res.status(400).json("Error: " + err));
});

app.delete("/entries/:id", (req, res) => {
  Entry.findByIdAndDelete(req.params.id)
    .then(() => res.json("Entry deleted!"))
    .catch((err) => res.status(400).json("Error: " + err));
});

app.post("/entries/update/:id", (req, res) => {
  Entry.findById(req.params.id)
    .then((entry) => {
      entry.title = req.body.title;
      entry.content = req.body.content;
      entry.date = Date.parse(req.body.date);
      entry.isSpecial = req.body.isSpecial;
      entry
        .save()
        .then(() => res.json("Entry updated!"))
        .catch((err) => res.status(400).json("Error: " + err));
    })
    .catch((err) => res.status(400).json("Error: " + err));
});

app.listen(5000, () => {
  console.log("Server started at port 5000");
});
