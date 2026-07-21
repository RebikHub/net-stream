import { useCallback, useEffect, useState } from 'react'
import css from './Torrent.module.scss'
import { useEventSource } from '../../services/sse-hook/useEventSource'
import {
  getStreamLink,
  getStreamStop,
  postStreamAddMagnet,
  startVLCPlayer,
} from '../../services/api'
import { catchError } from '../../services/utils/catchError'

export const Torrent = () => {
  const [input, setInput] = useState<string | null>(null)
  const [listMovies, setListMovies] = useState<{
    list: Array<{
      name: string
      length: number
    }>
    hash: string
  }>({ list: [], hash: '' })
  const { eventSourceData, clearEventSource, startEventSource } =
    useEventSource()

  const [isLoading, setLoading] = useState(false)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)

  const play = useCallback((): void => {
    try {
      if (input) {
        setLoading(true)
        postStreamAddMagnet(input)
          .then(({ files, infoHash }) => {
            console.log(files)
            startEventSource(infoHash)
            setListMovies({ list: files, hash: infoHash })
          })
          .catch((error: any) => {
            console.error('Error adding magnet:', error)
          }).finally(() => {
            setLoading(false)
          })
      }
    } catch (error) {
      console.error(error)
    }
  }, [input, startEventSource])

  const choseMovie = useCallback((type: 'vlc' | 'html', nameMovie: string): void => {
    if (type === 'vlc') {
      startVLCPlayer(listMovies.hash, nameMovie)
        .then((res) => {
          console.log('vlc start: ', res)
        })
        .catch(catchError)
    } else {
      getStreamLink(listMovies.hash, nameMovie).then((res) => {
        setVideoSrc(res.url)
      })
      .catch(catchError)
    }
  }, [listMovies.hash])

  const stop = useCallback((magnet: string) => {
    clearEventSource()
    getStreamStop(magnet).catch(catchError)
  }, [clearEventSource])

  const cancel = useCallback((): void => {
    if (listMovies.hash) {
      stop(listMovies.hash)
    }
    setInput('')
    setListMovies({ list: [], hash: '' })
  }, [stop, listMovies.hash])

  useEffect(() => {
    return () => {
      clearEventSource()
    }
  }, [clearEventSource])

  // useEffect(() => {
  //   if (input) {
  //     stop(input)
  //   }

  //   return () => {
  //     if (input) {
  //       stop(input)
  //     }
  //   }
  // }, [stop, input])

  return (
    <div className={css.container}>
      <h4 className={css.header}>Torrent Stream</h4>

      <div className={css.main}>
        <div className={css.controls}>
          <input
            className={css.input}
            type="text"
            value={input || ''}
            placeholder="Past magnet"
            onChange={(e) => setInput(e.target.value)}
          />
          <div className={css.buttons}>
            <button onClick={play}>Play</button>
            <button onClick={cancel}>Cancel</button>
            <button onClick={() => {
              if (listMovies.hash)
              stop(listMovies.hash)
            }
            }>Stop</button>
          </div>
          {eventSourceData && (
            <div>
              {/* <p>{error}</p> */}
              <p>
                Download speed:{' '}
                {(eventSourceData.speed / 1048576).toFixed(2) || ''} mb/s
              </p>
              <p>
                Progress: {(eventSourceData.progress * 100).toFixed(1) || ''} %
              </p>
              <p>Ratio: {eventSourceData.ratio || ''}</p>
            </div>
          )}
          {videoSrc ? <div className={css.videoWrapper}>
            <div className={css.closeVideo} onClick={() => setVideoSrc(null)}>X</div>
            <video
              src={videoSrc}
              controls
            />
          </div> :
            <>
              {listMovies.list.length === 1 ? (
                <div
                  className={css.item}
                >
                  {listMovies.list[0].name}
                  <div className={css.itemBtn}>
                    <span onClick={() => choseMovie('vlc', listMovies.list[0].name)}>смотреть через VLC</span>
                    <span onClick={() => choseMovie('html', listMovies.list[0].name)}>смотреть через HTML</span>
                  </div>
                </div>
              ) : listMovies.list.length > 0 ? (
                <div className={css.list}>
                  {listMovies.list.map((item: any) => (
                    <div
                      key={item.name}
                      className={css.item}
                    >
                      {item.name}
                      <div className={css.itemBtn}>
                        <span onClick={() => choseMovie('vlc', item.name)}>смотреть через VLC</span>
                        <span onClick={() => choseMovie('html', item.name)}>смотреть через HTML</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : isLoading ? <p>Loading...</p> : null}
</>
          }
        </div>
      </div>
    </div>
  )
}
