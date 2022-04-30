const socket = io("/");

// connect to our own peer server
// let the server takes care of generating own id, hence undefined
// const myPeer = new Peer(undefined, {
//   host: "/",
//   port: "3001",
// });

// connect to the Peer server on the cloud
var myPeer = new Peer();

// keep track of whom we are connect to
// { userId: call }
const peers = {};

// set up video elements
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
// we dont want to hear ourself
myVideo.muted = true;

// set up my Video
// set audio to true so other people can hear you
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    // when someone try to call us
    // answer their call with our own stream
    myPeer.on("call", (call) => {
      call.answer(stream);

      const video = document.createElement("video");

      // we should get back a stream back from the other side
      // add their video on our screen
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    // if a new user has join the room,
    // the express server will emit a user-connected event
    // and return the id of the new user
    socket.on("user-connected", (userId) => {
      console.log(`userId: ${userId} connected`);
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  // tell us who has left
  console.log(`User:${userId} has left the room`);

  // close the peer connection, if this userId exists
  if (peers[userId]) {
    peers[userId].close();
    peers[userId].destroy();
  }
});

// take in the id of the user whom you want to connect to
// and send over your own video stream
function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);

  const newUserVideo = document.createElement("video");

  // when the new user send us back his stream
  call.on("stream", (userVideoStream) => {
    addVideoStream(newUserVideo, userVideoStream);
  });

  // when the new user socket is close
  // remove his video in our side
  call.on("close", () => {
    console.log(`closing video`);
    newUserVideo.remove();
  });

  // keep track of this new user call
  peers[userId] = call;
}

// once the client has connected to the peer server
// an client id return
myPeer.on("open", (id) => {
  // ROOM_ID is a global variable set in the html page
  // once the client has a roomID or set up a new roomID,
  // the client will inform everyone in the room
  socket.emit("join-room", ROOM_ID, id);
});

function addVideoStream(video, stream) {
  video.srcObject = stream;

  // once the stream is loaded, play the video
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });

  videoGrid.append(video);
}
