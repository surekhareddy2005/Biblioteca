const express=require("express");
const cors=require("cors");
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const studentRoutes = require("./routes/studentRoutes");
const issueRoutes = require("./routes/issueRoutes");
const holidayRoutes = require("./routes/holidayRoutes");
const reservationRoutes=require("./routes/reservationRoutes");
const studentAuthRoutes = require("./routes/studentAuthRoutes");
require("./utils/reservationCron");
const app=express();



app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/student-auth", studentAuthRoutes);


module.exports=app;