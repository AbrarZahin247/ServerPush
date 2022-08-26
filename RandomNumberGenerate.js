module.exports=function RandomNumGen(numlength)
{
    let numString=""
    for(let i=0;i<numlength;i++){
        numString+=Math.floor(Math.random() * 10).toString();
    }
    return numString;        
}