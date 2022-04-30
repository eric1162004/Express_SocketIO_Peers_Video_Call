const express = require("express");
const app = express();

// need to create "server" based on express to work with socket.io
// for this project, this server is responsible with connecting users to a room
const server = require("http").Server(app);

// pass the express 'server' information socket.io
const io = require("socket.io")(server);

const { v4: uuidV4 } = require("uuid");

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  // if no room id is provided, generate one with UUIDV4.
  // then redirect the user to a room
  res.redirect(`/${uuidV4()}`);
});

// this route register a room id for an user
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// this is run everything when someone is connected to the webpage
io.on("connection", (socket) => {
  // this event is emitted when the client has set up a room
  socket.on("join-room", (roomId, userId) => {
    console.log(`roomID: ${roomId}`, `userID: ${userId}`);
    // join the current socket into this room
    // every time something happens in this room,
    // msgs will be sent to this socket
    socket.join(roomId);

    // send a user-connected msg to everyone in the room
    // except to the sender
    socket.to(roomId).emit("user-connected", userId);

    // whenever the user has close the tab
    socket.on("disconnect", () => {
      console.log(`userID ${userId} disconnected.`);
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

server.listen(process.env.PORT || 3000, () =>
  console.log("Server is running...")
);
