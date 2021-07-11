# Mentorsoft-engage21

![language](https://img.shields.io/github/languages/top/roatt-tilma/Mentorsoft-engage21?style=for-the-badge)

This project is being developed for Microsoft Engage 2021 mentorship program. This is a clone of Microsoft Teams.

It is currently hosted on heroku.

url: <a href = "https://mentorsoft.herokuapp.com" target = "_blank">https://mentorsoft.herokuapp.com</a>

note: WebRTC forces you to use secured network. Make sure its running on https.

Tech Stack:
  - node.js
  - Javascript
      - WebRTC using regular javascript APIs
      - socket.io library
  - EJS/CSS
  - Azure Communication Services for TURN relay


Features:
  - host and join rooms
  - chat during the lifetime of a room
      - chat notification for new message
  - start meeting to video chat
      - share screen (with audio optional)
      - mute/unmute your video and audio
      - UI to show if other user is muted or if video is off
      - hang up
  - End room

Restrictions:
  - It is retricted to only two users in a room
  - meeting can only be started once
  - leaving the room will end the room for both
  - not responsive


