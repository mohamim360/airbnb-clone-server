const express = require("express");
const cors = require("cors");
const { mongoose } = require("mongoose");
const User = require("./models/User");
const Place = require("./models/Place");
const cookieParser = require("cookie-parser");
const imageDownloader = require("image-downloader");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Booking = require("./models/Booking");
const fs = require("fs");
const app = express();
const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "dsc2e2jkjb23322dddwe224244245";
const port = process.env.PORT || 5000;

require("dotenv").config();
app.use(express.json());
app.use(cors({ credentials: true, origin: "http://localhost:5174" }));
app.use("/uploads", express.static(__dirname + "/uploads"));

app.use(cookieParser());

mongoose.connect(process.env.MONGO_URL);

function userToken(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userInfo) => {
      if(err) throw err;
      resolve(userInfo);
    });
  });
}

app.get("/", (req, res) => {
  res.send("hello");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (e) {
    res.json(e);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });
  if (userDoc) {
    const pass = bcrypt.compareSync(password, userDoc.password);
    if (pass) {
      jwt.sign(
        { email: userDoc.email, id: userDoc._id },
        jwtSecret,
        {},
        (err, token) => {
          if (err) throw err;
          res.cookie("token", token);
          res.json(userDoc);
        }
      );
    } else {
      res.json("login failed");
    }
  } else {
    res.json("user not found");
  }
});

//profile

app.get("/profile", (req, res) => {
  const { token } = req.cookies;

  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userInfo) => {
      if (err) throw err;
      const { name, email, _id } = await User.findById(userInfo.id);

      res.json({ name, email, _id });
    });
  } else {
    res.json(null);
  }
});

//logout

app.post("/logout", (req, res) => {
  res.cookie("token", "").json(true);
});

//upload

app.post("/upload-link", async (req, res) => {
  const { link } = req.body;

  const newName = "photo" + Date.now() + ".jpg";
  await imageDownloader.image({
    url: link,
    dest: __dirname + "/uploads/" + newName,
  });
  res.json(newName);
});

const photoMiddleware = multer({ dest: "uploads/" });
app.post("/upload", photoMiddleware.array("photos", 100), (req, res) => {
  const uploadFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const { path, originalname } = req.files[i];
    console.log(path);
    console.log(originalname);
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    console.log(ext);
    const newPath = path + "." + ext;

    fs.renameSync(path, newPath);

    uploadFiles.push(newPath.replace("uploads\\", ""));
    console.log(uploadFiles);
  }
  res.json(uploadFiles);
});

//places
app.post("/places", (req, res) => {
  const { token } = req.cookies;

  const {
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
  } = req.body;

  jwt.verify(token, jwtSecret, {}, async (err, userInfo) => {
    if (err) throw err;
    const placeInfo = await Place.create({
      owner: userInfo.id,
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
      price,
    });
    res.json(placeInfo);
  });
});

app.get("/user-places", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userInfo) => {
    const { id } = userInfo;
    res.json(await Place.find({ owner: id }));
  });
});

app.get("/places/:id", async (req, res) => {
  const { id } = req.params;
  res.json(await Place.findById(id));
});

app.put("/places", async (req, res) => {
  const { token } = req.cookies;

  const {
    id,
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
  } = req.body;

  jwt.verify(token, jwtSecret, {}, async (err, userInfo) => {
    if (err) throw err;
    const placeDoc = await Place.findById(id);
    if (userInfo.id === placeDoc.owner.toString()) {
      placeDoc.set({
        title,
        address,
        photos: addedPhotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuests,
        price,
      });
      await placeDoc.save();
      res.json("ok");
    }
  });
});

//places--IndexPage

app.get("/places", async (req, res) => {
    
  res.json(await Place.find());
});

//bookings

app.post("/bookings", async (req, res) => {
  const userInfo = await userToken(req)

  const { place, checkIn, checkOut, numberOfGuests, name, phone, price, } =
    req.body;

  Booking.create({
    place,
    checkIn,
    checkOut,
    numberOfGuests,
    name,
    phone,
    price,
    user:userInfo.id,
  })
    .then((doc) => {
      res.json(doc);
    })
    .catch((err) => {
      throw err;
    });
});



app.get("/bookings", async (req, res) => {
  const userInfo = await userToken(req);
  res.json(await Booking.find({user:userInfo.id}).populate('place'))
});

//listen

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
