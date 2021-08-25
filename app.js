const puppeteer = require('puppeteer')
const fs = require('fs').promises

const schools = [
  'Westview Primary',
  'Westview Middle',
  'Westview Elementary',
  'Stratford High'
]

const run = async () => {
  const browser = await puppeteer.launch({ headless: true })
  const [page] = await browser.pages()
  await page.goto('https://www.bcsdschools.net/Page/34941', {
    waitUntil: 'networkidle2'
  })

  const stats = []
  for (const i of schools) {
    await page.select('#Value1_1', i)
    await page.click("input[name='searchID']")
    await page.waitForFunction(
      `document.querySelector('tr.cbResultSetDataRow td')?.innerText === '${i}'`
    )

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

    stats.push({ school, staff, student, updated })
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>bcsd covid statis</title>
      <style>
        table, th, td { border: 1px solid black; }
        th, td { padding: 10px; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <th>school</th>
          <th>staff</th>
          <th>students</th>
          <th>updated</th>
        </tr>
        ${stats
          .map(
            i => `
            <tr>
              <td>${i.school}</td>
              <td>${i.staff}</td>
              <td>${i.student}</td>
              <td>${i.updated}</td>
            </tr>`
          )
          .join('')}
      </table>
    </body>
    </html>
  `

  await fs.writeFile('./index.html', html)

  await browser.close()
}

run()
