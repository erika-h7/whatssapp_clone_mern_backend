//importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";

// app config
const app = express();
const port = process.env.PORT || 9000;

// pusher
const pusher = new Pusher({
  appId: '1089938',
  key: '48b2a5d6101747e657e4',
  secret: '933569d979215fb46b4b',
  cluster: 'us2',
  encrypted: true
});

// middleware
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*')
})

// DB config

// mongoose.connect(
//   "mongodb+srv://admin:c8kZR4vtMUw9pzlV@cluster0.radvw.mongodb.net/whatsappdb?retryWrites=true&w=majority"
// );
const connection_url =
"mongodb+srv://admin:c8kZR4vtMUw9pzlV@cluster0.radvw.mongodb.net/whatsappdb?retryWrites=true&w=majority";

mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


const db = mongoose.connection

db.once('open', () => {
  console.log('DB connected');

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on('change', (change) => {
    console.log("A change occurred", change);

    if (change.operationType === "insert"){
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error triggering Pusher");
    }
  })
})

// api routes
// get
app.get("/", (req, res) => res.status(200).send("hello world"));

app.get("/messages/sync", (req, res) => {
  const dbMessage = req.body;

  Messages.find(dbMessage,(err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

// post
app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

// listen
app.listen(port, () => console.log(`Listening on localhost: ${port}`));


// "mongodb+srv://admin:c8kZR4vtMUw9pzlV@cluster0.radvw.mongodb.net/whatsappdb?retryWrites=true&w=majority";