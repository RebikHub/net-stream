export const parsePlaylist = (data) => {
  const lines = data.split('\n')
  // Создаем массив для хранения результатов
  const result = []

  // Перебираем каждую строку
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Проверяем, является ли строка началом блока с данными
    if (line.startsWith('#EXTINF:-1')) {
      // Извлекаем необходимые данные из строки
      const name = line.split(',')[1].trim()
      let url = ''
      if (lines[i + 1].startsWith('http') && lines[i + 1].endsWith('.m3u8')) {
        url = lines[i + 1]
      }

      if (url) {
        const channel = {
          id: name.toLowerCase().replace(/ /g, ''),
          name,
          logo: '',
          url,
          website: ''
        }

        // Добавляем объект в результат
        result.push(channel)
      }
    }
  }

  return result
}
