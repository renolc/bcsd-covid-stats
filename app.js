const fetch = require('node-fetch')

const run = async () => {
  const res = await fetch('https://www.bcsdschools.net/Page/34941')
  const text = await res.text()

  console.log('text:', text)
}

run()