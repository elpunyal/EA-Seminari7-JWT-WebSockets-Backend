import cors from 'cors';
import { config } from '../config/config';

// Middleware de CORS: le dice al navegador desde qué origen se puede llamar a esta API.
// El origen se configura en el .env con CORS_ORIGIN; por defecto se acepta cualquiera.
// De las peticiones OPTIONS (las que manda el navegador antes de la real) se encarga
// el propio paquete cors.
// credentials: true és necessari perquè el navegador enviï i accepti la cookie HttpOnly.
export const Cors = cors({
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true
});
