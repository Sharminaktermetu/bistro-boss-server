const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
// middleware
app.use(cors())
app.use(express.json());
require('dotenv').config()


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pjt1xjf.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const menuCollection = client.db("bistroBoss").collection("menu");
    const reviewCollection = client.db("bistroBoss").collection("review");
    const cartCollection = client.db("bistroBoss").collection("cart");

    app.get("/menu", async (req, res) => {
      const cursor = menuCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get("/review", async (req, res) => {
      const cursor = reviewCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })
    // added cart related apis
    app.get("/cart", async (req, res) => {
      const email =req.query.email;
      console.log(email);
      if(!email){
        res.send([])
      }
      const query ={email:email}
      const result= await cartCollection.find(query).toArray();
      res.send(result)
      
    })

    app.post('/cart',async(req,res)=>{
      const items =req.body;
      const result =await cartCollection.insertOne(items)
      res.send(result)
    })
app.delete('/cart/:id',async(req,res)=>{
  const id =req.params.id;
  const query={_id: new ObjectId(id)}
  const result=await cartCollection.deleteOne(query)
  res.send(result)
})



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);










app.get('/', (req, res) => {
  res.send('Boss is running')
})
app.listen(port, () => {
  console.log(`Boss is running on port ${port}`);
})