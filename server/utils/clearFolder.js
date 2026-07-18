import fs from 'fs-extra'

export function clearFolder (folderName) {
  if (!folderName) return

  fs.rmSync(folderName, {
    recursive: true
  })

  fs.emptyDir(folderName, (err) => {
    if (err) {
      console.error(`Ошибка при очистке содержимого папки ${folderName}:`, err)
    } else {
      console.log(`Содержимое папки ${folderName} успешно очищено.`)
    }
  })
}
