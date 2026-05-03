"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = exports.onlineUsers = void 0;
const socket_io_1 = require("socket.io");
let io;
exports.onlineUsers = new Map(); // userId -> socketId
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
    });
    io.on('connection', (socket) => {
        socket.on('register', (userId) => {
            const uid = Number(userId);
            if (!isNaN(uid)) {
                exports.onlineUsers.set(uid, socket.id);
                socket.join(`user_${uid}`); // Cho phép user sử dụng nhiều tab / nhiều component
                console.log(`[Socket] User ${uid} registered with socket ${socket.id}`);
            }
            else {
                console.warn(`[Socket] Invalid registration attempt with userId:`, userId);
            }
            io.emit('onlineUsers', Array.from(exports.onlineUsers.keys()));
        });
        socket.on('disconnect', () => {
            for (const [userId, sid] of exports.onlineUsers.entries()) {
                if (sid === socket.id) {
                    exports.onlineUsers.delete(userId);
                    break;
                }
            }
            io.emit('onlineUsers', Array.from(exports.onlineUsers.keys()));
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io)
        throw new Error('Socket.io not initialized!');
    return io;
};
exports.getIO = getIO;
//# sourceMappingURL=socketService.js.map