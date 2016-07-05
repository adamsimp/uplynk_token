var express = require('express');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var app = express();

//for CORS
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.send(200);
    } else {
        next();
    }
};

app.use(allowCrossDomain);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views')
app.set('port', (process.env.PORT || 5000));

//emulate PHP's http_build_query to make query string from object
var http_build_query = function(obj) {
    var str = [];
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    }
    return str.join("&");
};

var generateToken = function(msg) {
    var URI_PREFIX = "http://content.uplynk.com/";
    var URI_Suffix = ".m3u8?";
    var URI_Type = "";
    var r = {}; // response object

    if (msg.ct && msg.key && msg.exp && ((msg.cid || (msg.eid && msg.oid)))) {
        // Check for multi asset, convert asset array to string and replace whitespace
        if (msg.cid && msg.cid.length > 0) {
            msg.cid = msg.cid.toString().replace(/ /g, '');
            var URI_Media = msg.cid;
            if (msg.cid.split(",").length > 1) {
                URI_Suffix = "/multiple.m3u8?";
            }
        } else {
            msg.eid = msg.eid.toString().replace(/ /g, '');
            var URI_Media = 'ext/' + msg.oid + '/' + msg.eid;
            if (msg.eid.split(",").length > 1) {
                URI_Suffix = "/multiple.m3u8?";
            }
        }
    } else {
        r.error = 1;
        return r;
    }

    //add the Token check algorithm version (currently use a value of '1')
    msg.tc = 1;

    //add the random number
    msg.rn = Math.floor(Math.random() * Math.pow(2, 32));

    if (msg.ct == 'c') {
        URI_Type = "channel/"
    }

    //format the expiration of token
    msg.exp = parseInt(new Date().getTime() / 1000) + parseInt(msg.exp * 60);

    //msg.iph = crypto.createHash('sha256').update(request.connection.remoteAddress).digest('hex');

    //remove the key!
    var api = msg.key
    delete msg.key;

    //build the sig
    msg.sig = crypto.createHmac('sha256', api).update(http_build_query(msg)).digest('hex');
    var _msg = http_build_query(msg);
    r.sig = msg.sig;
    if (msg.v == "2") {
        r.url = URI_PREFIX + 'preplay/' + URI_Type + URI_Media + '.json?' + _msg;
    } else {
        r.url = URI_PREFIX + URI_Type + URI_Media + URI_Suffix + _msg;
    }
    r.error = 0;
    return r;
};

app.get('/token', function(req, res) {
    var result;
    res.render('index', { result: result });
});

/*
request.query.x will have the query string params(?ad=something & ad.postroll=1)
required params:
  ct (content type a or c)
  cid (guid)
  exp (in minutes)
  key apikey
optional params:
  v=2 if it's included return preplay, else return playback url
*/
// POST: {"ct":"a","cid":"xxx" ....}  <-- raw JSON encoding
app.post('/token', function(req, res) {
    var msg = {};
    for (item in req.body) {
        msg[item] = req.body[item];
    }
    var result = generateToken(msg);

    if(result.error == 0){
      res.status(200).send(result);
    }
    else{
      res.status(500).json("missing required params; ct, cid (or eid + oid), exp, key");
    }
});

// Slack Integration
app.post('/token-slack', function(req, res) {
    var text = req.body.text;
    var msg = {}
    if (text) {
        var items = text.split("|");
        if (items.length == 0) {
            return res.status(500).send("Error. Correct Usage: /token-generator cid=[asset1,asset2,..,assetN]|ct=a[c]|exp=2|key=api_key");
        }
        for (var item = 0; item < items.length; item++) {
            var keyValue = items[item].split("=");
            if (keyValue.length == 2) {
                var param = keyValue[0];
                var value = keyValue[1];
                msg[param] = value;
            } else {
                return res.status(500).send("Error. Correct Usage: /token-generator cid=[asset1,asset2,..,assetN]|ct=a[c]|exp=2|key=api_key");
            }
        }
        generateToken(msg, res);
    } else {
        res.status(200).send("Usage: /token-generator cid=asset1[,asset2,..,assetN]|ct=a[c]|exp=2|key=api_key");
    }
});

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'));
});
