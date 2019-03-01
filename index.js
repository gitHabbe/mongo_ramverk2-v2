/**
 * Connect to the database and search using a criteria.
 */
"use strict";

// MongoDB
const mongo = require("mongodb").MongoClient;
const dsn =  process.env.DBWEBB_DSN || "mongodb://localhost:27017/chatlog";

const fs = require("fs");
const path = require("path");
const docs = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, "setup.json"),
    "utf8"
));
// const cors          = require('cors');

// Express server
const port = process.env.DBWEBB_PORT || 1337;
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded(
    { extended: true }
)); // for parsing application/x-www-form-urlencoded
    
// app.use(cors());
    
    
// Just for testing the sever
app.get("/", (req, res) => {
    res.send("Hello World");
});

app.get("/getlog", async (req, res) => {
    let log;
    try {
        log = await findInCollection(dsn, "chatlog", {}, {}, 0);
		console.log('TCL: log', log)
    } catch (error) {
        console.log("/getlog error: ", error);
    }
    return res.json(log);
});

app.get("/getlogsmall", async (req, res) => {
    let log;
    try {
        log = await findInCollection(dsn, "chatlog", {}, {}, 7);
		console.log('TCL: log', log)
        // return res.json(log);
    } catch (error) {
        console.log("/getlog error: ", error);
    }
    return res.json(log);
});

// Return a JSON object with list of all documents within the collection.
app.post("/new-msg", async (req, res) => {
    const { username, chatMsg, date } = req.body;
    const msg = {username, chatMsg, date};
	// console.log('TCL: req.body', req.body)
	console.log('TCL: username, chatMsg, date', username, chatMsg, date)
    try {
        let chatMsg = await saveChatMsg(dsn, "chatlog", msg)

        res.json(chatMsg);
    } catch (err) {
        console.log(err);
        res.json(err);
    }
    return res.json();
});

app.get("/reset", async (req, res) => {
    // Do it.
    resetCollection(dsn, "chatlog", docs)
        .catch(err => console.log(err));
    return res.json();
});






// Startup server and liten on port
app.listen(port, () => {
    console.log(`Server is listening on ${port}`);
    console.log(`DSN is: ${dsn}`);
});



/**
 * Find documents in an collection by matching search criteria.
 *
 * @async
 *
 * @param {string} dsn        DSN to connect to database.
 * @param {string} colName    Name of collection.
 * @param {object} criteria   Search criteria.
 * @param {object} projection What to project in results.
 * @param {number} limit      Limit the number of documents to retrieve.
 *
 * @throws Error when database operation fails.
 *
 * @return {Promise<array>} The resultset as an array.
 */
async function findInCollection(dsn, colName, criteria, projection, limit) {
    const client  = await mongo.connect(dsn);
    const db = await client.db();
    const col = await db.collection(colName);
    const res = await col.find(criteria, projection).limit(limit).sort({date: -1}).toArray();

    await client.close();

    return res;
}

/**
 * Reset a collection by removing existing content and insert a default
 * set of documents.
 *
 * @async
 *
 * @param {string} dsn     DSN to connect to database.
 * @param {string} colName Name of collection.
 * @param {string} doc     Documents to be inserted into collection.
 *
 * @throws Error when database operation fails.
 *
 * @return {Promise<void>} Void
 */
async function resetCollection(dsn, colName, doc) {
    const client  = await mongo.connect(dsn);
    const db = await client.db();
    const col = await db.collection(colName);

    await col.deleteMany();
    await col.insertMany(doc);

    await client.close();
}

async function saveChatMsg(dsn, colName, msg) {
    const client  = await mongo.connect(dsn);
    const db = await client.db();
    const col = await db.collection(colName);

    await col.insertOne(msg);
    console.log("CHAT MSG");

    await client.close();
}