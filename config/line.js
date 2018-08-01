var linebot = require('linebot');

var bot = linebot({
  channelId: '',// channel Id
  channelSecret: '',// channel Secret
  channelAccessToken: ''// channel Access A Token
});

module.exports = bot;
