const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currentDay = new Date().getDay();
const currentDayOfWeek = daysOfWeek[currentDay];

const currentMonth = new Date().getMonth();
const currentMonthName = months[currentMonth];

const currentTime = new Date().getHours();
const currentMinutes = addZero(new Date().getMinutes());

function addZero(number: number) {
  if (number < 10) {
    return `0${number}`;
  }
  return number.toString();
}

export {
  currentDay,
  currentDayOfWeek,
  currentMonthName,
  currentTime,
  currentMinutes,
  addZero,
};
