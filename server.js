require('dotenv').config();
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
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
            return console.log(err)
          }
          });

}

app.post("/api/shorturl/new", (req,res)=>{
  const myOriginalUrl = req.body.url;

  dns.lookup(myOriginalUrl, (err, addresses, family)=>{
    if(err){
      console.log(err);
    }

    const currentUrl = err.hostname;
    

      bcrypt.hash(myOriginalUrl, 10, (err,hash)=>{
      if(err){
        console.log(err)
      }

      const shortString = hash.substring(1,6)
      
      saveUrl(currentUrl, shortString);
      res.json({
        originalUrl: currentUrl,
        shortUrl: shortString
      })

      });
  });
});

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


