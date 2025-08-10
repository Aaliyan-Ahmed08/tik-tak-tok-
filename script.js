let boxes = document.querySelectorAll(".box")
let resetbtn = document.querySelector("#reset-btn")
let newgmbtn = document.querySelector("#newgm-btn")
let msgcountainer = document.querySelector(".msgcountainer")
let msg = document.querySelector("#msg")

let turn0 = true;

const winPaattrans = [
    [0, 1, 2],
    [0, 3, 6],
    [0, 4, 8],
    [1, 4, 7],4
    [2, 5, 8],
    [2, 4, 6],
    [3, 4, 5],
    [6, 7, 8],

]

const resetgm = () =>{
    turn0=true
    enableboxes();
        msgcountainer.classList.add("hide");
}

boxes.forEach((box) => {
    box.addEventListener("click", () => {
    console.log("box was click");
    if(turn0){
        box.innerText = "0"
        turn0 =false;
        
    }
    else{
        box.innerText = "x"
        turn0 =true;
    }
    box.disabled = true;

    checkwinner();
});
});

const disableboxes = () => {
    for(let box of boxes){
        box.disabled = true;
    }
};

const enableboxes = () => {
    for(let box of boxes){
        box.disabled = false;
        box.innerText="";
    }
};


const showWinner = (winner) => {
    msg.innerText =`congragulation , winner is ${winner}` ;
    msgcountainer.classList.remove("hide");
    disableboxes();
}



const checkwinner =() => {
    for( let pattran of winPaattrans){
        
        let psi1valu = boxes[pattran[0]].innerText
        let psi2valu = boxes[pattran[1]].innerText
        let psi3valu = boxes[pattran[2]].innerText

        if(psi1valu != "" && psi2valu != "" && psi3valu != "") {
            if(psi1valu === psi2valu && psi2valu === psi3valu){
                console.log("winner",psi1valu);
                showWinner(psi1valu);
            }
        }
    }
};



newgmbtn.addEventListener("click", resetgm);
resetbtn.addEventListener("click", resetgm);

