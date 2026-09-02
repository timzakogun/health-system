// require('dotenv').config();


// const {PrismaMariaDb} = require('@prisma/adapter-mariadb');
// const { PrismaClient } = require('../generated/prisma/client'); 

// const adapter = new PrismaMariaDb({
//     host: process.env.DB_HOST,
//     port: Number(process.env.DB_PORT),
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
// })

// const prisma = new PrismaClient({
//     adapter,
// });

// module.exports = { prisma };

require('dotenv').config();

const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const { PrismaClient } = require("../generated/prisma/client");

const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        rejectUnauthorized: false,
    },

    connectionLimit: 5,
});

const prisma = new PrismaClient({
    adapter,
});

module.exports = { prisma };