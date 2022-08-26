function RandomNumGen(digit)
{
    let numString=Math.floor(Math.random() * digit);
    return numString;      
}
module.exports= function CardSuffler(){
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