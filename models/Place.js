const mongoose = require('mongoose');
const { schema } = require('./User');


const placeSchema = new mongoose.Schema({
  owner: {type:mongoose.Schema.Types.ObjectId, ref:'User'},
  title: String,
  address: String,
  photos: [String],
  description: String,
  perks: [String],
  extraInfo: String,
  checkIn: Number,
  checkOut: Number,
  maxGuests: Number,
  price: Number
})

const PlacesModel = mongoose.model('Place', placeSchema);

module.exports = PlacesModel;