const express = require('express');
const http = require("http");
const { initSocket } = require("./socket/socket");

const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const adminRoutes = require('./routes/adminRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')
const doctorsRoutes = require('./routes/doctorsRoutes')
const specialtyRoutes = require('./routes/specialtyRoutes')
const credentialRoutes = require('./routes/credentialRoutes')
const profileRoutes = require('./routes/profileRoutes')
const chatRoutes = require("./routes/chatRoutes");


let app = express();
// const port = 4000;
const port = process.env.PORT || 4000;
const server = http.createServer(app)
initSocket(server);

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/admin", adminRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/doctors", doctorsRoutes);
app.use("/specialties", specialtyRoutes);
app.use("/credentials", credentialRoutes);
app.use(
    "/uploads",
    express.static("uploads")
);
app.use("/profile", profileRoutes);
app.use("/chats", chatRoutes);

app.listen(port, () => {
    console.log(`app is running on port: ${port}`);
});
