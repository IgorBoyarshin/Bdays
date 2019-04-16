const seasonRadius = 28;
const monthsRadius = 19;

function hashDateOf(bday) {
  const [day, month] = bday.date.split('.');
  // get rid of trailing zeroes
  return Number(day).toString() + '_' + Number(month).toString();
};
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
    const key = hashDateOf(bday);
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


const distributor = {
  degreesPerEntry: 3,
  // It is guaranteed that order of initialDegrees[i,j] is the same for degrees[i,j
  memory: [], // sorted by degrees {initialDegrees, degrees(final), requiresSlots, bdays}
  indexOfInitialDegrees: function(degrees) {
    let index = -1;
    for (let i = 0; i < memory.length; i++) {
      if (memory[i].initialDegrees === degrees) {
        index = i;
        break;
      }
    }
    if (index == -1) {
      console.log('Failed to locate degrees: ' + degrees);
    }
    return index;
  },

  degreesForSlots: function(slots) {
    return this.degreesPerEntry * (1 + 0.6 * (slots - 2));
  },
  degreesOf: function(index) {
    return this.memory[index].degrees;
  },
  movesInDirectionAndWithin: function(src, dst, direction, margin) {
    const distance = this.distanceFromTo(src, dst) * (-direction);
    const inSpecifiedDirection = distance > 0;
    const within = distance < margin;
    return inSpecifiedDirection && within;
  },
  conflictAfterMaybePushInDirection: function(doPush, index, direction) {
    if (this.memory.length <= 1) {
      return false;
    }

    const nextIndex = this.clampIndex(index + direction);
    const src = this.degreesOf(index    ) + (doPush ? direction : 0);
    const dst = this.degreesOf(nextIndex);
    const range = this.degreesForSlots(this.memory[index]    .requiresSlots +
                                       this.memory[nextIndex].requiresSlots);
    return this.movesInDirectionAndWithin(src, dst, direction, range);
  },
  conflictInDirection: function(index, direction) {
    return this.conflictAfterMaybePushInDirection(false, index, direction);
  },
  conflictAfterPushInDirection: function(index, direction) {
    return this.conflictAfterMaybePushInDirection(true, index, direction);
  },
  conflictLeft: function(index) {
    return this.conflictInDirection(index, -1);
  },
  conflictRight: function(index) {
    return this.conflictInDirection(index, +1);
  },
  conflictAround: function(index) {
    return this.conflictLeft(index) || this.conflictRight(index);
  },

  isBetween: function(target, a, b) {
    const MARGIN = 90;
    return (this.movesInDirectionAndWithin(a, target, +1, MARGIN) &&
            this.movesInDirectionAndWithin(target, b, +1, MARGIN));
  },
  emplaceSorted: function(bdays) {
    const [day, month] = bdays[0].date.split('.'); // the date (except for maybe year) is the same
    const degreesShift = dayAndMonthToDegrees(Number(day), Number(month));
    const initialDegrees = this.clampDegrees(-90 - 360/12/2 + degreesShift);

    let index;
    for (index = 0; (index < this.memory.length) &&
                    (this.memory[index].initialDegrees < initialDegrees); index++);
    // The entry has to be sorted according to both the _initialDegrees_ and the _degrees_.
    // Have achieved the former, now have to correct for the latter.
    let degrees = initialDegrees;
    if (this.memory.length >= 2) {
      const previous = this.memory[this.clampIndex(index - 1)];
      const next     = this.memory[this.clampIndex(index    )]; // have not inserted at index yet!
      console.log(previous.initialDegrees + ',' + previous.degrees);
      console.log(next.initialDegrees + ',' + next.degrees);
      // const MARGIN = 180;
      const SHIFT = 0.1;
      if (this.isBetween(initialDegrees, next.degrees, next.initialDegrees)) {
        console.log('case 1');
        degrees = this.clampDegrees(next.degrees - SHIFT);
      } else if (this.isBetween(initialDegrees, previous.initialDegrees, previous.degrees)) {
        console.log('case 2');
        degrees = this.clampDegrees(previous.degrees + SHIFT);
      }
    }

    this.memory.splice(index, 0, {initialDegrees: initialDegrees, degrees: degrees, requiresSlots: bdays.length, bdays: bdays});
    return index;
  },

  clamp: function(what, base) {
    while (what < 0) {
      what += base;
    }
    return what % base;
  },
  clampIndex: function(index) {
    return this.clamp(index, this.memory.length);
  },
  clampDegrees: function(degrees) {
    return this.clamp(degrees, 360);
  },

  // The direction increases in the clockwise direction
  distanceFromTo: function(from, to) {
    if (to > from) {
      return -this.distanceFromTo(to, from);
    }
    const distance = from - to;
    return (distance > 180) ? (distance - 360) : distance;
  },
  deltaAfterPushInDirection: function(index, direction) {
    const a = this.memory[index].initialDegrees;
    const b = this.memory[index].degrees + direction;
    return Math.abs(this.distanceFromTo(a, b));
  },
  costOfPushingInDirection: function(index, direction) {
    let cost = 0;
    const POW = 10;
    while (this.conflictInDirection         (index, direction) ||
           this.conflictAfterPushInDirection(index, direction)) {
      cost += Math.pow(1 + this.deltaAfterPushInDirection(index, direction), POW);
      index = this.clampIndex(index + direction);
    }
    cost += Math.pow(1 + this.deltaAfterPushInDirection(index, direction), POW); // last in chain
    return cost;
  },
  costOfPushingLeft: function(index) {
    return this.costOfPushingInDirection(index, -1);
  },
  costOfPushingRight: function(index) {
    return this.costOfPushingInDirection(index, +1);
  },

  pushInDirection: function(index, direction) {
    const STEP = 1;
    while (this.conflictInDirection         (index, direction) ||
           this.conflictAfterPushInDirection(index, direction)) {
      this.memory[index].degrees += direction * STEP;
      index = this.clampIndex(index + direction);
    }
    this.memory[index].degrees += direction * STEP;
  },
  pushLeftFrom: function(index) {
    this.pushInDirection(index, -1);
  },
  pushRightFrom: function(index) {
    this.pushInDirection(index, +1);
  },

  // The system relies on the promise that there will be no two calls to
  // the function with equal initialDegrees (i.e. no duplicates)
  place: function(bdays) {
    console.log('=================');
    console.log('State before:');
    this.memory.forEach((entry) => {
      console.log(entry);
    });

    const index = this.emplaceSorted(bdays);
    console.log('State after correction:');
    this.memory.forEach((entry) => {
      console.log(entry);
    });

    while (this.conflictAround(index)) {
      const leftCost  = this.costOfPushingLeft (index);
      const rightCost = this.costOfPushingRight(index);
      if (leftCost < rightCost) {
        this.pushLeftFrom (index);
      } else {
        this.pushRightFrom(index);
      }
    }
  },
};


const parentForPointers = document.querySelector('.pointers');

function hashPointerOf(bday) {
  return 'ptr' + hashDateOf(bday);
}
function hashPointerContentOf(bday) {
  return 'ptrcnt' + hashDateOf(bday);
}
function addPointer(bdays, degrees) {
  const newPointer = document.createElement('div');
  const pointerShift = monthsRadius;
  newPointer.classList.add('pointer');
  newPointer.classList.add(hashPointerOf(bdays[0])); // unique
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
  newPointerContent.innerHTML = bdays.map((bday) => bday.name).join(' &<br>');
  newPointerContent.classList.add('pointer-text');
  newPointerContent.classList.add(hashPointerContentOf(bdays[0])); // unique
  const doInvertRotation = (degrees > 90 && degrees < 270);
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
    document.querySelector('.' + hashPointerOf       (bdays[0])).classList.add('pointer-hover');
    document.querySelector('.' + hashPointerContentOf(bdays[0])).classList.add('pointer-text-hover');
  };
  newPointerContent.onmouseout = function() {
    undescribeBdays();
    document.querySelector('.' + hashPointerOf       (bdays[0])).classList.remove('pointer-hover');
    document.querySelector('.' + hashPointerContentOf(bdays[0])).classList.remove('pointer-text-hover');
  };
  parentForPointers.appendChild(newPointerContent);
}

function displayBdays(database) {
  for (key in database) {
    if ({}.hasOwnProperty.call(database, key)) {
      distributor.place(database[key]);
    }
  }
  distributor.memory.forEach((entry) => {
    addPointer       (entry.bdays, entry.initialDegrees);
    addPointerContent(entry.bdays, entry.degrees);
  });
}

window.addEventListener('load', () => {
  displayBdays(bdayDatabase);
});
