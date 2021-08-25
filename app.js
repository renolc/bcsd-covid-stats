const puppeteer = require('puppeteer')
const fs = require('fs').promises

const run = async () => {
  const browser = await puppeteer.launch({ headless: true })
  const [page] = await browser.pages()
  await page.goto('https://www.bcsdschools.net/Page/34941', {
    waitUntil: 'networkidle2'
  })
  await page.select('#Value1_1', 'Westview Primary')
  await page.click("input[name='searchID']")
  await page.waitForSelector('tr.cbResultSetDataRow')

  const [
    school,
    ,
    ,
    staff,
    student,
    updated
  ] = await page.$$eval('tr.cbResultSetDataRow td', tds =>
    tds.map(i => i.innerText)
  )

  console.log('school:', school)
  console.log('staff:', staff)
  console.log('student:', student)
  console.log('updated:', updated)

  await fs.writeFile(
    './stats.json',
    JSON.stringify({
      school,
      staff,
      student,
      updated
    })
  )

  await browser.close()
}

run()
