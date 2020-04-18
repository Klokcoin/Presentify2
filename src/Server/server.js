var server = require('http').createServer(server);
var io = require('socket.io')(server);

const port = 3011

io.on('connection', socket => {
    console.log('iemand is verbonden')

    socket.on('room', data => {
        console.log(`-${data.name}- joined room: -${data.room}-`)
        socket.join(data.room)
        socket.emit( 'message', {message: 'you succesfully joined room: ' + data.room, room: data.room})
        

    })

    socket.on('change', data => {
        console.log(`state change in room: -${data.room}- sheet change: ${data.sheet}`);
        console.log(data.sheet)
        socket.to(data.room).emit('change', {sheet: data.sheet})
      })
})

server.listen(port)