<template>
  
  <!-- This is where our /router view components render -->
  <router-view />

  <Footer />
</template>

<script>

import Footer from './components/Footer'

export default {
  name: 'App',
  components: {
    Footer
  },
}
</script>