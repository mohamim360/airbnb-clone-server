const express = require("express");
const cors = require("cors");
const { default: mongoose } = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "dsc2e2232323322dd";
const port = process.env.PORT || 5000;

require("dotenv").config();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URL);

app.get("/", (req, res) => {
  res.send("hello");
});

app.post("/register", async (req, res) => {

  
  const { name, email, password } = req.body;

  try{
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  }
  catch(e){
    res.json(e);
  }
});

app.post("/login", async (req, res) => {
  
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });
  if (userDoc) {
    const pass = bcrypt.compareSync(password, userDoc.password);
    if (pass) {
      res.json("login success");

      jwt.sign(
        { email: userDoc.email, id: userDoc._id },
        jwtSecret,
        {},
        (err, token) => {
          if (err) throw err;
          res.cookie("token", token);
        }
      );
    } else {
      res.json("login failed");
    }
  } else {
    res.json("user not found");
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
