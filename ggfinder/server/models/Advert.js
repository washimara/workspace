const mongoose = require('mongoose');

const advertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  location: {
    type: String
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    }
  },
  customFields: [{
    name: String,
    value: String
  }],
  tags: [String],
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  privateKey: {
    type: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  upvotes: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a geospatial index on the coordinates field
advertSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Advert', advertSchema);