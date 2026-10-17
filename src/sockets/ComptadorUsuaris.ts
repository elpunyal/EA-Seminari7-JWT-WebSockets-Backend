import http from 'http';
import { Server, type Socket } from 'socket.io';

import { config } from '../config/config';
import Logging from '../library/Logging';
import { VerifySocketToken } from '../middleware/SocketAuth';

// Configura el servidor de comptador d'usuaris connectats a socket.io.
// Comparteix el mateix servidor HTTP que Express i el chat.
export const StartComptadorUsuaris = (server: http.Server) => {
    const io = new Server(server, {
        cors: {
            origin: config.cors.origin,
            methods: ['GET', 'POST']
        }
    });

    // Fem servir un namespace propi (/comptador) per separar-lo del chat
    const nsp = io.of('/comptador');

    // Reutilitzem el mateix middleware JWT que el chat: el client ha d'enviar un token vàlid
    nsp.use(VerifySocketToken);

    nsp.on('connection', (socket: Socket) => {
        const userId = socket.data.user.id;
        Logging.info(`ComptadorUsuaris: usuari ${userId} connectat`);

        // Quan un usuari es connecta, comptem quants sockets hi ha al namespace i ho emetem a TOTHOM
        const count = nsp.sockets.size;
        Logging.info(`ComptadorUsuaris: ara hi ha ${count} usuari(s) connectat(s)`);
        // 'users:count' és l'event que escolta el frontend per actualitzar el comptador
        nsp.emit('users:count', count);

        socket.on('disconnect', () => {
            Logging.info(`ComptadorUsuaris: usuari ${userId} desconnectat`);

            // Quan un usuari es desconnecta, actualitzem el comptador per a la resta
            const updatedCount = nsp.sockets.size;
            Logging.info(`ComptadorUsuaris: ara hi ha ${updatedCount} usuari(s) connectat(s)`);
            nsp.emit('users:count', updatedCount);
        });
    });

    return io;
};
