import express from 'express';

import controller from '../controllers/Auth';
import { Schemas, ValidateJoi } from '../middleware/Joi';

// Rutas de autenticacion. Son publicas: no piden token.
// register y login validan el body con Joi; refresh y logout no necesitan body.
const router = express.Router();
router.post('/register', ValidateJoi(Schemas.auth.register), controller.register);
router.post('/login', ValidateJoi(Schemas.auth.login), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
export = router;

// Documentacion de Swagger de las rutas de autenticacion.
// security: [] quita el candado: estas rutas no necesitan access token.

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registra un usuario nuevo
 *     description: El usuario se crea siempre con el rol user. No devuelve token, hay que hacer login despues.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RegisterInput' }
 *     responses:
 *       201:
 *         description: Usuario creado
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { user: { $ref: '#/components/schemas/User' } } }
 *       409: { $ref: '#/components/responses/Conflict' }
 *       422: { $ref: '#/components/responses/Unprocessable' }
 *
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Inicia sesion
 *     description: Retorna l'access token i l'usuari al JSON. El refresh token va en una cookie HttpOnly.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginInput' }
 *     responses:
 *       200: { $ref: '#/components/responses/LoginOk' }
 *       401: { $ref: '#/components/responses/BadCredentials' }
 *       422: { $ref: '#/components/responses/Unprocessable' }
 *
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Demana un access token nou
 *     description: Llegeix el refresh token de la cookie HttpOnly. Retorna { token }.
 *     security: []
 *     responses:
 *       200:
 *         description: Access token nou
 *         content:
 *           application/json:
 *             example: { token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Tanca la sessió
 *     description: Esborra la cookie del refresh token. Retorna 200.
 *     security: []
 *     responses:
 *       200:
 *         description: Sessió tancada
 *         content:
 *           application/json:
 *             example: { message: Sessió tancada }
 */
