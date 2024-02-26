# <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Node.js_logo.svg/1920px-Node.js_logo.svg.png" alt="Node.js" height="23"/>&#8239;Battleship
Thanks for your attention to this project -  
adding backend to Battleship game.  
Made with Node.js 20.9.0 LTS.  
<img src="https://rolling-scopes-school.github.io/front42-JSFE2021Q1/presentation/z/front42.jpg" alt="logo" height="23"/>  
Clone this repository - for example with SSH: **git clone** git@github.com:front42/node.js-websocket-battleship.git  
Go to project directory, switch **git checkout develop** and install dependencies - **npm i**  
Use these commands to enjoy, for example:
- npm run **start:dev** - runs project in development mode
- npm run **start** - runs project in production mode building dist folder
- npm run **build** - builds project in dist folder

Then you'll see report in the terminal: *Start static http server on http://localhost:8181/*  
Push Ctrl and click to address - the game will open in browser, connecting via WebSocket -  
all important reports will also be visible in the terminal, for example messages of failed validation  
when player with such name already exists or when player tries to create many rooms for himself, etc.  
**PS:** Due to lack of time, the game was implemented partially - and as bloodlessly as possible:  
after the first hit, the winner is immediately declared and peace comes.  

### Task assignments: https://github.com/AlreadyBored/nodejs-assignments/blob/main/assignments/battleship/assignment.md
### Task base repository: https://github.com/rolling-scopes-school/websockets-ui
# RSSchool NodeJS websocket task template
> Static http server and base task packages. 
> By default WebSocket client tries to connect to the 3000 port.

## Installation
1. Clone/download repo
2. `npm install`

## Usage
**Development**

`npm run start:dev`

* App served @ `http://localhost:8181` with nodemon

**Production**

`npm run start`

* App served @ `http://localhost:8181` without nodemon

---

**All commands**

Command | Description
--- | ---
`npm run start:dev` | App served @ `http://localhost:8181` with nodemon
`npm run start` | App served @ `http://localhost:8181` without nodemon

**Note**: replace `npm` with `yarn` in `package.json` if you use yarn.
