require('dotenv').config();
const bodyParser = require("body-parser");
const sha1 = require('sha1');
const dns = require('dns');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();

mongoose.connect(process.env.MONGO_URI, {
  useNewURLParser: true, 
  useUnifiedTopology: true
});

if(!mongoose.connection.readyState){
  console.log("database error")
}

  // Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

const urlSchema = new mongoose.Schema({
  originalUrl: {type: String,
    required: true,
    index: {
      unique: true
    }},
  shortUrl: {type: String,
    required: true,
    index: {
      unique: true
    }}
});

let sampleUrl = mongoose.model("sampleUrl", urlSchema);

const saveUrl = (currentUrl, hash, res) => {
        const myUrl = new sampleUrl({
        originalUrl: currentUrl,
        shortUrl: hash
      });

          myUrl.save((err,data)=>{
          if(err){
            showExistingUrl(currentUrl, res)
          }else{
            res.json({
        "original_url": currentUrl,
        "short_url": hash
        })
            
          }
          });

}

const getDomain =(url) => {
  var urlSplit = url.split("https://");
  if (urlSplit[1] == undefined) {
    return urlSplit[0].split("/")[0];
  } else {
    return urlSplit[1].split("/")[0];
  }
};

app.post("/api/shorturl/new", (req,res)=>{
  const myOriginalUrl = req.body.url;

  var domain = getDomain(myOriginalUrl);
  dns.resolveAny(domain, (err, address) => {
    if(err){
      res.json({'error':'invalid url'})
    } else {
      const shortUrlOutput = sha1(myOriginalUrl).toString()  
      saveUrl(myOriginalUrl, shortUrlOutput, res)
        
    }

  })

  
    //const currentUrl = err.hostname;

    
  
      
  
});

const showExistingUrl = (currentUrl, res) =>{

  sampleUrl.findOne({'originalUrl': currentUrl},(err,url)=>{
    
    if(err){
      console.log(err)
    }

    if(url == null){
      res.json({
        "error":"invalid url"
      })
    } else {
      res.json({
        "original_url": url.originalUrl,
        "short_url": url.shortUrl
        })
    }

    


  })
}
  


app.get("/api/shorturl/:shorturl",(req,res)=>{
  var myShortUrl = req.params.shorturl;

  //get originalUrl by shortUrl

  sampleUrl.findOne({'shortUrl': myShortUrl}, (err,url)=>{
    if(err){
      res.json({"error": "invalid url"})
    }

    if(url == null){
      res.json({
        "error":"invalid url"
      })
    } else {
      res.redirect(url.originalUrl);
    }

    
  });
});


