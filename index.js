const express = require('express');
//const cors = require('cors');
const app = express();
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const JSONdb = require('simple-json-db');

server.cors={
    origin:["http:localhost:2053"]
};


//===Initializing JSon DB
const db = new JSONdb('./db.json');

const { Server } = require("socket.io");
const { urlencoded } = require('express');
const io = new Server(server);
app.use("/public", express.static(path.resolve(__dirname + '/public')));

//app.use(cors({
//  origin: 'http://localhost:8080'
//}));

app.use(express.json());
app.use(urlencoded({extended:true}));

//====database connection


//====requesting endpoints

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/home.html');
});

app.get('/view', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/view/987123', (req, res) => {
  res.sendFile(__dirname + '/index_admin.html');
});

//===functions
const AlreadyExists=(username,arry)=>{  
   for(let i=0;i<arry.length;i++){     
      if(arry[i].name == username){
        return true;
      }        
    }
    return false;  
}

const FindRightCardForRender=()=>{
  let card=cardSuffler();
  if(!db.has("blocked_cards")){
    db.set("blocked_cards",JSON.stringify([]));
  }
  let blockedCards=JSON.parse(db.get("blocked_cards"));
  let stringCard=card[0]+card[1];
  let cardsAreOkToDisplay=false;
  while(!cardsAreOkToDisplay){
    card=cardSuffler();
    stringCard=card[0]+card[1];
    if(!blockedCards.includes(stringCard)){
      cardsAreOkToDisplay=true;
      break;
    } 
  }
  return card;
}

const BlockThisCard=(rank,suit)=>{
  let blockedCards=JSON.parse(db.get("blocked_cards"));
  let pushedString=rank+suit;
  blockedCards.push(pushedString);
  db.set("blocked_cards",JSON.stringify(blockedCards));
}

const Raise=(type,username,amountTobeRaised,arry)=>{
  arry.forEach(x=>{
    if(x.name==username){
      x.currentState = type;
      
      if(type=="Raise"){
        x.playedThisRound = parseInt(amountTobeRaised);
        x.playedTotalSoFar = parseInt(x.playedTotalSoFar)+parseInt(amountTobeRaised);
        x.money = parseInt(x.money)- parseInt(amountTobeRaised);
      }
      else if(type =="All_In"){
        x.playedThisRound = x.money;
        x.playedTotalSoFar = parseInt(x.playedTotalSoFar)+x.money;
        x.money = 0;
      }
    }    
  })
  return arry;
}

const CheckOrFold=(type,username,arry)=>{
  arry.forEach(x=>{
    if(x.name==username){
      x.currentState = type;
      x.playedThisRound = 0;
    }    
  })
  return arry;
}

//====Card Shuffler 
function RandomNumGen(digit)
{
    let numString=Math.floor(Math.random() * digit);
    return numString;      
}

function cardSuffler(){
    let card= ['Ace','Jack','King','Queen','10','9','8','7','6','5','4','3','2'];
    let cardGroup= ['Spades','Diamonds','Hearts','Clubs'];
    let cardRandomNum=RandomNumGen(card.length)
    let cardGroupRandNum=RandomNumGen(cardGroup.length)
    while(cardRandomNum>card.length || cardRandomNum<0){
        cardRandomNum=RandomNumGen(card.length)
    }
    while(cardGroupRandNum>cardGroup.length || cardGroupRandNum<0){
        cardGroupRandNum=RandomNumGen(cardGroup.length)
    }
    return [card[cardRandomNum],cardGroup[cardGroupRandNum]];
}



io.on('connection', (socket) => {
    console.log('a user connected');
    console.log(socket.id);
    socket.on('disconnect', () => {
      console.log(socket.id+"got disconnected");      
    });

    socket.on('join', (user,socketid) => {
      console.log('=== join event ====');
      if(user != "Administrator"){
        let card = FindRightCardForRender();
        console.log(card);
        BlockThisCard(card[0],card[1]);
        let card2 = FindRightCardForRender();
        console.log(card2);
        BlockThisCard(card2[0],card2[1]);
        db.set(`${user}-card`,JSON.stringify([[card[0],card[1]],[card2[0],card2[1]]]));
        socket.emit("myCards",[[card[0],card[1]],[card2[0],card2[1]]]);
      }      

      if(JSON.parse(db.get("joinedplayer").length>0)){        
        let joinedPlayers=JSON.parse(db.get("joinedplayer"));
        if(!AlreadyExists(user,joinedPlayers)){
          joinedPlayers.push({name:user,socketid:socketid});
          socket.broadcast.emit("player_joined",user);
        }
        db.set(`joinedplayer`, JSON.stringify(joinedPlayers));     
        console.log(`The user ${user} joined`);        
      }
      else{
        db.set(`joinedplayer`, JSON.stringify([{name:user,socketid:socketid}]));
      }
    });

    socket.on('start_game_admn',(amounToBeGiven)=>{      
      console.log("game started after request from admin");
      let playerList=JSON.parse(db.get("joinedplayer"));
      let playerCardInfo=[]
      let count=1;
      
      if(JSON.parse(db.get("final_result")).length>0){
        //==So the match ended now we are ready for next match so update user info based on last match
        //====there has been already a game so take the result and send it to user;
        playerCardInfo=JSON.parse(db.get("final_result"));
        playerCardInfo.forEach(x=>{          
          x.currentState="Not Started";
          x.cards=[];

          //==Set Card and Give Cards to Player
          let card = FindRightCardForRender();
          console.log(card);
          BlockThisCard(card[0],card[1]);
          let card2 = FindRightCardForRender();
          console.log(card2);
          BlockThisCard(card2[0],card2[1]);
          db.set(`${player.name}-card`,JSON.stringify([[card[0],card[1]],[card2[0],card2[1]]]));
          socket.emit("mynewcards",[[card[0],card[1]],[card2[0],card2[1]]],player.name);
          db.set(`${x.name}`, JSON.stringify(x));
        });
      }
      else if(JSON.parse(db.get("final_result")).length == 0){
        //==== Means the No Info about Final Result
        //==== Not a single match is played so far 

        console.log("===no final result info ====");
        //=== Remove Admin from appending to db
        playerList=playerList.filter(x=>{
          return x.name != "Administrator";
        });

        playerList.forEach(player => {          
          let obj={
            userIndex:count,
            name: player.name,
            money: parseInt(amounToBeGiven),
            playedThisRound: 0,
            playedTotalSoFar: 0,
            currentState: "Not Started",
            cards:[]
          };

          //==Set Card and Give Cards to Player
          let card = FindRightCardForRender();
          console.log(card);
          BlockThisCard(card[0],card[1]);
          let card2 = FindRightCardForRender();
          console.log(card2);
          BlockThisCard(card2[0],card2[1]);
          db.set(`${player.name}-card`,JSON.stringify([[card[0],card[1]],[card2[0],card2[1]]]));
          socket.emit("mynewcards",[[card[0],card[1]],[card2[0],card2[1]]],player.name);
          
          db.set(`${player.name}`, JSON.stringify(obj));
          playerCardInfo.push(obj);
          count++;
        });
      }
      
      db.set("current_state",JSON.stringify(playerCardInfo));
      db.set("last_state",JSON.stringify([]));
      io.emit("start_game",playerCardInfo);
    });

    socket.on('display-card',(d)=>{
      let card = FindRightCardForRender();
      BlockThisCard(card[0],card[1]);
      console.log(d,card[0],card[1]);
      let allBoardCards= JSON.parse(db.get("board_card"));
      allBoardCards.push([d,card[0],card[1]]);
      db.set("board_card",JSON.stringify(allBoardCards));
      socket.broadcast.emit("card-reveal",d,card[0],card[1]);
    });

    //====Reset Db after Admin Request

    socket.on('reset_db_admn',(username)=>{
      if(username =="Administrator"){
        if(db.has("joinedplayer")){
          let joinedPlayers = JSON.parse(db.get("joinedplayer"));
          joinedPlayers.forEach(x=>{
            db.delete(`${x.name}`);
            db.delete(`${x.name}-card`);
          });          
        }
        db.set("last_state",JSON.stringify([]));
        db.set("current_state",JSON.stringify([]));
        db.set("blocked_cards",JSON.stringify([]));
        db.set("joinedplayer",JSON.stringify([]));
        db.set("final_result",JSON.stringify([]));
        db.set("board_card",JSON.stringify([]));
      }    
      
    });

    socket.on('game_event',(type,username,amount)=>{
      let allplayerInfos=JSON.parse(db.get("current_state"));
      let returnedArry=[];
      if(type=="Raise" || type=="All_In"){
        returnedArry=Raise(type,username,amount,allplayerInfos);
      }
      if(type=="Check"|| type=="Fold"){
        returnedArry=CheckOrFold(type,username,allplayerInfos);
      }
      
      console.log(type,username,amount);
      let oldValue= db.has("current_state")? allplayerInfos:[];
      db.set("current_state",JSON.stringify(returnedArry));
      db.set("last_state",JSON.stringify(oldValue));
      io.emit("executed_event",returnedArry,username);
    });


    socket.on('declare_winner', (winner) => {
      let playerInfos=JSON.parse(db.get("current_state"));
      let winnerTotalMoney=0,winnerIndex=0;
      for(let i=0;i<playerInfos.length;i++){
        winnerTotalMoney+=playerInfos[i].playedTotalSoFar;
        playerInfos[i].playedTotalSoFar=0;
        playerInfos[i].playedThisRound=0;
        db.delete(`${playerInfos[i].name}`);
        db.delete(`${playerInfos[i].name}-card`);
        if(playerInfos[i].name == winner){
          winnerIndex=i;
        }
      }
      playerInfos[winnerIndex].money+=winnerTotalMoney;
      db.set("final_result",JSON.stringify(playerInfos));
      db.set("joinedplayer",JSON.stringify([]));
      db.set("blocked_cards",JSON.stringify([]));
      io.emit("winner_declared",winner);
    });

    socket.on('reveal_all_cards', (username)=>{
      if(username == "Administrator"){
        let gamePlayers = JSON.parse(db.get("current_state"));
        let arryToSend=[];
        gamePlayers.forEach(x=>{
          arryToSend.push({index:x.userIndex,player:x.player,cards:JSON.parse(db.get(`${x.name}-card`))});
        })
        io.emit("show_everyones_cards",arryToSend);
      }
    })


  });


server.listen(2053, () => {
 console.log('listening on *:2053');
});