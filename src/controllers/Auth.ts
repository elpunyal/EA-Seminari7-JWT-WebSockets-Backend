import { NextFunction, Request, Response } from 'express';
import AuthService from '../services/AuthService';
import { config } from '../config/config';

// Nom de la cookie que conté el refresh token
const REFRESH_COOKIE = 'refreshToken';

// Opcions de la cookie del refresh token.
// HttpOnly: JavaScript no pot llegir-la (protecció XSS).
// SameSite: Strict: el navegador només l'envia a peticions del mateix lloc (protecció CSRF bàsica).
// path: /auth: la cookie només s'envia en peticions a /auth, no a la resta de l'API.
// maxAge: el mateix temps que el refresh token (7 dies per defecte, en mil·lisegons).
const cookieOptions = {
    httpOnly: true,
    sameSite: 'strict' as const,
    path: '/auth',
    // 7 dies en mil·lisegons. Hem de llegir el valor de config per ser coherents.
    // JWT_REFRESH_EXPIRES_IN pot ser '7d', '1d', etc.
    maxAge: parseDurationMs(config.jwt.refreshExpiresIn as string),
    // En producció la cookie també porta Secure: només es transmet per HTTPS
    secure: process.env.NODE_ENV === 'production'
};

// Converteix un string de durada com '7d' o '15m' a mil·lisegons
// per poder passar-ho a maxAge de la cookie.
function parseDurationMs(duration: string | number): number {
    if (typeof duration === 'number') return duration * 1000;
    const match = String(duration).match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // 7 dies per defecte
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return value * multipliers[unit];
}

// Función para registrar un usuario nuevo
// Según el contrato, el registro no devuelve token: el frontend lleva al usuario a la página de login
const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await AuthService.register(req.body);

        // 201 porque se ha creado un recurso nuevo
        res.status(201).json({ user });
    } catch (error) {
        // Si el email ya existe, el ErrorHandler responde 409
        next(error);
    }
};

// Inicia sessió.
// Retorna { token, user } al JSON i posa el refresh token en una cookie HttpOnly.
// Així el refresh token NO és accessible des de JavaScript (protecció XSS).
const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await AuthService.login(req.body.email, req.body.password);

        if (result) {
            // Posem el refresh token a la cookie; el JSON no el porta
            res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);

            // Retornem { token, user } — sense refreshToken al JSON
            res.status(200).json({ token: result.token, user: result.user });
        } else {
            // 401: no s'ha pogut identificar l'usuari
            res.status(401).json({ message: 'Email o contrasenya incorrectes' });
        }
    } catch (error) {
        next(error);
    }
};

// Demana un access token nou a partir del refresh token de la cookie.
// Si no hi ha cookie o no és vàlida, respon 401.
const refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Llegim el refresh token de la cookie, no del body
        const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

        if (!refreshToken) {
            // No hi ha cookie: la sessió ha caducat o mai s'havia iniciat
            return res.status(401).json({ message: 'No hi ha refresh token' });
        }

        const result = await AuthService.refresh(refreshToken);

        if (result) {
            // Retornem { token } — el nou access token
            res.status(200).json(result);
        } else {
            res.status(401).json({ message: "L'usuari ja no existeix" });
        }
    } catch (error) {
        // Si el refresh token ha caducat o és invàlid, l'ErrorHandler respon 401
        next(error);
    }
};

// Tanca la sessió: esborra la cookie del refresh token.
// Usem les mateixes opcions (path, sameSite) per assegurar que s'esborra correctament.
const logout = (req: Request, res: Response) => {
    res.clearCookie(REFRESH_COOKIE, { path: '/auth', sameSite: 'strict', httpOnly: true });
    res.status(200).json({ message: 'Sessió tancada' });
};

export default { register, login, refresh, logout };
