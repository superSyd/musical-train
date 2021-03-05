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

app.use(bodyParser.urlencoded({ extended: "true" }));
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

const saveUrl = (currentUrl, hash) => {
        const myUrl = new sampleUrl({
        originalUrl: currentUrl,
        shortUrl: hash
      });

          myUrl.save((err,data)=>{
          if(err){
            return false
          }else{
            return true
          }
          });

}

app.post("/api/shorturl/new", (req,res)=>{
  const myOriginalUrl = req.body.url;

  dns.lookup(myOriginalUrl, (err, addresses, family)=>{
    if(err.errno != 'ENOTFOUND'){
      res.json({'error':'Invalid URL'})
    }

    });

    //const currentUrl = err.hostname;

    const shortUrlOutput = sha1(myOriginalUrl)      
        
        if(saveUrl(myOriginalUrl, shortUrlOutput)){
        res.json({
        original_url: myOriginalUrl,
        short_url: shortUrlOutput
        })
      } else {
        
       showExistingUrl(myOriginalUrl, res)
      };
  
      
  
});

const showExistingUrl = (currentUrl, res) =>{

  sampleUrl.findOne({'originalUrl': currentUrl},(err,url)=>{
    
    if(err){
      console.log(err)
    }

    res.json({
        original_url: url.originalUrl,
        short_url: url.shortUrl
        })


  })
}
  


app.get("/api/shorturl/:shorturl",(req,res)=>{
  var myShortUrl = req.params.shorturl;

  //get originalUrl by shortUrl

  sampleUrl.findOne({'shortUrl': myShortUrl}, (err,url)=>{
    if(err){
      res.json({"error": "Invalid URL"})
    }

      
      res.redirect(url.originalUrl);
    
  });
});


