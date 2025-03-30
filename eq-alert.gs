const latitude = '' // Your home's latitude
const longitude = '' // Your home's longitude

async function mainFuntion() {
  const eqInfo = await getEQInfo()
  if (!eqInfo) return
  if (eqInfo.features.length === 0) return

  const htmlContent = buildMsgForBroadcast(eqInfo.features)

  const url = `https://chat.googleapis.com/v1/spaces/:id/messages?key=:key&token=:token`
  const options = {
    method: "post",
    contentType: "text/html",
    payload: JSON.stringify(htmlContent)
  }
  UrlFetchApp.fetch(url, options)
}

function getCode(text) {
  switch (text) {
    case 'red':
      return `${text} 🔴`
    case 'orange':
      return `${text} 🟠`
    case 'yellow':
      return `${text} 🟡`
    case 'green':
      return `${text} 🟢`
    default:
      return '-'
  }
}

function buildMsgForBroadcast(features) {
  return {
    cardsV2: features.map(feature => {
      const [long, lat, depth] = feature.geometry.coordinates
      return {
        card: {
          header: {
            title: `🚨 Earthquake Alert: Mag. ${feature.properties.mag ?? '-'} 🚨`,
            imageUrl: 'https://tewtermor.github.io/warning.png',
            subtitle: Utilities.formatDate(new Date(feature.properties.time), Session.getScriptTimeZone(), "dd MMMM yyyy | HH:mm:ss")
          },
          sections: [
            {
              header: 'Info by USGS:',
              widgets: [
                {
                  textParagraph: {
                    text: `📢 <b>Alert: </b> ${getCode(feature.properties.alert)}`
                  }
                },
                {
                  textParagraph: {
                    text: `🗺️ <b>Place: </b> ${feature?.properties?.place ?? '-'}`
                  }
                },
                {
                  textParagraph: {
                    text: `📈 <b>Magnitude: </b> ${feature?.properties?.mag ?? '-'}`
                  }
                },
                {
                  textParagraph: {
                    text: `📐 <b>Depth: </b> ${depth ?? '-'} km.`
                  }
                },
                {
                  textParagraph: {
                    text: `🏡 <b>Distance from: </b> ${calculateDistance(Number(latitude), Number(longitude), lat, long).toFixed()} km.`
                  }
                },
                {
                  textParagraph: {
                    text: `📄 <b>Status: </b> ${feature?.properties?.status ?? '-'}`
                  }
                },
                {
                  buttonList: {
                    buttons: [
                      {
                        text: 'View More',
                        icon: { materialIcon: { name: 'link' } },
                        onClick: {
                          openLink: {
                            url: feature?.properties?.url
                          }
                        }
                      },
                      {
                        text: 'View Map',
                        icon: { materialIcon: { name: 'map' } },
                        onClick: {
                          openLink: {
                            url: `https://www.google.com/maps?q=${lat},${long}`
                          }
                        }
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }
      }
    })
  }
}

function getEQInfo() {
  const radiusKm = 2000
  const minMagnitude = 4.5
  const endTime = new Date()
  const MILLIS_PER_MINUTE = 1000 * 60
  const startTime = new Date(endTime.getTime() - MILLIS_PER_MINUTE)

  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime.toISOString()}&endtime=${endTime.toISOString()}&orderby=magnitude&minmagnitude=${minMagnitude}&latitude=${latitude}&longitude=${longitude}&maxradiuskm=${radiusKm}`

  const options = {
    "method": "GET",
    "headers": {"Content-Type": "application/json; charset=UTF-8"},
  }
  const response = UrlFetchApp.fetch(url, options)
  if (response && response.getResponseCode() === 200) {
    const data = JSON.parse(response.getContentText())
    return data
  }
  return false
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the Earth in km
  var dLat = toRadians(lat2 - lat1);
  var dLon = toRadians(lon2 - lon1);

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);

  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var distance = R * c; // Distance in km

  return distance;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function createTimeDrivenTriggers() {
  // Trigger every 1 minutes.
  ScriptApp.newTrigger('mainFuntion')
      .timeBased()
      .everyMinutes(1)
      .create()
}
