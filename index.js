const express = require('express');
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const User = require('./models/User')
const bcrypt = require('bcryptjs')
const app = express();
const bcryptSalt = bcrypt.genSaltSync(10)
const port = 5000
require('dotenv').config()
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URL)

app.get('/',(req,res)=>{
  res.send('hello');
})

app.post('/register',async (req,res)=>{
  const {name , email ,password} = req.body;
const userDoc = await User.create({
    name,
    email,
    password:bcrypt.hashSync(password,bcryptSalt)
  })
  res.json(userDoc);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

