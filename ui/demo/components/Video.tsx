import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { BrowserRouter, Route } from 'react-router-dom';
import { isRegExp } from 'util';
import _ReactPlayer, { ReactPlayerProps } from 'react-player';

import { Caption } from '../types/clips';

const ReactPlayer = _ReactPlayer as unknown as React.FC<ReactPlayerProps>;

function timeToStr(time: number) {
    const dec = Math.floor(time / 10) % 100;
    const totalSec = Math.floor(time / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = Math.floor(totalSec % 60);
    return (
        (min < 10 ? '0' + min : min) +
        ':' +
        (sec < 10 ? '0' + sec : sec) +
        ';' +
        (dec < 10 ? '0' + dec : dec)
    );
}

const colors = ['#cb725e', '#d9a460', '#3e9d29', '#306ed3', '#07cead', '#9d58e1', '#dd59ba'];

const URL_DOI = window.location.pathname.split('/').pop();

export const Video: React.FunctionComponent<RouteComponentProps> = () => {
    const [DOI, setDOI] = React.useState(URL_DOI ? URL_DOI : '');
    const [captions, setCaptions] = React.useState<Array<Caption>>([]);

    const [isPlaying, setIsPlaying] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const [duration, setDuration] = React.useState(0);

    const [currentCaption, setCurrentCaption] = React.useState<number>(0);

    const [isHovered, setIsHovered] = React.useState(false);
    const [playbackRate, setPlaybackRate] = React.useState(1.0);

    const videoRef = React.useRef<ReactPlayerProps>(null);
    const captionRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        var identifier = localStorage.getItem('s2-paper-video-identifier');
        if (!identifier) {
          // generate random 16 character string
          const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          localStorage.setItem('s2-paper-video-identifier', randomString);
          identifier = randomString;
        }

        fetch('/api/captions/' + DOI + '.json')
            .then(res => res.json())
            .then(data => {
                setCaptions(
                data.map((c: { caption: string; start: number; end: number }, i: number) => {
                    return { ...c, id: i };
                })
                );
            });

        logAction('enter', { 'condition': 'video' });
    }, []);

    const logAction = (action: string, data: any) => {
        var timestamp = new Date().getTime();
        const formdata = { 
          doi: DOI, 
          userId: localStorage.getItem('s2-paper-video-identifier'),
          timestamp: timestamp,
          action: action,
          data: data
        };
        fetch('/api/log_action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formdata),
        })
          .then(response => response.json())
          .then(data => {
            if(data['message'] != 200) console.log('Error:', data);
          });
      }
    
    // Update progress (current time) as video plays
    const updateProgress = (e: any) => {
        if (videoRef.current) {
            let currentTime = e.playedSeconds;
            setProgress(currentTime);
            const captionIdx = captions.findIndex(
                c => c.start <= currentTime * 1000 && c.end > currentTime * 1000
            );
            if (captionIdx != -1) {
                setCurrentCaption(captionIdx);
                const captionTop = document.getElementById('caption-' + captionIdx)?.offsetTop;
                const divScrollTop = captionRef.current?.scrollTop;
                const divTop = captionRef.current?.offsetTop;
                const divHeight = captionRef.current?.offsetHeight;
                if (
                  captionTop != undefined &&
                  divTop != undefined &&
                  divScrollTop != undefined &&
                  divHeight != undefined
                ) {
                  if (
                    captionTop - divTop < divScrollTop - 10 ||
                    captionTop - divTop > divScrollTop + divHeight + 10
                  ) {
                    captionRef.current!.scrollTo(0, captionTop - divTop - 20);
                  }
                }
                setCurrentCaption(captionIdx);
            }
        }
    };

    const renderCaptions = () => {
        return captions.map((c, i) => {
            var style = {};
            if (currentCaption == i) {
                style = { backgroundColor: "#ddd" }
            }

            return (
                <div
                    key={i}
                    id={'caption-' + i}
                    className={'video__segmenter-transcript-container'}
                    style={{...style, cursor: "auto"}}>
                    <div
                        className="video__segmenter-transcript-timestamp"
                        style={currentCaption == i ? { color: '#1075ff' } : {}}>
                        {timeToStr(c['start'])}
                    </div>
                    <div className="video__segmenter-transcript-text">
                        {c['caption'].split(/\n| /).map((text: string, j) => {
                            let className = '';
                            return [
                                <span
                                    key={i + '-' + j}
                                    className={className}>
                                    {text}
                                </span>,
                                <span key={'space-' + i + '-' + j}>&nbsp;</span>,
                            ];
                        })}
                    </div>
                </div>
            );
        });
    };

    function handlePlay(isPlay: boolean) {
        setIsPlaying(isPlay);
        if (isPlay) {
            logAction('play', {clipId: -1});
        } else {
            logAction('pause', {clipId: -1});
        }
    }

    function handleSeek(seconds: number) {
        logAction('scrubVideo', { clipId: -1, seconds: seconds, location: '' });
    }

    function handlePlaybackRate(rate: number) {
        setPlaybackRate(rate);
        logAction('changePlaybackRate', { clipId: -1, rate: rate });
    }

    const adjustedVideoWidth = 800;
    const videoHeight = (adjustedVideoWidth / 16) * 9;

    return (
        <BrowserRouter>
            <Route path="/">
                <div className="video__segmenter-container" style={{backgroundColor: "#666"}}>
                    <div className="video__segmenter-container-inner" style={{display: "flex", alignItems: "center", paddingTop: "16px", width: "100%", backgroundColor: "#ddd"}}>
                        <div
                            style={{ width: adjustedVideoWidth + 'px', height: videoHeight + 'px', position: 'relative' }}
                            onClick={e => e.stopPropagation()}
                            onMouseOver={() => setIsHovered(true)} 
                            onMouseLeave={() => setIsHovered(false)}>
                            <ReactPlayer
                                ref={videoRef}
                                url={'/api/clips/' + DOI + '/full.mp4'}
                                playing={isPlaying}
                                controls={true}
                                onPlay={() => handlePlay(true)}
                                onPause={() => handlePlay(false)}
                                onReady={e => {
                                    videoRef.current == null ? 0 : setDuration(videoRef.current.getDuration());
                                }}
                                onProgress={e => {
                                    updateProgress(e);
                                }}
                                onSeek={e => {
                                    handleSeek(e);
                                }}
                                progressInterval={100}
                                width="100%"
                                height="100%"
                                playbackRate={playbackRate}
                                light={false}
                            />
                            {isHovered ? 
                            <div className="video__note-player-rate-tray">
                                {[1.0, 1.25, 1.5, 1.75, 2.0].map((rate, i) => {
                                return (
                                    <div 
                                    key={i}
                                    className="video__note-player-rate"
                                    style={rate == playbackRate? {backgroundColor: "#1890ff", fontWeight: "bold", color: "#f6f6f6"} : {}}
                                    onClick={() => handlePlaybackRate(rate)}>
                                    {(rate == 1 || rate == 2) ? rate + '.00' : (rate == 1.5 ? rate + '0' : rate)}
                                    </div>
                                )
                                })}
                            </div> 
                            : ''
                            }
                        </div>
                        <div className="video__segmenter-transcript" ref={captionRef} style={{ width: adjustedVideoWidth + 'px' }}>
                            {renderCaptions()}
                        </div>
                    </div>
                    <div className="video__segmenter-placeholder" style={{ width: adjustedVideoWidth + 'px' }}></div>
                </div>
            </Route>
        </BrowserRouter>
    );
}
