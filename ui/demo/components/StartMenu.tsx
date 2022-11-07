import { off } from 'process';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { BrowserRouter, Route } from 'react-router-dom';

export const StartMenu: React.FunctionComponent<RouteComponentProps> = () => {
  const [viewable, setViewable] = React.useState(false);

  const [doi, setDoi] = React.useState('');
  const [paperUrl, setPaperUrl] = React.useState('');
  const [paperFile, setPaperFile] = React.useState<File | null>(null);
  const [videoUrl, setVideoUrl] = React.useState('');
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [captionFile, setCaptionFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [paperProcessed, setPaperProcessed] = React.useState(0);
  const [videoProcessed, setVideoProcessed] = React.useState(0);
  const [finished, setFinished] = React.useState(false);
  const [token, setToken] = React.useState('');

  const [videoErrorMsg, setVideoErrorMsg] = React.useState('');
  const [paperErrorMsg, setPaperErrorMsg] = React.useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const key = urlParams.get('key');

  React.useEffect(() => {
    if (key) {
      fetch('/api/check_start_key/' + key)
        .then((res) => res.json())
        .then((data) => {
          setViewable(data.correct);
        });
    }
  }, []);

  const handleSubmit = () => {
    if (paperUrl.length == 0 && paperFile == null) return;
    if (videoUrl.length == 0 && (videoFile == null || captionFile == null)) return;
    if (doi.length == 0) return;
    if (submitting || finished) return;

    setSubmitting(true);

    if(paperUrl.length > 0) {
      let data = { doi: doi, url: paperUrl };
      fetch('/api/process_paper_url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then(response => {
          if (response.status == 504) return { message: 504 };
          else return response.json();
        })
        .then(result => {
          if (result.message == 200) {
            setPaperProcessed(1);
            setToken(result.token);
          } else if (result.message == 504) {
            setTimeout(() => {
              setPaperProcessed(1);
            }, 30000);
          } else {
            alert('Error processing paper');
            console.log(result.error);
            setPaperProcessed(-1);
            setPaperErrorMsg(result.error);
          }
        })
        .catch((error) => {
          alert('Error processing paper');
          console.log(error);
          setPaperProcessed(-1);
          setPaperErrorMsg(error);
        });
    } else if(paperFile) {
      let data = new FormData();
      data.append('doi', doi);
      data.append('file', paperFile);
      fetch('/api/process_paper_file', {
        method: 'POST',
        body: data,
      })
        .then(response => {
          if (response.status == 504) return { message: 504 };
          else return response.json();
        })
        .then(result => {
          if (result.message == 200) {
            setPaperProcessed(1);
            setToken(result.token);
          } else if (result.message == 504) {
            setTimeout(() => {
              setPaperProcessed(1);
            }, 30000);
          } else {
            alert('Error processing paper');
            console.log(result.error);
            setPaperProcessed(-1);
            setPaperErrorMsg(result.error);
          }
        })
        .catch((error) => {
          alert('Error processing paper');
          console.log(error);
          setPaperProcessed(-1);
          setPaperErrorMsg(error);
        });
    }

    if(videoUrl.length > 0) {
      let data = { doi: doi, url: videoUrl };
      fetch('/api/process_video_url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then(response => {
          return response.json();
        })
        .then(result => {
          if (result.message == 200) {
            setVideoProcessed(1);
          } else {
            alert('Error processing video');
            console.log(result.error);
            setVideoProcessed(-1);
            setVideoErrorMsg(result.error);
          }
        })
        .catch((error) => {
          alert('Error processing video');
          console.log(error);
          setVideoProcessed(-1);
          setVideoErrorMsg(error);
        });
    } else {
      if(videoFile) {
        let data = new FormData();
        data.append('doi', doi);
        data.append('file', videoFile);
        fetch('/api/process_video_file', {
          method: 'POST',
          body: data,
        })
          .then(response => {
            return response.json();
          })
          .then(result => {
            if (result.message == 200) {
              setVideoProcessed(1);
            } else {
              alert('Error processing video');
              console.log(result.error);
              setVideoProcessed(-1);
              setVideoErrorMsg(result.error);
            }
          })
          .catch((error) => {
            alert('Error processing video');
            console.log(error);
            setVideoProcessed(-1);
            setVideoErrorMsg(error);
          });
      }
      if(captionFile) {
        let data = new FormData();
        data.append('doi', doi);
        data.append('file', captionFile);
        fetch('/api/process_caption_file', {
          method: 'POST',
          body: data,
        })
          .then(response => {
            return response.json();
          })
          .then(result => {
            if (result.message == 200) {
              setVideoProcessed(2);
            } else {
              alert('Error processing captions');
              console.log(result.error);
              setVideoProcessed(-1);
              setVideoErrorMsg(result.error);
            }
          })
          .catch((error) => {
            alert('Error processing video');
            console.log(error);
            setVideoProcessed(-1);
            setVideoErrorMsg(error);
          });
      }
    } 
  };

  React.useEffect(() => {
    if (paperProcessed != 1 || videoProcessed != 1) {
      return;
    }
    setFinished(true);
    setSubmitting(false);
  }, [paperProcessed, videoProcessed]);

  if(!viewable) {
    return <></>;
  }

  return (
    <BrowserRouter>
      <Route path="/">
        <div style={{height: "100vh", overflowY: "scroll"}}>
          <div className="startmenu__container">
            <div className="startmenu__info">
              Welcome CSCW authors!<br/><br/>
              To start making your Papeos, you need to first upload your paper and talk video.<br/><br/>
              <b>For the DOI,</b> enter the doi ID for your paper. It should be of the form <b>"10.1145/XXXXXX</b>.<br/><br/>
              <b>For the paper</b>, you can upload your PDF file OR provide a URL to the paper.<br/>
              In certain cases, the system might fail to process your PDF. In this case, we suggest that you try compiling from Overleaf and uploading that file.<br/><br/>
              <b>For the video</b>, you can upload you video file and caption file (.vtt, .srt), OR provide a Youtube URL to your video.<br/>
              Note that, for the Youtube URL, the Youtube video should have English captions.<br/><br/>
              If issues or errors persist with the uploading, feel free to contact <b>taesoo.kim@kaist.ac.kr</b> with the shown error code.<br/><br/>
              For more information, refer to <a href="https://docs.google.com/document/d/1ZuRS0CREp_ApnzEWhxKSdiyzp0B7zBF3Ip05l5Nt5Dc/edit?usp=sharing" target="_blank">this tutorial document</a>.
            </div>
            <div className="startmenu__row">
              <div>Your paper's DOI or ArXiv ID:</div>
              <input
                value={doi}
                placeholder="Type or paste the url..."
                onChange={e => (submitting || finished ? null : setDoi(e.target.value))}
              />{' '}
            </div>
            <div className="startmenu__row">
              <div>Your PDF's URL:</div>
              <input
                value={paperUrl}
                placeholder="Type or paste the url..."
                onChange={e => (submitting || finished ? null : setPaperUrl(e.target.value))}
              />
            </div>
            <div className="startmenu__row">
              <div>PDF File</div>
              <input 
                type="file" name="file" 
                onChange={e => {
                  if (submitting || finished) {
                    return;
                  } else if(e.target.files != null) {
                    setPaperFile(e.target.files[0])
                  }
                }}
              />
            </div>
            <div className="startmenu__row">
              <div>YouTube URL:</div>
              <input
                value={videoUrl}
                placeholder="Type or paste the url..."
                onChange={e => (submitting || finished ? null : setVideoUrl(e.target.value))}
              />
            </div>
            <div className="startmenu__row">
              <div>Video File</div>
              <input 
                type="file" name="file" 
                onChange={e => {
                  if(submitting || finished) {
                    return;
                  } else if(e.target.files != null) {
                    setVideoFile(e.target.files[0])
                  }
                }}
              />
            </div>
            <div className="startmenu__row">
              <div>Caption File</div>
              <input 
                type="file" name="file" 
                onChange={e => {
                  if(submitting || finished) {
                    return;
                  } else if(e.target.files != null) {
                    setCaptionFile(e.target.files[0])
                  }
                }}
              />
            </div>
            <div className="startmenu__row">
              <button
                className="startmenu__button"
                onClick={handleSubmit}
                style={submitting || finished ? { backgroundColor: '#ccc', cursor: 'auto' } : {}}
              >
                Submit
              </button>
            </div>
            {submitting ? (
              <div className="lds-ring">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            ) : (
              ''
            )}
            {videoProcessed == -1
              ? 'Error processing video...\n' + videoErrorMsg
              : videoProcessed == 1
              ? 'Video processing finished!'
              : ''}
            <br />
            {paperProcessed == -1
              ? 'Error processing paper...' + paperErrorMsg
              : paperProcessed == 1
              ? 'Paper processing finished!'
              : ''}
            {finished ? (
              <div className="startmenu__row">
                Move to annotating:
                <a href={'https://' + window.location.hostname + '/author/' + doi.replace('/', '.') + '?author_token=' + token}>
                  {'https://' + window.location.hostname + '/author/' + doi.replace('/', '.') + '?author_token=' + token}
                </a>
              </div>
            ) : (
              ''
            )}
          </div>
        </div>
      </Route>
    </BrowserRouter>
  );
};