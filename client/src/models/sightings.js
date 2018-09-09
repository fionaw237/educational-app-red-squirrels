const Request = require('../helpers/request.js');
const PubSub = require('../helpers/pub_sub.js');

const Sightings = function(){
  this.items = [];
  this.request = new Request('/api/sightings');
  this.sightingsByYear = [];
};

Sightings.prototype.setUpEventListeners = function(){
  PubSub.subscribe('SightingFormView:sighting-submitted', (event) => {
    const newSighting = event.detail;
    console.log(newSighting);
    this.add(newSighting);
  });
};

Sightings.prototype.getData = function(){
  this.request
    .get()
    .then((sightings) => {
      this.items = sightings;
      PubSub.publish('Sightings:all-map-data-loaded', this.items);
    })
    .catch((err) => console.error(err));
}

Sightings.prototype.add = function(item){
  this.request
  .post(item)
  .then((sightings) => {
    this.items = sightings;
    PubSub.publish('Sightings:all-map-data-loaded', this.items);
  })
  .catch((err) => console.error(err));
}

Sightings.prototype.filterByYear = function(year){
  PubSub.subscribe('Sightings:all-map-data-loaded', () => {
    this.sightingsByYear = this.items.filter(item => item.Startdateyear === year);
    PubSub.publish('Sightings:selected-year-data-ready', this.sightingsByYear);
  })
}

Sightings.prototype.getChartData = function(){
  PubSub.subscribe('Sightings:selected-year-data-ready', (event) => {
    this.sightingsByYear = event.detail;
    this.createChartArray()
  })
  // Sightings:selected-year-chart-data-ready
}

Sightings.prototype.filterByCountry = function(country){
  return this.sightingsByYear.filter(item => item["State/Province"] === country);
}

Sightings.prototype.filterByMonth = function(month, data){
  return data.filter(item => item["Startdatemonth"] === month).length;
}

Sightings.prototype.createChartArray = function(){
  const months = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const countries = ["Scotland", "England", "Northern Ireland", "Wales"];

  const dataArray = [];

  countries.forEach((country) => {
    const countryObject = {
      name: `${country}`,
      data: []
    };

    const countrySightingsData = this.filterByCountry(country);

    months.forEach((month) => {
      const sightingsByMonth = this.filterByMonth(month,countrySightingsData);
      countryObject.data.push(sightingsByMonth)
    });

    dataArray.push(countryObject)
  });

  return dataArray;

}

module.exports = Sightings;
