const { prisma } = require("../lib/prisma");

// Get all conversations for the logged-in user (Patient or Doctor)
const getConversations = async (req, res) => {
    try {
        const userId = Number(req.user.id);
        const role = req.user.role;

        const whereClause = role === "DOCTOR" ? { doctorId: userId } : { patientId: userId };

        const conversations = await prisma.conversation.findMany({
            where: whereClause,
            include: {
                patient: { select: { id: true, firstName: true, lastName: true, email: true } },
                doctor: { select: { id: true, firstName: true, lastName: true, email: true } },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1, // Get last message for preview
                },
            },
            orderBy: { updatedAt: "desc" },
        });

        return res.status(200).json({
            success: true,
            message: "Conversations retrieved successfully.",
            data: conversations,
        });
    } catch (error) {
        console.error("Get Conversations Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// Get messages for a specific conversation
const getMessages = async (req, res) => {
    try {
        const conversationId = Number(req.params.conversationId);
        const userId = Number(req.user.id);

        // Verify user is part of the conversation
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversation || (conversation.patientId !== userId && conversation.doctorId !== userId)) {
            return res.status(403).json({ success: false, message: "Unauthorized access to conversation." });
        }

        const messages = await prisma.message.findMany({
            where: { conversationId },
            include: {
                sender: { select: { id: true, firstName: true, lastName: true } },
                attachments: true,
            },
            orderBy: { createdAt: "asc" },
        });

        return res.status(200).json({
            success: true,
            message: "Messages retrieved successfully.",
            data: messages,
        });
    } catch (error) {
        console.error("Get Messages Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

// Send a new message
const sendMessage = async (req, res) => {
    try {
        const conversationId = Number(req.params.conversationId);
        const senderId = Number(req.user.id);
        const { content, type = "TEXT" } = req.body;

        if (!content && type === "TEXT") {
            return res.status(400).json({ success: false, message: "Message content cannot be empty." });
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
        });

        if (!conversation || (conversation.patientId !== senderId && conversation.doctorId !== senderId)) {
            return res.status(403).json({ success: false, message: "Unauthorized." });
        }

        const message = await prisma.$transaction(async (tx) => {
            const newMessage = await tx.message.create({
                data: {
                    conversationId,
                    senderId,
                    content,
                    type,
                },
                include: {
                    sender: { select: { id: true, firstName: true, lastName: true } },
                },
            });

            // Update conversation timestamp
            await tx.conversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() },
            });

            return newMessage;
        });

        return res.status(201).json({
            success: true,
            message: "Message sent successfully.",
            data: message,
        });
    } catch (error) {
        console.error("Send Message Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = {
    getConversations,
    getMessages,
    sendMessage,
};