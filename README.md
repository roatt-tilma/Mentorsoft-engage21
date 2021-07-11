# Mentorsoft-engage21

![language](https://img.shields.io/badge/-Microsoft%20Engage%2021-bluevoilet)
![language](https://img.shields.io/github/languages/top/roatt-tilma/Mentorsoft-engage21?style=for-the-badge)
![language](https://img.shields.io/github/last-commit/roatt-tilma/Mentorsoft-engage21?style=for-the-badge)

This project is being developed for Microsoft Engage 2021 mentorship program. This is a clone of Microsoft Teams.

It is currently hosted on heroku.

url: <a href = "https://mentorsoft.herokuapp.com" target = "_blank">https://mentorsoft.herokuapp.com</a>

NOTE: WebRTC forces you to use secured network. Make sure its running on https.

## Tech Stack:
  - node.js
  - Javascript
      - WebRTC using regular javascript APIs
      - socket.io library
  - EJS/CSS
  - Azure Communication Services for TURN relay


## Features:
  - host and join rooms
  - chat during the lifetime of a room
      - chat notification for new message
  - start meeting to video chat
      - share screen (with audio optional)
      - mute/unmute your video and audio
      - UI to show if other user is muted or if video is off
      - hang up
  - End room

## Restrictions:
  - It is retricted to only two users in a room
  - meeting can only be started once
  - leaving the room will end the room for both
  - screen can only be shared when your video in on

NOTE: Use pc for best experience

## Local Setup
  1. Clone the repository

     ```
     git clone https://github.com/roatt-tilma/Mentorsoft-engage21.git
     
     ```

  2. Install all dependencies

     ```
     npm install
     
     ```
  
  3. Start the server
  
     ```
     node app.js
     
     ```


#### If you like it please give it a star!! ⭐



