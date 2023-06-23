const express = require("express");
const cors = require("cors");
const { default: mongoose } = require("mongoose");
const User = require("./models/User");
const cookieParser = require("cookie-parser");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "dsc2e2232323322dd";
const port = process.env.PORT || 5000;

require("dotenv").config();
app.use(express.json());
app.use(cors());
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

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
          console.log(token)
          if (err) throw err;
          res.cookie("token", token).json('pass ok')
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
