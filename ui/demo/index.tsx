/**
 * This is the main entry point for the UI. You should not need to make any
 * changes here.
 */

import { ContextProvider } from '@allenai/pdf-components';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter, Route } from 'react-router-dom';

import { Reader } from './components/Reader';
import { Author } from './components/Author';

const App = () => (
  <ContextProvider>
    <BrowserRouter>
      <Route path="/" component={Author} />
    </BrowserRouter>
  </ContextProvider>
);

ReactDOM.render(<App />, document.getElementById('root'));
