<template>
  <select v-model="selected" @change="getCityData">
    <option v-for="city in cities" :key="city.id" :value="city.id">{{ city.label }}</option>
  </select>
  <p>{{ randomGigVenue }}</p>
  <p>{{ randomGigUrl }}</p>
  <p>{{ randomGigDayOfWeek }}</p>
  <p>{{ randomGigMonth }}</p>
  <p>{{ randomGigDay }}</p>
  <p>{{ randomGigArtist }}</p>
</template>

<script>

import cityData from "../data/songkickCityData.js"

export default {
  data() {
    return {
      selected: 7644,
      cities: cityData,
      songkickData: [],
      randomGigVenue: '',
      randomGigUrl: '',
      randomGigDayOfWeek: '',
      randomGigMonth: '',
      randomGigDay: '',
      randomGigArtist: ''
    }
  },
  methods: {
    async getCityData(e) {

      // Store city ID from selected <option> value in a variable
      const songkickCityId = e.target.value

      // Using the getSongkickUrl method, generate a URL using the ID and date from above
      let songkickUrl = this.getSongkickUrl(songkickCityId)      

      // Fetch data from the URL generated above and extract it as a JSON object; Note: I'm using await/async instead of .then() chains, I think because it's cleaner and easier to read but not entirely sure
      const response = await fetch(songkickUrl)
      const responseJSON = await response.json()

      // Store returned data in songkickData array defined above      
      this.songkickData = responseJSON
              
      this.getRandomGigData()
    },
    getSongkickUrl(songkickCityId) {
      const now = new Date()
      const today = now.toISOString().slice(0, 10)
      const songkickAPIKey = 'RpuYqxFiPPsJPs5l'
      let songkickUrl = `https://api.songkick.com/api/3.0/metro_areas/${songkickCityId}/calendar.json?min_date=${today}&apikey=${songkickAPIKey}`;
      
      return songkickUrl
    },
    getRandomGigData() {      
      const listOfGigs = this.songkickData.resultsPage.results.event
      const randomGig = listOfGigs[Math.floor(Math.random()*listOfGigs.length)];
      const randomGigDate = new Date(randomGig.start.datetime);
      this.randomGigVenue = randomGig.venue.displayName;
      this.randomGigUrl = randomGig.uri;      
      this.randomGigDayOfWeek = randomGigDate.toLocaleString('default', { weekday: 'long' });
      this.randomGigMonth = randomGigDate.toLocaleString('default', { month: 'long' });
      this.randomGigDay = randomGigDate.getDate();
      this.randomGigArtist = randomGig.performance[0].artist.displayName;            
    },

    // The first step in getting data from Spotify API is to do a POST request with our client ID and secret to get an access token in response (From this tutorial: https://www.youtube.com/watch?v=SbelQW2JaDQ)    
    // The below private method returns a promise (as denoted by 'async'); we store the endpoint response in variable 'result'    
    async getSpotifyToken () {    
      const clientId = '471048b4fff14c79b12b08abb6dae22e'
      const clientSecret = 'd8b25c87a3e248beb461a94b48f5905f'
      const result = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
        },
        body: 'grant_type=client_credentials'
      });

      // We await the json result from above and store it in variable 'data' and specifically return the access_token from the json data
      // We can use this token to call Spotify API endpoint
      const data = await result.json(); 
      console.log(data)     
      return data.access_token;      
    }
  },
  beforeMount(){
    this.getSpotifyToken()    
  }
}
</script>

<style>

</style>