const puppeteer = require('puppeteer')
const fs = require('fs').promises

const schools = [
  'Berkeley County School District',
  'Westview Primary',
  'Westview Middle',
  'Westview Elementary',
  'Stratford High',
  'Howe Hall Aims',
  'Marrington Middle',
  'Berkeley High School'
]

const run = async () => {
  const browser = await puppeteer.launch({ headless: true })
  const [page] = await browser.pages()
  await page.goto('https://www.bcsdschools.net/Page/34941', {
    waitUntil: 'networkidle2'
  })

  const stats = []
  for (const i of schools) {
    console.log('pulling', i)
    await page.select('#Value1_1', i)
    await page.click("input[name='searchID']")
    await page.waitForFunction(
      `document.querySelector('tr.cbResultSetDataRow td')?.innerText === '${i}'`
    )

    const [
      school,
      ,
      staffCovid,
      studentCovid,
      staffClose,
      studentClose,
      updated
    ] = await page.$$eval('tr.cbResultSetDataRow td', tds =>
      tds.map(i => i.innerText)
    )

    stats.push({
      school,
      staffCovid,
      studentCovid,
      staffClose,
      studentClose,
      updated
    })
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
        th { font-size: x-small; }
        td.updated { font-weight: bold; text-align: center; font-size: small; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <th>school</th>
          <th>staff covid</th>
          <th>students covid</th>
          <th>staff close</th>
          <th>student close</th>
        </tr>
        <tr>
          <td class="updated" colspan="5">last updated: ${stats[0].updated}</td>
        </tr>
        ${stats
          .map(
            i => `
            <tr>
              <td>${i.school}</td>
              <td>${i.staffCovid}</td>
              <td>${i.studentCovid}</td>
              <td>${i.staffClose}</td>
              <td>${i.studentClose}</td>
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
