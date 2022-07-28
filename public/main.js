let divSelectRoom=document.getElementById("selectRoom")
let divConsulting =document.getElementById("consultingRoom")
let inputroomno=document.getElementById("roomNumber")
let btngoroom =document.getElementById("goRoom")
let localvideo=document.getElementById("localvideo")
let remoatevideo =document.getElementById("remoteVideo")

let roomNumber, localStream, remoteStream, rtcpeerConnection, isCaller

const iceServers ={
    'iceServer':[
        {'urls':'stun:stun.services.mozilla.com'},
        {'urls': 'turn:turn.l.google.com:19302'}
    ]
}

const streamConstraints={
    Audio:true,
    video:true
}

const socket=io();

btngoroom.onclick=()=>{
    if(inputroomno.value==''){
        alert('Please Type a room no')
    }
    else{
       roomNumber=inputroomno.value
       socket.emit('create or join',roomNumber)
       divSelectRoom.style="display:none"
       divConsulting.style="display:block"
    }
}

socket.on('created',room=>{
    navigator.mediaDevices.getUserMedia(streamConstraints)
    .then(strem=>{
        localStream=strem
        localvideo.srcObject=strem
        isCaller=true
    })
    .catch(err=>{
        console.log('Ann Error created')
    })
})

socket.on('joined',room=>{
    navigator.mediaDevices.getUserMedia(streamConstraints)
    .then(strem=>{
        localStream=strem
        localvideo.srcObject=strem
        socket.emit('ready',roomNumber)
    })
    .catch(err=>{
        console.log('Ann Error joined'+err)
    })
})


socket.on('ready',()=>{
    console.log(localStream.getTracks())
    if(isCaller){
        rtcpeerConnection=new RTCPeerConnection(iceServers)
        rtcpeerConnection.onicecandidate=onicecandidate
        rtcpeerConnection.ontrack=onAddStream
        rtcpeerConnection.addTrack(localStream.getTracks()[0],localStream)
        rtcpeerConnection.addTrack(localStream.getTracks()[1],localStream)
        rtcpeerConnection.createOffer()
        .then(sessiondescription=>{
            rtcpeerConnection.setLocalDescription(sessiondescription)
            socket.emit('offer',{
                Type:'offer',
                sdp:sessiondescription,
                room:roomNumber
            })
        })
        .catch(err=>{
            console.log('Ann Error ready')
        })
    }
})

socket.on('offer',(event)=>{
    if(!isCaller){
        rtcpeerConnection=new RTCPeerConnection(iceServers)
        rtcpeerConnection.onicecandidate=onicecandidate
        rtcpeerConnection.ontrack=onAddStream
        rtcpeerConnection.addTrack(localStream.getTracks()[0],localStream)
        rtcpeerConnection.addTrack(localStream.getTracks()[1],localStream)
        rtcpeerConnection.setRemoteDescription(new RTCSessionDescription(event))
        rtcpeerConnection.createAnswer()
        .then(sessiondescription=>{
            rtcpeerConnection.setLocalDescription(sessiondescription)
            socket.emit('answer',{
                Type:'answer',
                sdp:sessiondescription,
                room:roomNumber
            })
        })
        .catch(err=>{
            console.log('Ann Error offer')
        })
    }
})

socket.on('answer',(event)=>{
    rtcpeerConnection.setRemoteDescription(new RTCSessionDescription(event))
})

socket.on('candidate',event=>{
    const candidate=new RTCIceCandidate({
        sdpMLineIndex:event.label,
        candidate:event.candidate
    })
    rtcpeerConnection.addIceCandidate(candidate)
})

function onAddStream(event){
    remoatevideo.secObject=event.strems[0]
    remoteStream=event.strems[0]
}

function onicecandidate(event){
    if(event.candidate){
        console.log('sending candidate',event.candidate)
        socket.emit('candidate',{
            Type:'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate,
            room: roomNumber
        })
    }
}