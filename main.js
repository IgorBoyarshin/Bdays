const seasonRadius = 25;
const monthsRadius = 19;

const bdayDatabase = function() {
  const bdays = [
    {date: '29.03.1998', name: 'Anna Doroshenko'},
    {date: '29.03.1998', name: 'Larysa Doroshenko'},
    {date: '23.03.0', name: 'Anastasia Motruk'},
    {date: '30.03.1998', name: 'Gleb Soldatkin'},
    {date: '03.08.0', name: 'Nikita Sokotun'},
    {date: '14.09.1997', name: 'Vladick Bugayov'},
    {date: '10.08.1994', name: 'Evgenia Soroka'},
    {date: '28.04.1998', name: 'Aleksei Shalick'},
    {date: '31.12.1998', name: 'Anastasia Aljohina'},
    {date: '15.07.1998', name: 'Katja Yakir'},
    {date: '15.10.1998', name: 'Ira Krasko'},
    {date: '14.04.1998', name: 'Ada Melentjeva'},
    {date: '30.03.1998', name: 'Olja Levkovich'},
    {date: '30.09.1998', name: 'Warja Wojnarowskaja'},
    {date: '07.06.1996', name: 'Uljana Stefanischina'},
    {date: '30.10.1997', name: 'Anna Torbin'},
    {date: '23.07.1998', name: 'Katja Fedorenko'},
    {date: '30.12.1997', name: 'Lena Galitskaya'},
    {date: '30.12.1997', name: 'Anastasia Kucherenko'},
    {date: '10.11.1997', name: 'Maria Swoboda'},
    {date: '28.09.1998', name: 'Oleksandr Smokovich'},
    {date: '20.01.0', name: 'Lera Nevjadomskaya'},
    {date: '07.02.1998', name: 'Andrei Vasylyna'},
    {date: '01.04.1998', name: 'Igor Boiarshyn'},
    {date: '04.04.1972', name: 'Laura Boiarshyna'},
  ];
  const dict = {};
  for (let index = 0; index < bdays.length; index++) {
    const bday = bdays[index];
    const [day, month] = bday.date.split('.');
    // get rid of trailing zeroes
    const key = Number(day).toString() + ':' + Number(month).toString();
    if (key in dict) {
      dict[key].push(bday);
    } else {
      dict[key] = [bday];
    }
  }

  return dict;
}();

const daysInMonths = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const daysUntilMonth = function() {
  const arr = [0];
  for (let i = 1; i < daysInMonths.length; i++) {
    arr.push(arr[i - 1] + daysInMonths[i - 1]);
  }
  return arr;
}();

function dayAndMonthToDegrees(day, month) {
  const DAYS_IN_YEAR = 366; // with capacity for the leap year
  return (daysUntilMonth[month - 1] + day) / DAYS_IN_YEAR * 360;
}

const parentForDescription = document.querySelector('.center-text');
function describeBdays(bdays) {
  const title = document.createElement('p');
  title.innerHTML = bdays[0].date; // all elements have same date (except for maybe year)
  title.classList.add('center-text-title');
  parentForDescription.appendChild(title);

  for (let index = 0; index < bdays.length; index++) {
    const name = document.createElement('p');
    name.innerHTML = bdays[index].name;
    name.classList.add('center-text-entry');
    parentForDescription.appendChild(name);
  }
}

function undescribeBdays() {
  while (parentForDescription.lastChild) {
    parentForDescription.removeChild(parentForDescription.lastChild);
  }
}

const parentForPointers = document.querySelector('.pointers');
function addPointer(bdays, degrees) {
  const newPointer = document.createElement('div');
  const pointerShift = monthsRadius;
  newPointer.classList.add('pointer');
  newPointer.style.transform = `translate(50%, 0px)
                                rotate(${degrees}deg)
                                translate(${pointerShift}vmin, 0px)`;
  newPointer.onmouseover = function() {
    describeBdays(bdays);
  };
  newPointer.onmouseout = function() {
    undescribeBdays();
  };
  parentForPointers.appendChild(newPointer);
}

function addPointerContent(bdays, degrees) {
  const newPointerContent = document.createElement('p');
  const pointerTextShift = 1.1 * seasonRadius;
  newPointerContent.innerHTML = bdays.map((bday) => bday.name).join(', ');
  newPointerContent.classList.add('pointer-text');
  const doInvertRotation = (degrees + 90) > 180;
  if (doInvertRotation) {
    const invertedDegrees = 180 + degrees;
    newPointerContent.style.transformOrigin = 'right center';
    newPointerContent.style.transform = `translate(-50%, 0px)
                                         rotate(${invertedDegrees}deg)
                                         translate(-${pointerTextShift}vmin, 0px)`;
  } else {
    newPointerContent.style.transformOrigin = 'left center';
    newPointerContent.style.transform = `translate(50%, 0px)
                                         rotate(${degrees}deg)
                                         translate(${pointerTextShift}vmin, 0px)`;
  }

  newPointerContent.onmouseover = function() {
    describeBdays(bdays);
  };
  newPointerContent.onmouseout = function() {
    undescribeBdays();
  };
  parentForPointers.appendChild(newPointerContent);
}

function displayBday(bdays) {
  const [day, month] = bdays[0].date.split('.');
  const degreesShift = dayAndMonthToDegrees(Number(day), Number(month));
  const displayDegrees = -90 - 360/12/2 + degreesShift;
  addPointer(bdays, displayDegrees);
  addPointerContent(bdays, displayDegrees);
}

function displayBdays(database) {
  for (key in database) {
    if ({}.hasOwnProperty.call(database, key)) {
      displayBday(database[key]);
    }
  }
}

window.addEventListener('load', ()=> {
  displayBdays(bdayDatabase);
});
