const express=require("express");
const cors=require("cors");
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const studentRoutes = require("./routes/studentRoutes");
const issueRoutes = require("./routes/issueRoutes");
const holidayRoutes = require("./routes/holidayRoutes");
const reservationRoutes=require("./routes/reservationRoutes");
const studentAuthRoutes = require("./routes/studentAuthRoutes");
const adminRoutes = require("./routes/adminRoutes");
const messageRoutes = require("./routes/messageRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
require("./utils/reservationCron");
require("./utils/reminderCron");
const app=express();



app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/student-auth", studentAuthRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/settings", settingsRoutes);


module.exports=app;