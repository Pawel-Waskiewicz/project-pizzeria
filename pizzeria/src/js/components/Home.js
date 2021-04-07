import {select } from './settings.js';


class Home{
  constructor(element){
    const thisHome = this;

    thisHome.getElements(element);
    thisHome.initAction();
  }

  getElements(){
    const thisHome = this;

    thisHome.dom.orderButton = thisHome.document.querySelector(select.home.orderButton);
    console.log(thisHome.dom.orderButton);
  }
 
  initAction(){
    const thisHome = this;

    thisHome.dom.orderButton.addEventListener('click', function(event){
      event.preventDefault();
      location.replace('http://localhost:3000/#/order');
    });
  }
  
}
export default Home;