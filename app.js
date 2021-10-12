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

const diffBuilder = (last, curr, key) => {
  const prev = last.data[curr.school]
  if (!prev) return ''

  const diffVal = curr[key] - prev[key]
  if (diffVal > 0) return ` (+${diffVal})`
  if (diffVal < 0) return ` (${diffVal})`
  return ' (=)'
}

let browser
const run = async () => {
  browser = await puppeteer.launch({ headless: true })
  const [page] = await browser.pages()
  await page.goto('https://www.bcsdschools.net/Page/34941', {
    waitUntil: 'networkidle2'
  })

  const last = require('./last.json')

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
      staffCovid: +staffCovid,
      studentCovid: +studentCovid,
      staffClose: +staffClose,
      studentClose: +studentClose,
      updated
    })
  }

  if (last.updated === stats[0].updated) return

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
        th { font-size: small; }
        td.updated { font-weight: bold; text-align: center; font-size: small; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <th rowspan="2">${new Date(stats[0].updated).toLocaleString()}</th>
          <th colspan="2">covid cases</th>
          <th colspan="2">close contact</th>
        </tr>
        <tr>
          <th>staff</th>
          <th>student</th>
          <th>staff</th>
          <th>student</th>
        </tr>
        ${stats
          .map(
            i => `
              <tr>
                <td>${i.school}</td>
                <td>${i.staffCovid}${diffBuilder(last, i, 'staffCovid')}</td>
                <td>${i.studentCovid}${diffBuilder(
              last,
              i,
              'studentCovid'
            )}</td>
                <td>${i.staffClose}${diffBuilder(last, i, 'staffClose')}</td>
                <td>${i.studentClose}${diffBuilder(
              last,
              i,
              'studentClose'
            )}</td>
              </tr>
            `
          )
          .join('')}
      </table>
    </body>
    </html>
  `

  last.updated = stats[0].updated
  last.data = stats.reduce((obj, i) => {
    obj[i.school] = i
    return obj
  }, {})
  await fs.writeFile('./last.json', JSON.stringify(last))

  await fs.writeFile('./index.html', html)
}

run().finally(() => {
  browser.close()
})
