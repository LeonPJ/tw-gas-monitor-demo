var mongoose = require('mongoose');
mongoose.connect('mongodb://');

var Schema = mongoose.Schema;// 建構子
var userSchema = new Schema({// 建構子建立userSchema
  userId: String
});

module.exports = mongoose.model('User', userSchema);// 建立模組化,
