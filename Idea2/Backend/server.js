const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const ConnectDB = require("./ConnectDB");
const jwt = require("jsonwebtoken");

// ==== Config ====
dotenv.config();
const PORT = process.env.PORT || 8000;

// ==== Initialize App ====
const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // frontend
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  },
});

// ==== Middleware ====
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "DELETE", "PUT"],
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/// Improved Socket.IO Logic with better mob management
let mobs = {}; // mobId -> { users: [], timer, productId, discount, startTime }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("start-mob", ({ productId, userId }, callback) => {
    if (!productId || !userId) {
      return callback({ success: false, error: "Missing required fields" });
    }

    const mobId = uuidv4();
    const startTime = Date.now();
    
    mobs[mobId] = {
      users: [{ socketId: socket.id, userId }],
      productId,
      discount: 0,
      startTime,
      duration: 15 * 60 * 1000 // 15 minutes in milliseconds
    };

    socket.join(mobId);

    // Set timer to end mob
    mobs[mobId].timer = setTimeout(() => {
      io.to(mobId).emit("mob-end", {
        mobId,
        users: mobs[mobId].users,
        discount: mobs[mobId].discount,
        productId: mobs[mobId].productId
      });
      delete mobs[mobId];
    }, mobs[mobId].duration);
    
    console.log("Creating mob for", userId, "=>", mobId);
    callback({ 
      success: true, 
      mobId,
      timeRemaining: mobs[mobId].duration
    });
  });

  socket.on("join-mob", ({ mobId, userId }) => {
    if (!mobs[mobId]) {
      return socket.emit("error", { message: "Mob not found or has ended" });
    }

    // Check if user is already in the mob
    const existingUser = mobs[mobId].users.find(u => u.userId === userId);
    if (existingUser) {
      return socket.emit("error", { message: "You are already in this mob" });
    }

    // Add user to mob
    mobs[mobId].users.push({ socketId: socket.id, userId });
    socket.join(mobId);

    // Calculate discount based on participant count
    const count = mobs[mobId].users.length;
    let discount = 0;
    if (count >= 2) discount = 5;
    if (count >= 5) discount = 10;

    mobs[mobId].discount = discount;

    // Calculate remaining time
    const elapsed = Date.now() - mobs[mobId].startTime;
    const timeRemaining = Math.max(0, mobs[mobId].duration - elapsed);

    // Send update to all participants
    io.to(mobId).emit("mob-update", {
      users: mobs[mobId].users,
      discount,
      timeRemaining: Math.floor(timeRemaining / 1000) // Send in seconds
    });

    console.log(`User ${userId} joined mob ${mobId}. Total participants: ${count}`);
  });

  socket.on("get-mob-info", ({ mobId }) => {
    if (!mobs[mobId]) {
      return socket.emit("error", { message: "Mob not found or has ended" });
    }

    const elapsed = Date.now() - mobs[mobId].startTime;
    const timeRemaining = Math.max(0, mobs[mobId].duration - elapsed);

    socket.emit("mob-info", {
      users: mobs[mobId].users,
      discount: mobs[mobId].discount,
      timeRemaining: Math.floor(timeRemaining / 1000),
      productId: mobs[mobId].productId
    });
  });

  socket.on("disconnect", () => {
    for (const mobId in mobs) {
      const mob = mobs[mobId];
      const userIndex = mob.users.findIndex(u => u.socketId === socket.id);
      
      if (userIndex !== -1) {
        // Remove user from mob
        mob.users.splice(userIndex, 1);
        
        if (mob.users.length === 0) {
          // No users left, end the mob
          clearTimeout(mob.timer);
          delete mobs[mobId];
          console.log(`Mob ${mobId} ended - no participants left`);
        } else {
          // Recalculate discount
          const count = mob.users.length;
          let discount = 0;
          if (count >= 2) discount = 5;
          if (count >= 5) discount = 10;

          mob.discount = discount;

          // Calculate remaining time
          const elapsed = Date.now() - mob.startTime;
          const timeRemaining = Math.max(0, mob.duration - elapsed);

          // Update remaining participants
          io.to(mobId).emit("mob-update", {
            users: mob.users,
            discount,
            timeRemaining: Math.floor(timeRemaining / 1000)
          });
        }
        break;
      }
    }

    console.log("User disconnected:", socket.id);
  });
});
// Imports for controllers 
const {createUser, 
    addUserAddress, logUser} = require("./controller/userController");

const {
    getAllCategories, 
    getCategoryById, 
    getAllSubCategories,
    getSubCategoriById,
    getProductsBySubCategory,} = require("./controller/productController");

// Connection of Databases as Postgre and MongoDB
ConnectDB.connectToPostgresSQL();
ConnectDB.connectToMongo();

app.get('/', (req, res)=>{
    return res.json({message:"Hello it's bot server"});
})

// API call for user login
app.post('/api/login', async(req, res) => {
    try {
        const {username, password} = req.body;
        console.log(username, password);
        if(!username) return res.status(422).json({message:"Username is missing"});
        if(!password) return res.status(422).json({message:"password is missing"});
        
        const DB_res = await logUser(username, password);
        console.log(DB_res.data[0].userid)
        console.log(DB_res.data[0].username)
        
        if(DB_res.status == 200){
            const token = jwt.sign({
                userId: DB_res.data[0].userid,
                username: DB_res.data[0].username
            }, process.env.JWT_SECRET);
            res.cookie('userCookie', token);
            res.status(200).json({message:"registration successful"});
        }
        else if(DB_res.status == 404){
            res.status(DB_res.status).json({message:DB_res.message});
        }
        else{
            res.status(DB_res.status).json({message:DB_res.message});
        }

    } catch (error) {
        console.log("Error while loggin user = ",error);
        res.status(500).json({message:"Server Error"})
    }
})

// API call for registering new user
app.post('/api/register', async(req, res)=>{
    const {username, email, password, firstname, lastname, phonenumber, dateofbirth} = req.body;
    
    if(!username) return res.status(422).json({message:"Username is missing"});
    if(!email) return res.status(422).json({message:"email is missing"});
    if(!password) return res.status(422).json({message:"password is missing"});
    if(!firstname) return res.status(422).json({message:"firstname is missing"});
    if(!lastname) return res.status(422).json({message:"lastname is missing"});
    if(!phonenumber) return res.status(422).json({message:"phonenumber is missing"});
    if(!dateofbirth) return res.status(422).json({message:"dateofbirht is missing"});
    
    try {
        const DB_res = await createUser(username, email, password, firstname, lastname, phonenumber, dateofbirth);

        if(DB_res.status == 201){
            const token = jwt.sign({
                userId: DB_res.data.userid,
                username: DB_res.data.username
            }, process.env.JWT_SECRET);
            res.cookie('userCookie', token);
            res.status(200).json({message:"registration successful"});
        }
        else{
            res.status(DB_res.status).json({message:DB_res.message});
        }
    } catch (error) {
        console.log("Error while registering user", error.message);
        res.status(500).json({message:"Server Error"});
    }
});

// API call for add new address only after registrations only
app.post('/api/add-address', async(req, res)=>{
    const {addresstype, addressline1, addressline2, country, state, city, phonenumber} = req.body;
    
    if(!addresstype) return res.status(422).json({message: "address type is missing"})
    if(!addressline1) return res.status(422).json({message: "adress line 1 is missing"})
    if(!country) return res.status(422).json({message: "country is missing"})
    if(!city) return res.status(422).json({message: "city is missing"})
    if(!phonenumber) return res.status(422).json({message: "phone number is missing"})

    const token = req.cookies.userCookie;
    let varifyToken = jwt.verify(token, process.env.JWT_SECRET);
    const userid = varifyToken.userId;
    
    try {
        const DB_res = await addUserAddress(userid, addresstype, addressline1, addressline2, country, state, city, phonenumber);
        if(DB_res.status == 201){
            res.status(200).json({message:"address added successful"});
        }
        else{
            res.status(DB_res.status).json({message:DB_res.message});
        }
    } catch (error) {
        console.log("Error while adding address", error.message);
        res.status(500).json({message:"Server Error"});
    }    
})

// Products related API calls
app.get("/api/categories", async(req, res)=>{
    try {
        const db_resp = await getAllCategories();
        if(db_resp.status == 200) return res.status(db_resp.status).json({message: db_resp.message, data: db_resp.data});
        
        res.status(db_resp.status).json({message: db_resp.message});
    } catch (error) {
        console.log("error in server for getting all categories ", error);
        res.status(500).json({message:"Internal Server Error"});
    }
});

app.get("/api/category/:id", async(req,res)=>{
    try {
        const id = parseInt(req.params.id);

        if(isNaN(id)){
            return res.status(400).json({message:"Invalid category Id"});
        }

        const DB_res = await getCategoryById(id);

        if(DB_res.status == 200) return res.status(DB_res.status).json({message: DB_res.message, data: DB_res.data});
        res.status(DB_res.status).json({message: DB_res.message});

    } catch (error) {
        console.log("Error in server for getting category by id");
        res.status(500).json({message:"Internal server error"});
    }
})

app.get("/api/all-subcategory/:id", async(req,res)=>{
    try {
        const id = req.params.id;
        const DB_res = await getAllSubCategories(id);

        if(DB_res.status == 200) return res.status(DB_res.status).json({message: DB_res.message, data: DB_res.data});
        res.status(DB_res.status).json({message: DB_res.message});

    } catch (error) {
        console.log("Error in server for getting all sub category by category id");
        res.status(500).json({message:"Internal server error"});
    }
});

app.get("/api/subcategory/:id", async(req,res)=>{
    try {
        const id = req.params.id;
        const DB_res = await getSubCategoriById(id);

        if(DB_res.status == 200) return res.status(DB_res.status).json({message: DB_res.message, data: DB_res.data});
        res.status(DB_res.status).json({message: DB_res.message});
        
    } catch (error) {
        console.log("Error in server for getting sub category by id");
        res.status(500).json({message:"Internal server error"});
    }
});

app.get("/api/sub-category/:id/products", async(req,res)=>{
    try {
        const id = req.params.id;
        const DB_res = await getProductsBySubCategory(id);

        if(DB_res.status == 200) return res.status(DB_res.status).json({message: DB_res.message, data: DB_res.data});
        res.status(DB_res.status).json({message: DB_res.message});

    } catch (error) {
        console.log("Error in server for getting products by sub category id");
        res.status(500).json({message:"Internal server error"});
    }
});

// ✅ IMPORTANT: Listen on server, not app
server.listen(PORT, () => {
    console.log(`Server started at ${PORT}`);
});