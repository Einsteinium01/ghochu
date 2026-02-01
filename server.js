const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// 🔥 Store state of each room
const rooms = {};

io.on("connection", socket => {
  console.log("User connected:", socket.id);

  socket.on("join_room", roomId => {
    socket.join(roomId);
    console.log("Joined room:", roomId);

    if (rooms[roomId]) {
      socket.emit("room_state", rooms[roomId]);
    }
  });

  socket.on("play_song", data => {
    rooms[data.roomId] = {
      videoId: data.videoId,
      timestamp: data.timestamp,
      isPlaying: true
    };
    io.to(data.roomId).emit("sync_play", data);
  });

  socket.on("pause_control", data => {
    if (rooms[data.roomId]) rooms[data.roomId].isPlaying = false;
    io.to(data.roomId).emit("sync_pause_control");
  });

  socket.on("play_control", data => {
    if (rooms[data.roomId]) rooms[data.roomId].isPlaying = true;
    io.to(data.roomId).emit("sync_play_control");
  });

  socket.on("time_update", data => {
    if (rooms[data.roomId]) rooms[data.roomId].timestamp = data.timestamp;
    socket.to(data.roomId).emit("sync_time", data);
  });
});

// 🔎 YouTube search
const YT_API_KEY = process.env.YT_API_KEY;

app.get("/search", async (req, res) => {
  try {
    const yt = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        part: "snippet",
        q: req.query.q,
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
  } catch {
    res.status(500).json({ error: "Search failed" });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on", PORT));
