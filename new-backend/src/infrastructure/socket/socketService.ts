import { Server } from 'socket.io';
import http from 'http';

let io: Server;
export const onlineUsers = new Map<number, string>(); // userId -> socketId

export const initSocket = (server: http.Server) => {
    io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
    });

    io.on('connection', (socket) => {
        socket.on('register', (userId: any) => {
            const uid = Number(userId);
            if (!isNaN(uid)) {
                onlineUsers.set(uid, socket.id);
                socket.join(`user_${uid}`); // Cho phép user sử dụng nhiều tab / nhiều component
                console.log(`[Socket] User ${uid} registered with socket ${socket.id}`);
            } else {
                console.warn(`[Socket] Invalid registration attempt with userId:`, userId);
            }
            io.emit('onlineUsers', Array.from(onlineUsers.keys()));
        });

        socket.on('disconnect', () => {
            for (const [userId, sid] of onlineUsers.entries()) {
                if (sid === socket.id) {
                    onlineUsers.delete(userId);
                    break;
                }
            }
            io.emit('onlineUsers', Array.from(onlineUsers.keys()));
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) throw new Error('Socket.io not initialized!');
    return io;
};
