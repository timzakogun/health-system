const { prisma } = require("../lib/prisma");

// Get Wallet Balance & Details
const getWallet = async (req, res) => {
    try {
        const userId = req.user.id;

        let wallet = await prisma.wallet.findUnique({
            where: { userId }
        });

        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: { userId, balance: 0.00, currency: "NGN" }
            });
        }

        return res.status(200).json({
            message: "Wallet retrieved successfully.",
            wallet
        });
    } catch (error) {
        console.error("Get Wallet Error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// Top up Wallet (Simulating successful payment webhook/verification)
const topUpWallet = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, reference } = req.body;

        if (!amount || !reference) {
            return res.status(400).json({ message: "Amount and reference are required." });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Create transaction log
            const transaction = await tx.transaction.create({
                data: {
                    userId,
                    type: "WALLET_TOPUP",
                    amount: Number(amount),
                    status: "SUCCESS",
                    reference
                }
            });

            // Update or create wallet balance
            const wallet = await tx.wallet.upsert({
                where: { userId },
                update: { balance: { increment: Number(amount) } },
                create: { userId, balance: Number(amount), currency: "NGN" }
            });

            return { transaction, wallet };
        });

        return res.status(200).json({
            message: "Wallet topped up successfully.",
            data: result
        });
    } catch (error) {
        console.error("Top Up Error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

// Get Saved Cards
const getSavedCards = async (req, res) => {
    try {
        const userId = req.user.id;
        const cards = await prisma.card.findMany({
            where: { userId }
        });

        return res.status(200).json({
            message: "Cards retrieved successfully.",
            cards
        });
    } catch (error) {
        console.error("Get Cards Error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = {
    getWallet,
    topUpWallet,
    getSavedCards
};