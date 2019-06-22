const seasonRadius = 28;
const monthsRadius = 19;
// ----------------------------------------------------------------------------
function hashDate(date) {
  const [day, month] = date.split('.');
  // get rid of trailing zeroes
  return Number(day).toString() + '_' + Number(month).toString();
};
const bdayDatabase = function() {
  const bdays = [
    {date: '29.03.1998', name: 'Anna Doroshenko'},
    {date: '29.03.1998', name: 'Larysa Doroshenko'},
    {date: '23.03.0',    name: 'Anastasia Motruk'},
    {date: '30.03.1998', name: 'Gleb Soldatkin'},
    {date: '03.08.0',    name: 'Nikita Sokotun'},
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
    {date: '20.01.0',    name: 'Lera Nevjadomskaya'},
    {date: '07.02.1998', name: 'Andrei Vasylyna'},
    {date: '27.06.1998', name: 'Lesja Birukova'},
    {date: '11.06.0',    name: 'Ira Ivanova'},
    {date: '01.04.1998', name: 'Igor Boiarshyn'},
    {date: '04.04.1972', name: 'Laura Boiarshyna'},
  ];

  const dict = {};
  bdays.forEach((bday) => {
    const key = hashDate(bday.date);
    if (key in dict) {
      dict[key].push(bday);
    } else {
      dict[key] = [bday];
    }
  });

  return dict;
}();
// ----------------------------------------------------------------------------
// The origin is January 1st
function dayAndMonthToDegrees(day, month) {
  if (typeof dayAndMonthToDegrees.daysUntilMonth == 'undefined') {
    const daysInMonths = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const arr = [0];
    for (let i = 1; i < daysInMonths.length; i++) {
      arr.push(arr[i - 1] + daysInMonths[i - 1]);
    }
    dayAndMonthToDegrees.daysUntilMonth = arr;
  }

  const DAYS_IN_YEAR = 366; // with capacity for the leap year
  const days = dayAndMonthToDegrees.daysUntilMonth[month - 1] + day;
  return originToJanuary(days / DAYS_IN_YEAR * 360);
}

// The origin for degrees in browser is to the right (east).
// The functiion converts the origin to begin at January 1st
function originToJanuary(degreesFromRight) {
  const halfMonth = 360 / 12 / 2;
  return degreesFromRight - 90 - halfMonth;
}
// ----------------------------------------------------------------------------
// The parent element that will contain the central content
const descriptionParent = document.querySelector('.center-text');

// For a set of bdays that have the same date (apart from perhaps the year)
// and are passed as an array, print the date of the first element and all
// the name in the center of the screen
function describeBdays(bdays) {
  // Take the first date...
  const title = document.createElement('p');
  title.innerHTML = bdays[0].date;
  title.classList.add('center-text-title');
  descriptionParent.appendChild(title);

  // ... and all the names
  bdays.forEach((bday) => {
    const name = document.createElement('p');
    name.innerHTML = bday.name;
    name.classList.add('center-text-entry');
    descriptionParent.appendChild(name);
  });
}

// Reset the contents of the central element
function clearDescription() {
  while (descriptionParent.lastChild) {
    descriptionParent.removeChild(descriptionParent.lastChild);
  }
}
// ----------------------------------------------------------------------------
const distributor = {
  degreesPerEntry: 3,
  // It is guaranteed that order of initialDegrees[i,j] is the same for degrees[i,j]
  memory: [], // sorted by degrees {initialDegrees, degrees(final), requiredSlots, bdays}
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
  // One push is always by 1 degree
  conflictAfterMaybePushInDirection: function(doPush, index, direction) {
    if (this.memory.length <= 1) {
      return false;
    }

    const nextIndex = this.clampIndex(index + direction);
    const src = this.degreesOf(index    ) + (doPush ? direction : 0);
    const dst = this.degreesOf(nextIndex);
    const range = this.degreesForSlots(this.memory[index]    .requiredSlots +
                                       this.memory[nextIndex].requiredSlots);
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
    const MARGIN = 180;
    return (this.movesInDirectionAndWithin(a, target, +1, MARGIN) &&
            this.movesInDirectionAndWithin(target, b, +1, MARGIN));
  },
  emplaceAndSort: function(bdays) {
    const [day, month] = bdays[0].date.split('.'); // the date is the same
    const initialDegrees = dayAndMonthToDegrees(Number(day), Number(month));

    let index;
    for (index = 0; (index < this.memory.length) &&
                    (this.memory[index].initialDegrees < initialDegrees); index++);
    // The entry has to be sorted according to
    // both the _initialDegrees_ and the _degrees_.
    // Have achieved the former, now have to correct for the latter.
    let degrees = initialDegrees;
    if (this.memory.length >= 2) {
      const previous = this.memory[this.clampIndex(index - 1)];
      const next     = this.memory[this.clampIndex(index    )];
      const SHIFT = 0.1;
      if (this.isBetween(initialDegrees, next.degrees, next.initialDegrees)) {
        degrees = this.clampDegrees(next.degrees - SHIFT);
      } else if (this.isBetween(initialDegrees, previous.initialDegrees, previous.degrees)) {
        degrees = this.clampDegrees(previous.degrees + SHIFT);
      }
    }

    this.memory.splice(index, 0, {
      initialDegrees: initialDegrees,
      degrees: degrees,
      requiredSlots: bdays.length,
      bdays: bdays,
    });

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
  // Denotes the amount of degrees an element is offset from its desired origin
  deltaAfterPushInDirection: function(index, direction) {
    const a = this.memory[index].initialDegrees;
    const b = this.memory[index].degrees + direction; // push by one unit
    return Math.abs(this.distanceFromTo(a, b));
  },
  costByDeltaAfterPushInDirection: function(index, direction) {
    const POW = 10; // derived empirically
    return Math.pow(1 + this.deltaAfterPushInDirection(index, direction), POW);
  },
  costOfPushingInDirection: function(index, direction) {
    let cost = 0;
    // The items are guaranteed to be sorted by degrees,
    // but they are not guaranteed to be separated by more than STEP(1) degrees,
    // that's why we must check for conflict both before and after the push.
    while (this.conflictInDirection         (index, direction) ||
           this.conflictAfterPushInDirection(index, direction)) {
      cost += this.costByDeltaAfterPushInDirection(index, direction);
      index = this.clampIndex(index + direction);
    }
    // Account for the last element in chain (that has free space after it):
    // (could be the only element in chain if it has only this element).
    cost += this.costByDeltaAfterPushInDirection(index, direction);
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
    // The items are guaranteed to be sorted by degrees,
    // but they are not guaranteed to be separated by more than STEP degrees,
    // that's why we must check for conflict both before and after the push.
    while (this.conflictInDirection         (index, direction) ||
           this.conflictAfterPushInDirection(index, direction)) {
      this.memory[index].degrees += direction * STEP;
      index = this.clampIndex(index + direction);
    }
    // Lastly, push the last element in chain (that has free space after it):
    // (could be the only push that takes place if the chain
    // consists of only this element).
    this.memory[index].degrees += direction * STEP;
  },
  pushLeft: function(index) {
    this.pushInDirection(index, -1);
  },
  pushRight: function(index) {
    this.pushInDirection(index, +1);
  },

  // The system relies on the fact that there will be no two calls to
  // the function with equal initialDegrees (i.e. no bdays with the same date)
  place: function(bdays) {
    const index = this.emplaceAndSort(bdays);

    while (this.conflictAround(index)) {
      const leftCost  = this.costOfPushingLeft (index);
      const rightCost = this.costOfPushingRight(index);
      if (leftCost < rightCost) {
        this.pushLeft(index);
      } else {
        this.pushRight(index);
      }
    }
  },
};
// ----------------------------------------------------------------------------
const parentForPointers = document.querySelector('.pointers');

function hashPointerBdaysOf(bday) {
  return 'ptr' + hashDate(bday.date);
}
function hashPointerBdaysContentOf(bday) {
  return 'ptrcnt' + hashDate(bday.date);
}
function addPointer(classes, degrees, onMouseOver) {
  const newPointer = document.createElement('div');
  newPointer.classList.add(...classes);
  newPointer.style.transform = `translate(50%, 0px)
                                rotate(${degrees}deg)
                                translate(${monthsRadius}vmin, 0px)`;
  newPointer.onmouseover = onMouseOver;
  newPointer.onmouseout = clearDescription;
  parentForPointers.appendChild(newPointer);
}
function addPointerBdays(bdays, degrees) {
  const uniqueHash = hashPointerBdaysOf(bdays[0]); // the date is the same
  addPointer(['pointer', uniqueHash], degrees, () => describeBdays(bdays));
}
function addPointerToday() {
  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth() + 1;
  const degrees = dayAndMonthToDegrees(todayDay, todayMonth);
  addPointer(['today'], degrees, () => {});
}

function addPointerBdaysContent(bdays, degrees) {
  const element = document.createElement('p');
  const pointerTextShift = 1.1 * seasonRadius;
  element.innerHTML = bdays.map((bday) => bday.name).join(' &<br>');
  element.classList.add('pointer-text');
  element.classList.add(hashPointerBdaysContentOf(bdays[0])); // unique
  const doInvertRotation = (90 < degrees && degrees < 270);
  if (doInvertRotation) {
    const invertedDegrees = 180 + degrees;
    element.style.transformOrigin = 'right center';
    element.style.transform = `translate(-50%, 0px)
                                         rotate(${invertedDegrees}deg)
                                         translate(-${pointerTextShift}vmin, 0px)`;
  } else {
    element.style.transformOrigin = 'left center';
    element.style.transform = `translate(50%, 0px)
                                         rotate(${degrees}deg)
                                         translate(${pointerTextShift}vmin, 0px)`;
  }

  const pointerHash = '.' + hashPointerBdaysOf       (bdays[0]);
  const contentHash = '.' + hashPointerBdaysContentOf(bdays[0]);
  const pointerHoverStr     = 'pointer-hover';
  const pointerTextHoverStr = 'pointer-text-hover';
  element.onmouseover = function() {
    describeBdays(bdays);
    document.querySelector(pointerHash).classList.add(pointerHoverStr);
    document.querySelector(contentHash).classList.add(pointerTextHoverStr);
  };
  element.onmouseout = function() {
    clearDescription();
    document.querySelector(pointerHash).classList.remove(pointerHoverStr);
    document.querySelector(contentHash).classList.remove(pointerTextHoverStr);
  };
  parentForPointers.appendChild(element);
}

function displayBdays(database) {
  Object.entries(database).forEach(([_, bdays]) => distributor.place(bdays));

  distributor.memory.forEach((entry) => {
    addPointerBdays       (entry.bdays, entry.initialDegrees);
    addPointerBdaysContent(entry.bdays, entry.degrees);
  });

  addPointerToday();
}

window.addEventListener('load', () => {
  displayBdays(bdayDatabase);
});
