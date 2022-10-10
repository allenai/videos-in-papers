/**
 * This is the main entry point for the UI. You should not need to make any
 * changes here.
 */

import { ContextProvider } from '@allenai/pdf-components';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter, Route } from 'react-router-dom';

import { Author } from './components/Author';
import { Reader } from './components/Reader';
import { Paper } from './components/Paper';
import { Video } from './components/Video';
import { StartMenu } from './components/StartMenu';

const App = () => (
  <ContextProvider>
    <BrowserRouter>
      <Route path="/reader" component={Reader} />
      <Route path="/paper" component={Paper} />
      <Route path="/video" component={Video} />
      <Route path="/author" component={Author} />
      <Route path="/start" component={StartMenu} />
    </BrowserRouter>
  </ContextProvider>
);

ReactDOM.render(<App />, document.getElementById('root'));
