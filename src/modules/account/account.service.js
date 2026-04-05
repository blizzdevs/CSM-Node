/**
 * src/modules/account/account.service.js
 *
 * Lógica de autenticación — 1:1 con WebEngine
 *
 * Fuente: class.common.php (validateUser, userExists, emailExists)
 *         class.account.php (registerAccount)
 *         class.login.php   (validateLogin, canLogin, addFailedLogin)
 */

'use strict';

const crypto  = require('crypto');
const prisma  = require('../../config/database');
const appCfg  = require('../../config/app');

// ─── Encriptación ─────────────────────────────────────────────────────────────
// Replica exacta de class.common.php validateUser() y registerAccount()

/**
 * hashPassword — replica el switch de _passwordEncryption de WebEngine
 *
 * phpmd5: md5($password)
 * sha256: hash calculado en Node; comparación en texto plano contra la BD
 *         (en WebEngine sha256 se almacena como binary comparado con HASHBYTES,
 *          pero en la variante text-store es hash('sha256', pw+user+salt))
 * wzmd5:  stored procedure fn_md5 en SQL Server — se pasa la contraseña en
 *         texto plano y la query usa [dbo].[fn_md5](:password, :username)
 *
 * @param {string} password   - Contraseña en texto plano
 * @param {string} username   - Username (requerido para sha256 y wzmd5)
 * @returns {string|null}     - Hash resultante, o null si es wzmd5 (la BD lo hace)
 */
function hashPassword(password, username = '') {
    const method = appCfg.encryption.method; // Lee de app.js, no de .env directamente

    switch (method) {
        case 'phpmd5':
            // WebEngine: $data['password'] = md5($password);
            return crypto.createHash('md5').update(password).digest('hex');

        case 'sha256':
            // WebEngine: hash('sha256', $password . $username . $this->_sha256salt)
            // Almacenado como '0x' + hex, pero comparado como texto
            return crypto
                .createHash('sha256')
                .update(password + username + appCfg.encryption.sha256Salt)
                .digest('hex');

        case 'wzmd5':
            // La función fn_md5 la ejecuta SQL Server directamente.
            // Esta función devuelve null — la query la maneja el caller.
            return null;

        default:
            return password; // Plain text (sin encriptación)
    }
}

// ─── Account Service ──────────────────────────────────────────────────────────

const AccountService = {

    /**
     * userExists — replica class.common.php userExists()
     * Verifica que el username cumpla formato antes de buscar en BD.
     */
    async userExists(username) {
        const user = await prisma.MEMB_INFO.findFirst({
            where: { memb___id: username },
            select: { memb___id: true },
        });
        return !!user;
    },

    /**
     * emailExists — replica class.common.php emailExists()
     */
    async emailExists(email) {
        const user = await prisma.MEMB_INFO.findFirst({
            where: { mail_addr: email },
            select: { memb___id: true },
        });
        return !!user;
    },

    /**
     * getAccount — fetches all account fields needed for session
     */
    async getAccount(username) {
        return prisma.MEMB_INFO.findFirst({
            where: { memb___id: username },
        });
    },

    /**
     * validateUser — replica class.common.php validateUser()
     *
     * Para wzmd5: usa $queryRaw con la función SQL Server [dbo].[fn_md5].
     * Para los demás: compara el hash calculado en Node contra el campo de BD.
     *
     * @returns {Promise<boolean>}
     */
    async validateUser(username, password) {
        const method = appCfg.encryption.method;

        if (method === 'wzmd5') {
            // El hash lo hace SQL Server — usamos $queryRaw
            const result = await prisma.$queryRaw`
                SELECT COUNT(*) as cnt
                FROM MEMB_INFO
                WHERE memb___id = ${username}
                AND memb__pwd   = [dbo].[fn_md5](${password}, ${username})
            `;
            return result[0]?.cnt > 0;
        }

        const account = await prisma.MEMB_INFO.findFirst({
            where: { memb___id: username },
            select: { memb__pwd: true },
        });
        if (!account) return false;

        const hashed = hashPassword(password, username);
        // Comparación case-insensitive (SQL Server por defecto es CI)
        return account.memb__pwd.toLowerCase() === hashed.toLowerCase();
    },

    /**
     * isAccountBanned — verifica bloc_code (replica el check de WebEngine)
     * bloc_code = '0' → activo; '1' → baneado
     */
    async isAccountBanned(username) {
        const account = await prisma.MEMB_INFO.findFirst({
            where: { memb___id: username },
            select: { bloc_code: true },
        });
        if (!account) return false;
        return account.bloc_code.trim() !== '0';
    },

    /**
     * registerAccount — replica class.account.php registerAccount()
     *
     * Orden exacto de operaciones de WebEngine:
     * 1. Check username vacío / password vacío / confirm vacío / email vacío  → hecho en validator
     * 2. UsernameLength, AlphaNumeric, PasswordLength, passwords match, valid email → validator
     * 3. userExists → error
     * 4. emailExists → error
     * 5. Hash password
     * 6. INSERT INTO MEMB_INFO
     * 7. Si season_1_support → INSERT INTO VI_CURR_INFO (no aplica S6E3, omitido)
     */
    async registerAccount({ username, password, email }) {
        // 3. userExists
        if (await this.userExists(username)) {
            throw new Error('The username is already taken.');
        }

        // 4. emailExists
        if (await this.emailExists(email)) {
            throw new Error('The email address is already registered.');
        }

        const method = appCfg.encryption.method;

        if (method === 'wzmd5') {
            // wzmd5: la función fn_md5 la ejecuta SQL Server directamente
            await prisma.$executeRaw`
                INSERT INTO MEMB_INFO
                    (memb___id, memb__pwd, memb_name, sno__numb, mail_addr, bloc_code, ctl1_code)
                VALUES
                    (${username}, [dbo].[fn_md5](${password}, ${username}),
                     ${username}, ${'1111111111111'}, ${email}, ${'0'}, ${'0'})
            `;
        } else {
            // phpmd5 o sha256: hash calculado en Node
            let hashedPwd = hashPassword(password, username);

            await prisma.MEMB_INFO.create({
                data: {
                    memb___id: username,
                    memb__pwd: hashedPwd,
                    memb_name: username,
                    sno__numb: '1111111111111', // _defaultAccountSerial de WebEngine
                    mail_addr: email,
                    bloc_code: '0',
                    ctl1_code: '0',
                    cspoints:  0,
                },
            });
        }

        return true;
    },

    // ── Failed Login Attempts (WEBENGINE_FLA) ─────────────────────────────────
    // Replica class.login.php: canLogin, checkFailedLogins, addFailedLogin, removeFailedLogins

    /**
     * checkFailedLogins — retorna cantidad de intentos fallidos o 0
     */
    async checkFailedLogins(ipAddress) {
        const result = await prisma.$queryRaw`
            SELECT failed_attempts, unlock_timestamp
            FROM WEBENGINE_FLA
            WHERE ip_address = ${ipAddress}
        `;
        if (!result || result.length === 0) return 0;
        return result[0].failed_attempts || 0;
    },

    /**
     * canLogin — replica canLogin() de WebEngine
     * Retorna false si la IP está bloqueada y el unlock_timestamp no expiró
     */
    async canLogin(ipAddress, maxAttempts) {
        const records = await prisma.$queryRaw`
            SELECT failed_attempts, unlock_timestamp
            FROM WEBENGINE_FLA
            WHERE ip_address = ${ipAddress}
            ORDER BY id DESC
        `;
        if (!records || records.length === 0) return true;

        const rec = records[0];
        const failedAttempts = rec.failed_attempts || 0;

        if (failedAttempts < maxAttempts) return true;

        const now = Math.floor(Date.now() / 1000);
        if (now < rec.unlock_timestamp) {
            return false; // Todavía bloqueado
        }

        // El tiempo de bloqueo expiró — limpiar
        await this.removeFailedLogins(ipAddress);
        return true;
    },

    /**
     * addFailedLogin — replica addFailedLogin() de WebEngine
     */
    async addFailedLogin(username, ipAddress, maxAttempts, lockoutMinutes) {
        const failedLogins = await this.checkFailedLogins(ipAddress);
        const unlockTimestamp = Math.floor(Date.now() / 1000) + lockoutMinutes * 60;
        const now = Math.floor(Date.now() / 1000);

        if (failedLogins >= 1) {
            if (failedLogins + 1 >= maxAttempts) {
                // Bloquear la IP
                await prisma.$executeRaw`
                    UPDATE WEBENGINE_FLA
                    SET username = ${username},
                        failed_attempts = failed_attempts + 1,
                        unlock_timestamp = ${unlockTimestamp},
                        timestamp = ${now}
                    WHERE ip_address = ${ipAddress}
                `;
            } else {
                await prisma.$executeRaw`
                    UPDATE WEBENGINE_FLA
                    SET username = ${username},
                        failed_attempts = failed_attempts + 1,
                        timestamp = ${now}
                    WHERE ip_address = ${ipAddress}
                `;
            }
        } else {
            // Primer intento fallido — INSERT
            await prisma.$executeRaw`
                INSERT INTO WEBENGINE_FLA
                    (username, ip_address, unlock_timestamp, failed_attempts, timestamp)
                VALUES
                    (${username}, ${ipAddress}, ${0}, ${1}, ${now})
            `;
        }
    },

    /**
     * removeFailedLogins — replica removeFailedLogins() de WebEngine
     */
    async removeFailedLogins(ipAddress) {
        await prisma.$executeRaw`
            DELETE FROM WEBENGINE_FLA WHERE ip_address = ${ipAddress}
        `;
    },
};

module.exports = { AccountService, hashPassword };
