import fs from 'node:fs' // ◄ Используем встроенный модуль Node.js

export function clearFolder (folderName) {
  if (!folderName) return

  try {
    // 1. Полностью и безопасно удаляем папку со всем содержимым (force: true предотвратит ошибку, если папки нет)
    fs.rmSync(folderName, {
      recursive: true,
      force: true
    })

    // 2. Создаем её заново пустой — это нативный аналог fs.emptyDir
    fs.mkdirSync(folderName, { recursive: true })

    console.log(`Содержимое папки ${folderName} успешно очищено.`)
  } catch (err) {
    console.error(`Ошибка при очистке содержимого папки ${folderName}:`, err)
  }
}
