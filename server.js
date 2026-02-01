const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server);

io.on("connection", socket => {
  console.log("User connected:", socket.id);

  socket.on("join_room", roomId => {
    socket.join(roomId);
    console.log("Joined room:", roomId);
  });

  socket.on("play_song", data => {
    io.to(data.roomId).emit("sync_play", data);
  });

  socket.on("pause_song", data => {
    io.to(data.roomId).emit("sync_pause");
  });

  socket.on("seek", data => {
    io.to(data.roomId).emit("sync_seek", data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running"));



const axios = require("axios");
const YT_API_KEY = "AIzaSyBrK_NoHq8_0P9BG_8llDn9CaRG1Vd4Nmk";

app.get("/search", async (req, res) => {
  const q = req.query.q;

  const yt = await axios.get("https://www.googleapis.com/youtube/v3/search", {
    params: {
      part: "snippet",
      q,
      type: "video",
      maxResults: 10,
      key: YT_API_KEY
    }
  });

  const songs = yt.data.items.map(v => ({
    videoId: v.id.videoId,
    title: v.snippet.title,
    thumbnail: v.snippet.thumbnails.medium.url
  }));

  res.json(songs);
});
