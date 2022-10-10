import {
    DocumentContext,
    DocumentWrapper,
    Overlay,
    PageWrapper,
    ScrollContext,
    TransformContext,
    UiContext,
    ZoomInButton,
    ZoomOutButton,
    BoundingBoxType
} from '@allenai/pdf-components';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { BrowserRouter, Route } from 'react-router-dom';
import { isRegExp } from 'util';

import { Header } from './Header';
import { Outline } from './Outline';

const URL_DOI = window.location.pathname.split('/').pop();

export const Paper: React.FunctionComponent<RouteComponentProps> = () => {
    const { pageDimensions, numPages } = React.useContext(DocumentContext);
    const { rotation, scale } = React.useContext(TransformContext);
    const { setScrollRoot } = React.useContext(ScrollContext);

    // ref for the div in which the Document component renders
    const pdfContentRef = React.createRef<HTMLDivElement>();

    // ref for the scrollable region where the pages are rendered
    const pdfScrollableRef = React.createRef<HTMLDivElement>();

    const [DOI, setDOI] = React.useState(URL_DOI ? URL_DOI : '');

    const [scrollPosition, setScrollPosition] = React.useState(0);

    React.useEffect(() => {
        var identifier = localStorage.getItem('s2-paper-video-identifier');
        if (!identifier) {
            // generate random 16 character string
            const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('s2-paper-video-identifier', randomString);
            identifier = randomString;
        }

        const data = { doi: DOI, userId: identifier };
        logAction('enter', { 'condition': 'paper' });
    }, []);

    React.useEffect(() => {
        setScrollRoot(pdfScrollableRef.current || null);
    }, [pdfScrollableRef]);

    const handleScroll = (e: any) => {
        if (Math.abs(scrollPosition - e.target.scrollTop) > 5) {
            logAction('scroll', { scrollTop: e.target.scrollTop });
        }

        setScrollPosition(e.target.scrollTop);
    };

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
                if (data['message'] != 200) console.log('Error:', data);
            });
    }

    console.log('hey')

    return (
        <BrowserRouter>
            <Route path="/">
                <Header lockable={false} setLockable={(lockable: boolean) => null} />
                <div className="reader__container" onScroll={handleScroll}>
                    <DocumentWrapper
                        className="reader__main"
                        file={'/api/pdf/' + DOI + '.pdf'}
                        inputRef={pdfContentRef}>
                        <div className="reader__main-inner">
                            <Outline parentRef={pdfContentRef} />
                            <div className="reader__page-list" ref={pdfScrollableRef}>
                                {Array.from({ length: numPages }).map((_, i) => (
                                    <PageWrapper key={i} pageIndex={i}>
                                        <Overlay>
                                        </Overlay>
                                    </PageWrapper>
                                ))}
                            </div>
                        </div>
                    </DocumentWrapper>
                </div>
            </Route>
        </BrowserRouter>
    );
};
