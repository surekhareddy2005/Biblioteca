const express=require("express");
const cors=require("cors");
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const studentRoutes = require("./routes/studentRoutes");

const app=express();



app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/students", studentRoutes);


module.exports=app;