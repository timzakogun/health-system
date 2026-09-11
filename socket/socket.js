const { Server } = require("socket.io");
const { prisma } = require("../lib/prisma");

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // Adjust this to match your frontend origin in production
      methods: ["GET", "POST"]
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Client joins a specific conversation room
    socket.on("join_conversation", (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`Socket ${socket.id} joined room: conversation_${conversationId}`);
    });

    // Handle real-time message sending
    socket.on("send_message", async (data) => {
      try {
        const { conversationId, senderId, content, type = "TEXT" } = data;

        if (!conversationId || !senderId || (!content && type === "TEXT")) {
          return;
        }

        // Save message to database using Prisma transaction
        const message = await prisma.$transaction(async (tx) => {
          const newMessage = await tx.message.create({
            data: {
              conversationId: Number(conversationId),
              senderId: Number(senderId),
              content,
              type,
            },
            include: {
              sender: { select: { id: true, firstName: true, lastName: true } },
              attachments: true,
            },
          });

          await tx.conversation.update({
            where: { id: Number(conversationId) },
            data: { updatedAt: new Date() },
          });

          return newMessage;
        });

        // Broadcast message to everyone in the conversation room (including sender)
        io.to(`conversation_${conversationId}`).emit("receive_message", message);
      } catch (error) {
        console.error("Socket Send Message Error:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initSocket, getIo };