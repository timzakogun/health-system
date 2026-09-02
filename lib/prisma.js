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

const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('../generated/prisma');
const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5,
    ssl: {
        rejectUnauthorized: false // Adjust depending on whether you upload Aiven's CA certificate
    }
});

const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

module.exports = { prisma };