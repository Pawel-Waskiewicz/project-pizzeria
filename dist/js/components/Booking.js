import {templates, select, settings, classNames} from '../settings.js';
import AmountWidget from '../components/AmountWidget.js';
import HourPicker from './HourPicker.js';
import DatePicker from './DatePicker.js';
import utils from '../utils.js';

class Booking {
  constructor(element){
    const thisBooking = this;

    thisBooking.selectedTable = null; 

    thisBooking.render(element);
    thisBooking.initWidgets(); 
    thisBooking.getData();  
     
    
  }
  getData(){
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam =  settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam
      ],
    };

    //console.log('getData params', params);

    const urls = {
      booking:        settings.db.url + '/' + settings.db.booking
                                      + '?' + params.booking.join('&'), 
      eventsCurrent:  settings.db.url + '/' + settings.db.event  
                                  + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:   settings.db.url + '/' + settings.db.event   
                                      + '?' + params.eventsRepeat.join('&'),
    };
    //console.log('urls', urls);
    
    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        //console.log(bookings);
        //console.log(eventsCurrent);
        //console.log(eventsRepeat);
        thisBooking.parseData(bookings,eventsRepeat,eventsCurrent);
      });
    
  }
  
  parseData(bookings, eventsRepeat, eventsCurrent){
    const thisBooking = this;
    console.log(bookings);
    console.log(eventsRepeat);

    thisBooking.booked = {};

    for (let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    for (let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1))
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);

      }
    }
    //console.log('thisBookingBooked:', thisBooking.booked);

    thisBooking.updateDOM();
  }

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if(
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5 ){
      //console.log('loop', hourBlock);
    
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);

    }
  }
  

  render(element){
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = document.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = document.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = document.querySelectorAll(select.booking.tables);
    thisBooking.dom.allTables = document.querySelector(select.booking.allTables);
    thisBooking.dom.phone = document.querySelector(select.booking.phone);
    thisBooking.dom.address = document.querySelector(select.booking.address);
    thisBooking.dom.starters = document.querySelectorAll(select.booking.starters);
    thisBooking.dom.form = document.querySelector(select.booking.form);
  
  
  }
  initTables(){
    const thisBooking = this;

    const clickedElement = event.target;
    console.log('clickedElement:', clickedElement);

    
    if(clickedElement.classList.contains(classNames.booking.tableBooked)){
      alert('This table is booked');
    } 
    if(clickedElement.classList.contains(classNames.booking.tableSelected)){
      clickedElement.classList.remove(classNames.booking.tableSelected);
    }
    
    if(!clickedElement.classList.contains(classNames.booking.tableBooked) && clickedElement.classList.contains('table')){
      const idTable = clickedElement.getAttribute('data-table');
      thisBooking.selectedTable = idTable;
      const tableList = thisBooking.dom.tables;

      for(let table of tableList){
        table.classList.remove(classNames.booking.tableSelected);
      }
      
      clickedElement.classList.add(classNames.booking.tableSelected);

      
    }

   
  }


  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisBooking.sendBooking();
    });

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });

    thisBooking.dom.allTables.addEventListener('click', function(){
      thisBooking.initTables();
    });
    thisBooking.dom.peopleAmount.addEventListener('click', function(){
      const tableList = thisBooking.dom.tables;
      for(let table of tableList){
        table.classList.remove(classNames.booking.tableSelected);
      }
    });
    thisBooking.dom.hoursAmount.addEventListener('click', function(){
      const tableList = thisBooking.dom.tables;
      for(let table of tableList){
        table.classList.remove(classNames.booking.tableSelected);
      }
    });
    thisBooking.dom.datePicker.addEventListener('click', function(){
      const tableList = thisBooking.dom.tables;
      for(let table of tableList){
        table.classList.remove(classNames.booking.tableSelected);
      }
    });
    thisBooking.dom.hourPicker.addEventListener('click', function(){
      const tableList = thisBooking.dom.tables;
      for(let table of tableList){
        table.classList.remove(classNames.booking.tableSelected);
      }
    });
    
  }
  sendBooking(){
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;

    const bookingData = {};

    bookingData.date = thisBooking.datePicker.value;
    bookingData.hour = thisBooking.hourPicker.value;
    bookingData.table = thisBooking.selectedTable;
    bookingData.duration = thisBooking.hoursAmount.value;
    bookingData.ppl = thisBooking.peopleAmount.value;
    bookingData.starters = [];
    bookingData.phone = thisBooking.dom.phone.value;
    bookingData.address = thisBooking.dom.address.value;
    

    for(let starter of thisBooking.dom.starters){
      if(starter.checked == true){
        bookingData.starters.push(starter);
        
      }
    } 
    
    const options = {

      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    };

    fetch(url, options)
      .then(function(response){
        return response.json();
      }).then(function(parsedResponse){
        console.log('parsedResponse', parsedResponse);
        thisBooking.makeBooked();
      });

    console.log('bookingData', bookingData); 
  }
 
}
export default Booking;