var moment  = require('moment');
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');

var bot     = require('./config/line');
var User    = require('./config/mlab');

var week = moment().utc().utcOffset(+8).format('ddd');// 星期
var time = moment().utc().utcOffset(+8).format('hA')// 時間

bot.on('follow', function (event) {// 新使用者產生時，儲存ID
  console.log(event.source.userId);
  var user = new User();
  user.userId = event.source.userId;// 將使用者ID對應到儲存格式
  user.save(function(err) {
    if (err) throw err;
    console.log('user ID save successifully!');

    event.source.profile().then(function (profile) {// get user profile displayName
        console.log(profile.displayName);
    });

  });
});

bot.on('unfollow', function (event) {// 使用者封鎖bot時，移除ID
  console.log(event.source.userId);
  User.findOneAndRemove({userId: event.source.userId}, function(err){
    if (err) throw err;
    console.log('user ID deleted successifully');
  });
});

bot.on('message', function(event){
  switch (event.message.type) {
    case 'text':
      switch (event.message.text) {
        case '下周油價':
          request.get('https://gas.goodlife.tw/', function(err,res,data){
            $ = cheerio.load(data);// cheerio 載入html內文, 並儲存至data
            //console.log($('.main P').text());// 下週一 2018 年 07 月 02 日 起, 預計汽油每公升:
            //console.log($('.main h2').text();// 漲跌值
            if($('.main h2').text().slice(1,2) === '漲'){// 如果是漲 哭哭貼圖
              event.reply({
                type: 'sticker',
                packageId: '1',
                stickerId: '123'
              });
            }else if($('.main h2').text().slice(1,2) === '降'){// 如果是降 瀟灑貼圖
              event.reply({
                type: 'sticker',
                packageId: '1',
                stickerId: '120'
              });
            }else {
              event.reply({// 不調整
                type: 'sticker',
                packageId: '1',
                stickerId: '122'
              });
            }
            var predprice = $('.main P').text() + $('.main h2').text();
            console.log(predprice)
            bot.push(event.source.userId, predprice);
          });

          //anonymousObject.output();
          break;

        case '及時油價':
          request.get('https://gas.goodlife.tw/', function(err,res,data){
            $ = cheerio.load(data);// cheerio 載入html內文, 並儲存至data
            //console.log($('.main').text());
            var NewArray = new Array();
            var string = $('#cpc').text().replace(/\s+/g,"");// 讀取中油, 台塑 油價資訊, replace(/\s+/g,"")去除空白字串
            var NewArray = string.split('今日台塑油價');
            var cpcprice = NewArray[0].replace(/油價/, "").replace(/92:/, '\n92 : ').replace(/95油價:/, '\n95 : ').replace(/98:/, '\n98 : ').replace(/柴油:/, '\n柴油 : ');
            //console.log(cpcprice);
            var fpcprice = '\n\n' + "今日台塑" + "" + NewArray[1].replace(/92:/, '\n92 : ').replace(/95油價:/, '\n95 : ').replace(/98:/, '\n98 : ').replace(/柴油:/, '\n柴油 : ');
            //console.log(fpcprice);
            event.reply(cpcprice + fpcprice);
          });
          break;

        case 'admin':
            request.get('https://gas.goodlife.tw/', function(err,res,data){
              $ = cheerio.load(data);// cheerio 載入html內文, 並儲存至data
              var predprice = $('.main P').text() + $('.main h2').text();
              User.find(function(err, users) {
                for (var index in users) {
                  var userinf = users[index];
                  bot.push(userinf.userId, predprice);
                }
              });
            });
          break;

          /*case 'say':
              request.get('https://gas.goodlife.tw/', function(err,res,data){
                $ = cheerio.load(data);// cheerio 載入html內文, 並儲存至data
                var predprice = $('.main P').text() + $('.main h2').text();
                User.find(function(err, users) {
                  for (var index in users) {
                    var userinf = users[index];
                    bot.push(userinf.userId, "您好!!感謝使用此BOT，透過查看更多資訊，新增了 意見調查 與 查看原始碼 功能，歡迎填寫表單提供意見");
                  }
                });
              });
            break;*/

        default:
          event.reply("週五、週日晚上6點自動推波下周油價");
          break;
      }
      break;

    default:
      //console.log(week);
      //console.log(time);
      break;
  }
});

var app = express();
var linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log("App now running on port", port);

  if (week === "Fri" && time === "6PM" || week === "Sun" && time === "6PM") {
    request.get('https://gas.goodlife.tw/', function(err,res,data){
      $ = cheerio.load(data);// cheerio 載入html內文, 並儲存至data
      var predprice = $('.main P').text() + $('.main h2').text();
      User.find(function(err, users) {
        for (var index in users) {
          var userinf = users[index];
          bot.push(userinf.userId, predprice);
          //bot.push(userinf.userId, "測試訊息");
        }
      });
    });
  }

});
