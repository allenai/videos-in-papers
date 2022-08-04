/**
 * This is the main entry point for the UI. You should not need to make any
 * changes here unless you want to update the theme.
 *
 * @see https://github.com/allenai/varnish
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route } from 'react-router-dom';
import { VarnishApp } from '@allenai/varnish';

import '@allenai/varnish/theme.css';

import App from './App';

const VarnishedApp = () => (
    <App/>
);

ReactDOM.render(<VarnishedApp />, document.getElementById('root'));
