import { off } from 'process';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { BrowserRouter, Route } from 'react-router-dom';

export const StartMenu: React.FunctionComponent<RouteComponentProps> = () => {
  const [doi, setDoi] = React.useState('');
  const [paperUrl, setPaperUrl] = React.useState('');
  const [videoUrl, setVideoUrl] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [paperProcessed, setPaperProcessed] = React.useState(0);
  const [videoProcessed, setVideoProcessed] = React.useState(0);
  const [finished, setFinished] = React.useState(false);

  // https://mingyin.org/paper/CHI-22/multiple-camera.pdf
  // https://www.youtube.com/watch?v=HBcDELI9ZNE
  const handleSubmit = () => {
    if (paperUrl.length == 0 || videoUrl.length == 0 || doi.length == 0) return;
    if (submitting || finished) return;

    setSubmitting(true);

    let data = { doi: doi, url: paperUrl };
    fetch('/api/process_paper', {
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
        } else if (result.message == 504) {
          setTimeout(() => {
            setPaperProcessed(1);
          }, 30000);
        } else {
          setPaperProcessed(-1);
        }
      });

    data = { doi: doi, url: videoUrl };
    fetch('/api/process_video', {
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
          setVideoProcessed(-1);
        }
      });
  };

  React.useEffect(() => {
    if (paperProcessed != 1 || videoProcessed != 1) {
      return;
    }
    setFinished(true);
    setSubmitting(false);
  }, [paperProcessed, videoProcessed]);

  return (
    <BrowserRouter>
      <Route path="/">
        <div className="startmenu__container">
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
            <div>Your video's URL:</div>
            <input
              value={videoUrl}
              placeholder="Type or paste the url..."
              onChange={e => (submitting || finished ? null : setVideoUrl(e.target.value))}
            />
          </div>
          <div className="startmenu__row">
            <button
              className="startmenu__button"
              onClick={handleSubmit}
              style={submitting || finished ? { backgroundColor: '#ccc', cursor: 'auto' } : {}}>
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
            ? 'Error processing video...'
            : videoProcessed == 1
            ? 'Video processing finished!'
            : ''}
          <br />
          {paperProcessed == -1
            ? 'Error processing paper...'
            : paperProcessed == 1
            ? 'Paper processing finished!'
            : ''}
          {finished ? (
            <div className="startmenu__row">
              Move to annotating:
              <a href={'https://' + window.location.hostname + '/author/' + doi}>
                {'https://' + window.location.hostname + '/author/' + doi}
              </a>
            </div>
          ) : (
            ''
          )}
        </div>
      </Route>
    </BrowserRouter>
  );
};
