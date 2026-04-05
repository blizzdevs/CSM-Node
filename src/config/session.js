/**
 * src/config/session.js
 *
 * Configuración de Sesión — NodeEngine CMS
 *
 * connect-mssql-v2 v6 exporta la clase Store directamente.
 * No es una factory — se instancia con `new MSSQLStore(config, options)`.
 * La clase extiende express-session.Store internamente.
 */

'use strict';

const MSSQLStore = require('connect-mssql-v2');

// Configuración de conexión SQL Server para el Store de sesiones
// (variables individuales — connect-mssql-v2 no acepta connection strings de Prisma)
const sqlConfig = {
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    server:   process.env.DB_HOST   || 'localhost',
    port:     parseInt(process.env.DB_PORT || '1433', 10),
    database: process.env.DB_NAME   || 'Me_MuOnline',
    options: {
        encrypt:                false, // true solo si usás Azure SQL
        trustServerCertificate: true,
        enableArithAbort:       true,
    },
};

const store = new MSSQLStore(sqlConfig, {
    table:              'WEBENGINE_SESSIONS', // Se crea automáticamente si no existe
    ttl:                60 * 60 * 1000,       // 1 hora en ms
    autoRemove:         true,                 // Limpia sesiones expiradas automáticamente
    autoRemoveInterval: 10 * 60 * 1000,       // Limpieza cada 10 minutos
    useUTC:             true,
});

const sessionConfig = {
    store,
    secret:            process.env.SESSION_SECRET,
    resave:            false,
    saveUninitialized: false,
    name:              'nodeengine.sid',

    cookie: {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge:   60 * 60 * 1000, // 1 hora
    },
};

module.exports = sessionConfig;
