import { readFile, writeFile } from 'fs-extra'

function parseM3U (content) {
  const lines = content.split('\n')
  const playlist = []
  let currentEntry = {}

  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const [, metadataString, title] = line.match(/^#EXTINF:(.*),(.*)$/)
      const metadataPairs = metadataString.match(/(\w+="[^"]*")/g)

      const metadataObject = {}
      for (const pair of metadataPairs) {
        const [key, value] = pair.split('=')
        const trimmedKey = key.replace(/"/g, '')
        const trimmedValue = value.replace(/"/g, '')
        metadataObject[trimmedKey] = trimmedValue
      }

      currentEntry.duration = metadataObject
      currentEntry.title = title
    } else if (line && !line.startsWith('#')) {
      currentEntry.url = line
      playlist.push(currentEntry)
      currentEntry = {}
    }
  }

  return playlist
}

export async function playlistJson () {
  return new Promise((resolve, reject) => {
    readFile('./src/m3u/index.language.m3u', 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading the file:', err)
        // reject('Error reading path: ./src/m3u/index.language.m3u')
        return
      }

      const playlist = parseM3U(data)
      const jsonOutput = JSON.stringify(playlist, null, 2)

      writeFile('./src/m3u/playlist.json', jsonOutput, 'utf8', (err) => {
        if (err) {
          console.error('Error writing JSON to file:', err)
          // reject()
          return
        }
        resolve()
        console.log('Conversion complete. JSON playlist saved as playlist.json')
      })
    })
  })
}

// readFile('./src/m3u/index.language.m3u', 'utf8', (err, data) => {
//   if (err) {
//     console.error('Error reading the file:', err);
//     return;
//   }

//   const playlist = parseM3U(data);
//   const jsonOutput = JSON.stringify(playlist, null, 2);

//   writeFile('./src/m3u/playlist.json', jsonOutput, 'utf8', (err) => {
//     if (err) {
//       console.error('Error writing JSON to file:', err);
//       return;
//     }
//     console.log('Conversion complete. JSON playlist saved as playlist.json');
//   });
// });
