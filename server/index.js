const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const router = require('./router');
const cors = require('cors');
const { addUser, getUser, removeUser, getUsersInRoom } = require('./users');


corsOptions={
    cors: true,
    origins:["http://localhost:3000"],
   }

const app = express();
const server = http.createServer(app);
const io = socketio(server,corsOptions)

app.use(cors());
app.use(router);



io.on('connection', (socket) => {
  

    socket.on('join', ({name, room}, callback) => {
        const {error, user} = addUser({ id: socket.id, name, room });
        console.log('------------')
        console.log(user)
        if(error){
            return callback(error);
        }
        socket.join(user.room);

        socket.emit('message', {user: 'admin', text: `${user.name}, welcome to the room ${user.room}`})
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name}, has joined!`})

        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)})
        
        callback()
        
    })

    socket.on('sendMessage', (message, callback) => {
       
        const user = getUser(socket.id)
        //  console.log(user)
        io.to(user.room).emit('message', {user : user.name, text: message })
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)})
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

    if(user) {
      io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
    }
    })
})


server.listen(process.env.PORT || 5000, () => console.log(`Server has started.`));