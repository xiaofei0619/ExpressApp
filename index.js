const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongo = require('mongodb');

const PORT = 3030;

const app = express();

// Setup MongoDB
const dbName = 'demo_db';
const dbUrl = 'mongodb://localhost:27017';
const MongoClient = mongo.MongoClient;

let db, collection;

MongoClient.connect(dbUrl, function(err, client) {
    if (err) {
        console.log("Failed to connect to db server", err);
    } else {
        console.log("Connected successfully to the db server");
        db = client.db(dbName);
        collection = db.collection('doohickeys');
    }
})

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(express.static('public'));
app.use('/imgs', express.static('images'));

const datalist = require('./data/MOCK_DATA.json');
const data = {};
datalist.map(item => {
    data[item['id']] = item;
});

// app.get('/', (req, res) => {
//     res.send(`
//     <html>
//         <head>
//             <title>Express Basic App</title>
//         </head>
//         <body>
//             <h1>My Simple App</h1>
//             <p>Welcome to my simple app</p>
//         </body>
//     </html>`)
// });

// app.get('/data', (req, res) => {
//     res.json(data);
// });

app.get('/', (req, res) => {
    res.json(data);
});

app.get('/data/:id', (req, res, next) => {
    console.log(`Looking for ID ${req.params.id}`);
    let user = Number(req.params.id);
    res.send(data[user - 1]);
    next();
}, (req, res, next) => {
    console.log('Did we get the right data?');
    next();
}, () => {
    console.log("Another next called");
});

app.get('/northeastern', (req, res) => {
    res.redirect('http://www.northeastern.edu/');
});

app.get('/dl', (req, res) => {
    res.download('images/canyon.jpeg');
});

// POST Request
// Method 1: x-www-form-urlencoded
app.use(express.urlencoded({extended: true}));
// Method 2: raw JSON
app.use(express.json());

app.post('/newItem', (req, res) => {
    console.log("Here is the request body");
    console.log(req.body);
    let newItem = req.body;
    newItem.id = Object.keys(data).length + 1;
    data[newItem.id] = { "id": newItem.id, ... newItem };
    //data.push(newItem);
    res.send(`I got a POST request with /newItem on port ${PORT}`);
});

// DELETE Request
// This is a very naive way to delte an item from the data list. 
// It breaks the subsequent id requests
app.delete('/data/:id', (req, res) => {
    //let index = req.params.id - 1;
    //data.splice(index, 1);
    data[req.params.id] = null;
    res.send(`I got a DELETE request for /item ${req.params.id}`);
});

// app.route('/chain')
//     .get((req, res) => {
//         res.send('A GET request with the /chain route');
//     })
//     .post((req, res) => {
//         res.send('A POST request with the /chain route');
//     })
//     .put((req, res) => {
//         res.send('A PUT request with the /chain route');
//     })
//     .delete((req, res) => {
//         res.send('A DELETE request with the /chain route');
//     })

// app.get('/errorExample', (req, res) => {
//     throw new Error();
// });

// app.use((err, req, res, next) => {
//     console.log(err.stack);
//     res.status(500).send(`<span style="color: red">
//     <strong>Red Alert!</strong></spn><br>
//     ${err.stack}`);
// })

class Contact {
    constructor(id, fname, lname, email, gender) {
        this.id = id,
        this.first_name = fname,
        this.last_name = lname,
        this.email = email,
        this.gender = gender
    }
}

class Doohickey {
    constructor(id, name, description) {
        this.id = id,
        this.name = name,
        this.description = description
    }
}

//Build GraphQL Schema
const schema = buildSchema(`
    type Contact {
        id: ID
        first_name: String
        last_name: String
        email: String
        gender: String
    }

    type Doohikey {
        id: ID
        name: String
        description: String
    }

    type Query {
        hello: String
    }
`);

const root = {
    hello: () => {
        return "Hello World"
    }
}

app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
})
