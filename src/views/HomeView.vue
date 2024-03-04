<template>
  <main className="max-w-xl m-auto px-4 md:px-8 mt-12 md:mt-24">
    <div className="mb-16 text-center">
      <div className="inline-block m-auto">
        <h1 className="text-3xl sm:text-4xl inline mr-3">Find concerts in</h1>
        <div className="city-select relative inline flex items-center">
          <select
            className="bg-gray-600 hover:bg-gray-700 text-2xl sm:text-3xl py-2 px-3 mt-2 font-light rounded-sm border-gray-600 hover:border-gray-700 cursor-pointer"
            v-model="selected"
            @change="getCityData">
            <option v-for="city in cities" :key="city.id" :value="city.id">{{ city.label }}</option>
          </select>
          <span className="-ml-10 pt-2 text-2xl pointer-events-none">
            <font-awesome-icon icon="angle-down" />
          </span>
        </div>
      </div>
    </div>

    <div className="results relative p-6 text-xl">
      <p aria-live="polite">
        <a
          className="no-underline hover:underline inline-block decoration-1"
          :href="randomGigUrl"
          target="_blank"
          rel="noopener noreferrer"
          ><strong>{{ randomGigArtist }}</strong> is playing
          <br />
          <strong v-if="!gigIsToday">{{ randomGigDayOfWeek }} {{ randomGigMonth }} {{ randomGigDay }}</strong>
          <strong v-else>Today, {{ randomGigTime }}</strong>
          at {{ randomGigVenue }}&nbsp;→
        </a>
      </p>

      <iframe
        v-if="spotifyEmbedUrl"
        title="`Spotify player with top tracks for ${randomGigArtist}`"
        className="mt-6 w-full"
        :src="spotifyEmbedUrl"
        width="100%"
        height="80"
        frameBorder="0"
        allowtransparency="true"
        allow="encrypted-media"
        aria-live="polite"></iframe>
      <em v-else className="text-gray-600 text-sm pt-4 block" aria-live="polite">[Artist not found on Spotify]</em>
    </div>

    <div className="block text-center p-4">
      <button className="hover:underline" @click="getCityData">
        <font-awesome-icon icon="repeat" className="pr-2" /> Get Another
      </button>
    </div>
  </main>
</template>

<script>
import cityData from '../data/ticketmasterCityData.js';

export default {
  name: 'HomeView',

  data() {
    return {
      selected: 345,
      cities: cityData,
      ticketmasterData: [],
      spotifyToken: '',
      spotifyEmbedUrl: '',
      randomGigVenue: '',
      randomGigUrl: '',
      randomGigDayOfWeek: '',
      randomGigMonth: '',
      randomGigDay: '',
      randomGigArtist: '',
      randomGigTime: '',
      gigIsToday: ''
    };
  },
  async created() {
    // The first step in getting data from Spotify API is to do a POST request with our client ID and secret to get an access token in response (From this tutorial: https://www.youtube.com/watch?v=SbelQW2JaDQ)
    // The below private method returns a promise (as denoted by 'async'); we store the endpoint response in variable 'result'
    const result = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + btoa(process.env.VUE_APP_SPOTIFY_API_KEY)
      },
      body: 'grant_type=client_credentials'
    });

    // We await the json result from above and store it in variable 'data' and specifically return the access_token from the json data
    // We'll use this token to call Spotify API endpoint below
    const data = await result.json();
    this.spotifyToken = data.access_token;

    // Also, show a default result on page load
    this.getCityData(this.selected);
  },
  methods: {
    async getCityData(defaultCityId, e) {
      // Store city ID from selected <option> value in a variable; use defaultCityId on page load only
      const ticketmasterCityId = defaultCityId ? this.selected : e.target.value;

      // Using the getSongkickUrl method, generate a URL using the ID and date from above
      const ticketmasterUrl = this.getTicketmasterUrl(ticketmasterCityId);
      let ticketmasterData;
      const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hrs in ms
      const cachedResultJSON = localStorage.getItem(`cache-${ticketmasterCityId}`);
      const cachedResult = JSON.parse(cachedResultJSON);

      if (cachedResult && Date.now() - cachedResult.createdAt < CACHE_MAX_AGE) {
        // If data is cached, set songkickData as data from cache
        ticketmasterData = cachedResult.ticketmasterData;
      } else {
        // If data not cached, fetch it from the URL generated in getSongkickURL(), extract it as a JSON object, and store it in a new cache, alongside a createdAt timestamp
        // Also, store response in songkickData array defined above in data()
        // Note: I'm using await/async instead of .then() chains, I think because it's cleaner and easier to read but not entirely sure...
        const response = await fetch(ticketmasterUrl);
        ticketmasterData = await response.json();

        const dataToCache = {
          createdAt: Date.now(),
          ticketmasterData
        };
        localStorage.setItem(`cache-${ticketmasterCityId}`, JSON.stringify(dataToCache));
      }

      this.ticketmasterData = ticketmasterData;
      this.getRandomGigData();
    },
    getTicketmasterUrl(ticketmasterCityId) {
      const now = new Date();
      const today = now.toISOString().substring(0, 19) + 'Z';
      const ticketmasterAPIKey = process.env.VUE_APP_TICKETMASTER_API_KEY;
      let ticketmasterUrl = `https://app.ticketmaster.com/discovery/v2/events.json?classificationName=music&dmaId=${ticketmasterCityId}&apikey=${ticketmasterAPIKey}&startDateTime=${today}`;
      return ticketmasterUrl;
    },
    getRandomGigData() {
      console.log(this.ticketmasterData._embedded.events[1]);
      const listOfGigs = this.ticketmasterData._embedded.events;
      const randomGig = listOfGigs[Math.floor(Math.random() * listOfGigs.length)];
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      this.gigIsToday = new Date(randomGig.dates.start.localDate).toISOString().slice(0, 10) == today;

      const randomGigDate = new Date(randomGig.dates.start.localDate.replace(/-/g, '\/')); //Replacing dash with slash to fix quirky thing with Date() object being 1 day off: https://stackoverflow.com/questions/7556591/is-the-javascript-date-object-always-one-day-off

      this.randomGigVenue = randomGig._embedded.venues[0].name;
      this.randomGigUrl = randomGig.url;
      this.randomGigDayOfWeek = randomGigDate.toLocaleString('default', { weekday: 'long' });
      this.randomGigMonth = randomGigDate.toLocaleString('default', { month: 'long' });
      this.randomGigDay = randomGigDate.getDate();
      this.randomGigArtist = randomGig.name;
      this.randomGigTime = randomGig.dates.start.localDate;

      this.getSpotifyEmbedUrl(this.spotifyToken, this.randomGigArtist);
    },

    async getSpotifyEmbedUrl(token, artistName) {
      const artistResult = await fetch(`https://api.spotify.com/v1/search?q=${artistName}&type=artist&limit=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'Bearer ' + token
        }
      });

      const spotifyData = await artistResult.json();
      const spotifyArtistId = spotifyData.artists.items[0].id;
      this.spotifyEmbedUrl = `https://open.spotify.com/embed/artist/${spotifyArtistId}`;
    }
  }
};
</script>
