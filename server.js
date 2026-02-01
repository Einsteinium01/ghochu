const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

const server = http.createServer(app);

// 🔥 IMPORTANT for web sockets on Render
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

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

  // 🔁 NEW: Time sync event
  socket.on("time_update", data => {
    socket.to(data.roomId).emit("sync_time", data);
  });
});

// 🔎 YouTube Search API
const YT_API_KEY = process.env.YT_API_KEY; // safer than hardcoding

app.get("/search", async (req, res) => {
  try {
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
  } catch (err) {
    console.error("YouTube API error:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on", PORT));
