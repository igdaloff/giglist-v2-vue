import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faRepeat, faAngleDown } from '@fortawesome/free-solid-svg-icons'
import router from './router'

library.add(faRepeat, faAngleDown)

createApp(App)
  .use(router)  
  .component('font-awesome-icon', FontAwesomeIcon)
  .mount('#app')