const express=require('express');
const app=express();
let http=require('http').Server(app)

const port=process.env.port || 3000

let io=require('socket.io')(http)

app.use(express.static('public'))

http.listen(port,()=>{
    console.log('listening on',port)
})



io.on('connection',socket=>{
    console.log('a user Connected')
    users = [];
    socket.on('create or join', room=>{

        console.log('create or join',room)

            if(users.length > 0) {
                socket.join(room)
                socket.emit('joined',room)
               } else{
                users.push(room);
                socket.join(room)
                socket.emit('created',room)
            }
        })

        socket.on('ready',room=>{
            socket.broadcast.to(room).emit('ready')
        })
        socket.on('candidate',event=>{
            socket.broadcast.to(event,room).emit('candidate',event)
        })
        socket.on('offer',event=>{
            socket.broadcast.to(event,room).emit('offer',event.sdp)
        })
        socket.on('answer',event=>{
            socket.broadcast.to(event,room).emit('answer',event.sdp)
        })
})
