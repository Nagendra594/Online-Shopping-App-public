const backdrop = document.querySelector(".backdrop");
const sideDrawer = document.querySelector(".mobile-nav");
const menuToggle = document.querySelector("#side-menu-toggle");
const userButton = document.querySelector(".user");
const AdminButton = document.querySelector(".Admin");
const form = document.querySelector(".login-form");
const forgot = document.querySelector("#forgot");
const nullEle = document.querySelectorAll(".null");
const next = document.querySelector(".next");
const prev = document.querySelector(".prev");
// if(next){
//   next.addEventListener("click",function(){

//   })
// }

if (nullEle) {
  nullEle.forEach((ele) => {
    ele.parentNode.removeChild(ele);
  });
}
function backdropClickHandler() {
  backdrop.style.display = "none";
  sideDrawer.classList.remove("open");
}

function menuToggleClickHandler() {
  backdrop.style.display = "block";
  sideDrawer.classList.add("open");
}
function clientChangerToUser() {
  form.action = "/userLogin";
  userButton.classList.add("loginSwitcher");
  AdminButton.classList.remove("loginSwitcher");
  forgot.href = "/reset/user";
}
function clientChangerToAdmin() {
  form.action = "/adminLogin";
  AdminButton.classList.add("loginSwitcher");
  userButton.classList.remove("loginSwitcher");
  forgot.href = "/reset/admin";
}
backdrop.addEventListener("click", backdropClickHandler);
menuToggle.addEventListener("click", menuToggleClickHandler);
if (userButton) {
  userButton.addEventListener("click", clientChangerToUser);
}
if (AdminButton) {
  AdminButton.addEventListener("click", clientChangerToAdmin);
}
