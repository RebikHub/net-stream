export async function checkUrl (url) {
  if (
    url.includes('rtsp:') ||
    url.includes('mmsh:') ||
    url.includes('uhttp:')
  ) {
    return false
  }

  try {
    // Делаем быстрый HEAD-запрос (только заголовки, без скачивания тела страницы)
    // AbortSignal.timeout(3000) жестко прервет запрос через 3 секунды, если сервер «завис»
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    })

    if (response.status === 200) {
      console.log('link ok: ', url)
      return true
    }

    return false
  } catch (err) {
    // Сюда мы попадем и при ошибке сети, и при таймауте в 3 секунды
    console.log('error-link or timeout:', url)
    return false
  }
}

export async function checkWorkedUrl (list, url) {
  const filteredPromises = list.map(async (item) => {
    const result = await checkUrl(item)
    return { item, result }
  })

  const filteredResults = await Promise.all(filteredPromises)
  const workedUrl = filteredResults.find(({ result }) => result)

  // В JavaScript изменение пришедшего аргумента `url = ...` не изменит переменную снаружи функции.
  // Лучше возвращать результат через return, как вы закомментировали ниже:
  return workedUrl ? workedUrl.item : null
}

export async function checkUrls (list) {
  const filteredPromises = list.map(async (item) => {
    const result = await checkM3U8Stream(item.url)
    return { item, result }
  })

  const filteredResults = await Promise.all(filteredPromises)

  const filteredArray = filteredResults
    .filter(({ result }) => result)
    .map(({ item }) => item)

  console.log('Checking complete!')
  return filteredArray
}

async function checkM3U8Stream (url) {
  try {
    // Нативный fetch вместо axios.get
    // Ограничиваем таймаут в 5 секунд, чтобы проверка плейлистов не длилась вечно
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })

    if (response.status === 200) {
      const text = await response.text() // Получаем содержимое как текст
      return text.includes('#EXTM3U')
    }

    return false
  } catch (error) {
    return false
  }
}
